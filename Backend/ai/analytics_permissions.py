"""
ai/analytics_permissions.py
-----------------------------
Custom DRF permission classes for the AI Usage Insights system.

Three tiers:
  IsMainAdmin     — Superusers only. Full technical access.
  IsProfessorScope — Admin-role users. Access scoped to their own courses/students.
  IsStudentSelf    — Student-role or any authenticated user. Self-data only.

IDOR Prevention:
  - IsStudentSelf enforces that the requesting user can ONLY access their own
    analytics data. student_id URL params are validated against request.user.pk
    inside the view after this permission passes.
  - IsProfessorScope enforces that enrolled student IDs are re-derived from the
    professor's courses inside the analytics service, never trusted from the request.
"""

from rest_framework.permissions import BasePermission


class IsMainAdmin(BasePermission):
    """
    Grants access only to Django superusers.
    These users see full platform-wide technical analytics.
    """
    message = 'Full analytics access is restricted to platform administrators.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class IsProfessorOrMainAdmin(BasePermission):
    """
    Grants access to admin-role users (professors) AND superusers.
    Professors are further scoped inside the analytics service — they
    can only retrieve aggregated data for students enrolled in their courses.
    """
    message = 'Class insights are available to instructors and administrators only.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.is_superuser
            or getattr(request.user, 'role', '') == 'admin'
        )


class IsStudentSelf(BasePermission):
    """
    Grants access to any authenticated user, but ONLY to their own learning insights.
    The student_id is never trusted from URL params — views must scope queries to
    request.user explicitly.
    """
    message = 'You can only access your own learning insights.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
