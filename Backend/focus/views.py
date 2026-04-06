"""
focus/views.py
--------------
FocusSession API endpoints — all student-only.

Endpoints:
  POST   /api/focus/sessions/           start_session
  GET    /api/focus/sessions/           list (recent sessions)
  GET    /api/focus/sessions/active/    active session for student
  GET    /api/focus/sessions/<id>/      retrieve
  POST   /api/focus/sessions/<id>/pause/
  POST   /api/focus/sessions/<id>/take_break/
  POST   /api/focus/sessions/<id>/resume/
  POST   /api/focus/sessions/<id>/end/
  POST   /api/focus/sessions/<id>/sync_timer/  (updates elapsed time)
  GET    /api/focus/suggestions/        timer suggestions (pass ?topic_id=)
"""
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status
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


class FocusSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list / retrieve focus sessions for the authenticated student.
    Custom actions handle all state transitions.
    """
    serializer_class = FocusSessionSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return FocusSession.objects.filter(
            student=self.request.user
        ).select_related('subject', 'topic', 'content_item')

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

        # Resolve FK objects
        subject = get_object_or_404(Subject, pk=d['subject_id'])
        topic = Topic.objects.filter(pk=d.get('topic_id')).first()
        content_item = Content.objects.filter(pk=d.get('content_id')).first()

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
