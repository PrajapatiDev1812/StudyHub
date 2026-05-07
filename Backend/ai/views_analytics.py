"""
ai/views_analytics.py
-----------------------
Role-based API views for the AI Usage Insights system.

Endpoint Structure:
  Admin (superuser only):
    GET /api/ai/analytics/admin/overview/

  Professor (admin role, class-scoped):
    GET /api/ai/analytics/professor/class-insights/

  Student (self-only):
    GET /api/ai/analytics/student/learning-insights/
    GET /api/ai/analytics/student/weekly-activity/
    GET /api/ai/analytics/student/top-topics/

Supported Query Params (where applicable):
  ?start_date=YYYY-MM-DD
  ?end_date=YYYY-MM-DD
  ?course_id=<int>    (professor only)
  ?interval=day|week|month  (admin only)

Privacy Guarantees:
  - Admin views expose aggregated stats + raw log access (admin-only).
  - Professor views NEVER expose raw query_text; only topic aggregations.
  - Student views are hard-scoped to request.user — student_id from URL is
    never trusted; it is always overridden with request.user.
"""

import logging
from datetime import date

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .analytics_permissions import IsMainAdmin, IsProfessorOrMainAdmin, IsStudentSelf
from .services.analytics_service import (
    get_admin_overview,
    get_professor_class_overview,
    get_student_learning_insights,
)

logger = logging.getLogger(__name__)


def _parse_date_param(request, param_name):
    """Parse a YYYY-MM-DD query param; return date or None."""
    value = request.query_params.get(param_name)
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (ValueError, AttributeError):
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ADMIN VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class AdminAnalyticsOverviewView(APIView):
    """
    GET /api/ai/analytics/admin/overview/

    Full technical platform analytics for superusers.

    Query Params:
      start_date, end_date — ISO date strings (default: last 30 days)
      interval             — day | week | month (for requests-over-time chart)

    Response:
    {
      "summary": {
        "total_requests": int,
        "active_users": int,
        "avg_daily_requests": float,
        "peak_day": "YYYY-MM-DD",
        "failure_rate_pct": float,
        "throttle_rate_pct": float,
        "avg_response_ms": float,
        "total_tokens_used": int
      },
      "status_breakdown": {"chart": {"labels": [...], "values": [...]}},
      "requests_over_time": {"chart": {"labels": [...], "values": [...]}},
      "top_topics": {"chart": {"labels": [...], "values": [...]}},
      "top_courses": {"chart": {"labels": [...], "values": [...]}},
      "top_users": [{"username": str, "user_id": int, "count": int}, ...],
      "hourly_heatmap": [{"hour": int, "count": int}, ...],
      "date_range": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}
    }
    """
    permission_classes = [IsMainAdmin]

    def get(self, request):
        start_date = _parse_date_param(request, 'start_date')
        end_date   = _parse_date_param(request, 'end_date')

        try:
            data = get_admin_overview(start_date=start_date, end_date=end_date)
            return Response(data)
        except Exception as exc:
            logger.error(f'[AdminAnalytics] Error generating overview: {exc}', exc_info=True)
            return Response(
                {'error': 'Failed to generate analytics. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ═══════════════════════════════════════════════════════════════════════════════
# PROFESSOR VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class ProfessorClassInsightsView(APIView):
    """
    GET /api/ai/analytics/professor/class-insights/

    Educational engagement insights for a professor, scoped to their enrolled students.

    Query Params:
      start_date, end_date — ISO date strings (default: last 30 days)
      course_id            — Filter by a specific course (must belong to this professor)

    Privacy: raw query text is NEVER included. Only aggregated topic data.

    Response:
    {
      "summary": {
        "enrolled_students": int,
        "active_learners": int,
        "total_interactions": int,
        "avg_interactions_per_student": float
      },
      "engagement_over_time": {"chart": {"labels": [...], "values": [...]}},
      "topic_insights": {
        "most_asked":        {"chart": {"labels": [...], "values": [...]}},
        "subject_breakdown": {"chart": {"labels": [...], "values": [...]}},
        "difficult_topics":  [{"topic": str, "total_queries": int, "unique_students": int, "difficulty_hint": str}, ...]
      },
      "insights": [{"type": str, "icon": str, "title": str, "body": str}, ...],
      "date_range": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}
    }
    """
    permission_classes = [IsProfessorOrMainAdmin]

    def get(self, request):
        start_date = _parse_date_param(request, 'start_date')
        end_date   = _parse_date_param(request, 'end_date')
        course_id  = request.query_params.get('course_id')

        # Validate course_id belongs to this professor (prevent IDOR)
        validated_course_id = None
        if course_id:
            try:
                from courses.models import Course
                Course.objects.get(id=int(course_id), created_by=request.user)
                validated_course_id = int(course_id)
            except (Course.DoesNotExist, ValueError, TypeError):
                return Response(
                    {'error': 'Invalid or unauthorized course_id.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        try:
            data = get_professor_class_overview(
                professor=request.user,
                start_date=start_date,
                end_date=end_date,
                course_id=validated_course_id,
            )
            return Response(data)
        except Exception as exc:
            logger.error(f'[ProfessorAnalytics] Error: {exc}', exc_info=True)
            return Response(
                {'error': 'Failed to generate class insights. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ═══════════════════════════════════════════════════════════════════════════════
# STUDENT VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class StudentLearningInsightsView(APIView):
    """
    GET /api/ai/analytics/student/learning-insights/

    Personal learning insights for the authenticated student.
    Self-scoped: request.user is always used — no student_id param is accepted.

    Query Params:
      start_date, end_date — ISO date strings (default: last 30 days)

    Response:
    {
      "summary": {
        "topics_explored": int,
        "study_days": int,
        "active_study_streak": int,
        "peak_study_hour": "HH:00"
      },
      "weekly_activity":   {"chart": {"labels": [...], "values": [...]}},
      "top_topics":        {"chart": {"labels": [...], "values": [...]}},
      "hourly_pattern":    {"chart": {"labels": [...], "values": [...]}},
      "subject_breakdown": {"chart": {"labels": [...], "values": [...]}},
      "insights": [{"type": str, "icon": str, "title": str, "body": str}, ...],
      "date_range": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}
    }

    Frontend Wording Guide (enforced in insight card body text):
      ✅ "Topics explored", "Study activity", "Active study hours", "Learning streak"
      ❌ "Tracked requests", "API calls", "Monitoring", "You were watched"
    """
    permission_classes = [IsStudentSelf]

    def get(self, request):
        start_date = _parse_date_param(request, 'start_date')
        end_date   = _parse_date_param(request, 'end_date')

        try:
            # CRITICAL: always use request.user — never accept a student_id param
            data = get_student_learning_insights(
                student=request.user,
                start_date=start_date,
                end_date=end_date,
            )
            return Response(data)
        except Exception as exc:
            logger.error(f'[StudentInsights] Error for user {request.user.id}: {exc}', exc_info=True)
            return Response(
                {'error': 'Failed to load your learning insights. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class StudentWeeklyActivityView(APIView):
    """
    GET /api/ai/analytics/student/weekly-activity/

    Returns only the 7-day activity chart for lightweight dashboard widgets.
    Self-scoped: always uses request.user.
    """
    permission_classes = [IsStudentSelf]

    def get(self, request):
        try:
            data = get_student_learning_insights(student=request.user)
            return Response({
                'weekly_activity': data['weekly_activity'],
                'summary': {
                    'study_days':          data['summary']['study_days'],
                    'active_study_streak': data['summary']['active_study_streak'],
                },
            })
        except Exception as exc:
            logger.error(f'[StudentWeeklyActivity] Error: {exc}', exc_info=True)
            return Response({'error': 'Failed to load activity.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentTopTopicsView(APIView):
    """
    GET /api/ai/analytics/student/top-topics/

    Returns only the topics chart for lightweight dashboard widgets.
    Self-scoped: always uses request.user.
    """
    permission_classes = [IsStudentSelf]

    def get(self, request):
        try:
            data = get_student_learning_insights(student=request.user)
            return Response({
                'top_topics':        data['top_topics'],
                'subject_breakdown': data['subject_breakdown'],
                'topics_explored':   data['summary']['topics_explored'],
            })
        except Exception as exc:
            logger.error(f'[StudentTopTopics] Error: {exc}', exc_info=True)
            return Response({'error': 'Failed to load topics.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
