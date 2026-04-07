"""
focus/views.py
--------------
FocusSession API endpoints — all student-only.

Endpoints:
  POST   /api/focus/sessions/start/           start_session
  GET    /api/focus/sessions/                 list (history, supports ?mode=&status=&ordering=)
  GET    /api/focus/sessions/active/          active session for student
  GET    /api/focus/sessions/stats/           aggregated history stats
  DELETE /api/focus/sessions/<id>/            delete single session
  POST   /api/focus/sessions/clear_history/   bulk delete all ended sessions
  GET    /api/focus/sessions/<id>/            retrieve
  POST   /api/focus/sessions/<id>/pause/
  POST   /api/focus/sessions/<id>/take_break/
  POST   /api/focus/sessions/<id>/resume/
  POST   /api/focus/sessions/<id>/end/
  POST   /api/focus/sessions/<id>/sync_timer/
  GET    /api/focus/suggestions/              timer suggestions (pass ?topic_id=)
"""
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Avg, Q
from datetime import timedelta

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStudent
from courses.models import Subject, Topic, Content

from .models import FocusSession
from .serializers import (
    FocusSessionSerializer,
    StartSessionSerializer,
    UpdateTimerSerializer,
    TimerSuggestionSerializer,
)
from .services import get_timer_suggestions


class FocusSessionViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for FocusSession (student-scoped).
    List supports ?mode=normal|strict, ?status=completed|abandoned, ?ordering=-start_time|start_time.
    History filtering: ?time=7d|30d|all (default all).
    """
    serializer_class = FocusSessionSerializer
    permission_classes = [IsStudent]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['start_time', 'total_focus_seconds']
    ordering = ['-start_time']  # newest first by default

    def get_queryset(self):
        qs = FocusSession.objects.filter(
            student=self.request.user
        ).select_related('subject', 'topic', 'content_item')

        # ── Mode filter ──
        mode = self.request.query_params.get('mode')
        if mode in ('normal', 'strict'):
            qs = qs.filter(mode=mode)

        # ── Status filter ──
        session_status = self.request.query_params.get('status')
        if session_status:
            statuses = session_status.split(',')
            qs = qs.filter(status__in=statuses)

        # ── Time range filter ──
        time_range = self.request.query_params.get('time')
        if time_range == '7d':
            qs = qs.filter(start_time__gte=timezone.now() - timedelta(days=7))
        elif time_range == '30d':
            qs = qs.filter(start_time__gte=timezone.now() - timedelta(days=30))

        return qs

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/focus/sessions/<id>/ — delete a single session (student's own only)."""
        session = get_object_or_404(FocusSession, pk=kwargs['pk'], student=request.user)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Bulk delete all ended sessions ─────────────────────────────
    @action(detail=False, methods=['delete'], url_path='clear_history')
    def clear_history(self, request):
        """
        DELETE /api/focus/sessions/clear_history/
        Deletes all completed + abandoned sessions for the current student.
        Active/paused/break sessions are preserved.
        """
        mode = request.query_params.get('mode')  # optional: only clear 'strict' or 'normal'
        qs = FocusSession.objects.filter(
            student=request.user,
            status__in=['completed', 'abandoned'],
        )
        if mode in ('normal', 'strict'):
            qs = qs.filter(mode=mode)
        deleted_count, _ = qs.delete()
        return Response({'deleted': deleted_count}, status=status.HTTP_200_OK)

    # ── Aggregated history stats ────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='stats')
    def history_stats(self, request):
        """
        GET /api/focus/sessions/stats/
        Returns aggregated statistics for the student's focus history.
        Supports ?time=7d|30d|all and ?mode=normal|strict.
        """
        qs = self.get_queryset()  # already applies mode + time filters

        ended = qs.filter(status__in=['completed', 'abandoned'])
        completed = ended.filter(status='completed')

        totals = ended.aggregate(
            total_focus_seconds=Sum('total_focus_seconds'),
            total_break_seconds=Sum('total_break_seconds'),
            total_sessions=Count('id'),
            avg_focus_seconds=Avg('total_focus_seconds'),
        )

        total_sessions = totals['total_sessions'] or 0
        completed_count = completed.count()
        total_focus_seconds = totals['total_focus_seconds'] or 0
        avg_focus_seconds = totals['avg_focus_seconds'] or 0

        return Response({
            'total_sessions': total_sessions,
            'completed_sessions': completed_count,
            'abandoned_sessions': total_sessions - completed_count,
            'success_rate': round((completed_count / total_sessions * 100), 1) if total_sessions else 0,
            'total_focus_hours': round(total_focus_seconds / 3600, 2),
            'total_focus_minutes': round(total_focus_seconds / 60, 1),
            'avg_session_minutes': round(avg_focus_seconds / 60, 1),
            'total_break_minutes': round((totals['total_break_seconds'] or 0) / 60, 1),
        })

    # ── Start a new session ────────────────────────────────────────
    @action(detail=False, methods=['post'], url_path='start')
    def start_session(self, request):
        """
        POST /api/focus/sessions/start/
        Start a new focus session (abandons any current active one).
        """
        ser = StartSessionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        # Resolve FK objects (null-safe)
        subject = get_object_or_404(Subject, pk=d['subject_id'])
        topic_id = d.get('topic_id')
        topic = Topic.objects.filter(pk=topic_id).first() if topic_id else None
        content_id = d.get('content_id')
        content_item = Content.objects.filter(pk=content_id).first() if content_id else None

        # Get suggestions for metadata storage
        suggestions = get_timer_suggestions(request.user, topic)

        # Abandon any existing active session
        FocusSession.objects.filter(
            student=request.user,
            status__in=['active', 'paused', 'break'],
        ).update(status='abandoned', end_time=timezone.now())

        session = FocusSession.objects.create(
            student=request.user,
            subject=subject,
            topic=topic,
            content_item=content_item,
            session_goal=d['session_goal'],
            mode=d['mode'],
            status='active',
            selected_focus_minutes=d['selected_focus_minutes'],
            selected_break_minutes=d['selected_break_minutes'],
            suggested_focus_minutes=suggestions['suggested_focus_minutes'],
            suggested_break_minutes=suggestions['suggested_break_minutes'],
            suggestion_source=suggestions['source'],
        )
        return Response(
            FocusSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )

    # ── Get active session ─────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='active')
    def active_session(self, request):
        """GET /api/focus/sessions/active/ — returns the current active session or 404."""
        session = FocusSession.objects.filter(
            student=request.user,
            status__in=['active', 'paused', 'break'],
        ).first()
        if not session:
            return Response({'detail': 'No active session.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(FocusSessionSerializer(session).data)

    # ── Sync timer (frontend heartbeat) ───────────────────────────
    @action(detail=True, methods=['post'], url_path='sync_timer')
    def sync_timer(self, request, pk=None):
        """
        POST /api/focus/sessions/<id>/sync_timer/
        Frontend periodically sends elapsed focus seconds so we store progress.
        """
        session = get_object_or_404(FocusSession, pk=pk, student=request.user)
        if session.status != 'active':
            return Response({'detail': 'Session is not active.'}, status=status.HTTP_400_BAD_REQUEST)

        ser = UpdateTimerSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        session.total_focus_seconds = ser.validated_data['focus_seconds_elapsed']
        session.save(update_fields=['total_focus_seconds'])
        return Response({'status': 'synced', 'total_focus_seconds': session.total_focus_seconds})

    # ── Pause ──────────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        session = get_object_or_404(FocusSession, pk=pk, student=request.user)
        if session.status != 'active':
            return Response({'detail': 'Session is not active.'}, status=status.HTTP_400_BAD_REQUEST)
        session.status = 'paused'
        session.interruption_count += 1
        session.save(update_fields=['status', 'interruption_count'])
        return Response(FocusSessionSerializer(session).data)

    # ── Take a break ───────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='take_break')
    def take_break(self, request, pk=None):
        session = get_object_or_404(FocusSession, pk=pk, student=request.user)
        if session.status not in ('active', 'paused'):
            return Response({'detail': 'Cannot start break from current status.'}, status=status.HTTP_400_BAD_REQUEST)
        session.status = 'break'
        session.break_count += 1
        session.break_started_at = timezone.now()
        session.save(update_fields=['status', 'break_count', 'break_started_at'])
        return Response(FocusSessionSerializer(session).data)

    # ── Resume from break/pause ────────────────────────────────────
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        session = get_object_or_404(FocusSession, pk=pk, student=request.user)
        if session.status not in ('paused', 'break'):
            return Response({'detail': 'Session is already active or ended.'}, status=status.HTTP_400_BAD_REQUEST)

        # Accumulate break time if coming from break
        if session.status == 'break' and session.break_started_at:
            elapsed = (timezone.now() - session.break_started_at).total_seconds()
            session.total_break_seconds += int(elapsed)
            session.break_started_at = None

        session.status = 'active'
        session.save(update_fields=['status', 'total_break_seconds', 'break_started_at'])
        return Response(FocusSessionSerializer(session).data)

    # ── End session ────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        session = get_object_or_404(FocusSession, pk=pk, student=request.user)
        if session.status in ('completed', 'abandoned'):
            return Response({'detail': 'Session already ended.'}, status=status.HTTP_400_BAD_REQUEST)

        # Finalize any open break
        if session.status == 'break' and session.break_started_at:
            elapsed = (timezone.now() - session.break_started_at).total_seconds()
            session.total_break_seconds += int(elapsed)
            session.break_started_at = None

        session.status = 'completed'
        session.end_time = timezone.now()
        session.save(update_fields=['status', 'end_time', 'total_break_seconds', 'break_started_at'])
        return Response(FocusSessionSerializer(session).data)

    # ── Abandon (Exit) session ─────────────────────────────────────
    @action(detail=True, methods=['post'])
    def abandon(self, request, pk=None):
        session = get_object_or_404(FocusSession, pk=pk, student=request.user)
        if session.status in ('completed', 'abandoned'):
            return Response({'detail': 'Session already ended.'}, status=status.HTTP_400_BAD_REQUEST)
        session.status = 'abandoned'
        session.end_time = timezone.now()
        session.save(update_fields=['status', 'end_time'])
        return Response(FocusSessionSerializer(session).data)


class TimerSuggestionView(APIView):
    """
    GET /api/focus/suggestions/?topic_id=<id>
    Returns smart focus/break duration suggestions.
    """
    permission_classes = [IsStudent]

    def get(self, request):
        topic_id = request.query_params.get('topic_id')
        topic = Topic.objects.filter(pk=topic_id).first() if topic_id else None
        data = get_timer_suggestions(request.user, topic)
        return Response(TimerSuggestionSerializer(data).data)
