# pyrefly: ignore [missing-import]
from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsStudentUser(BasePermission):
    """Allow access only to student users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'student'
        )


class IsAdminOrStudent(BasePermission):
    """Allow any authenticated user (admin or student)."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsTaskOwnerOrAdmin(BasePermission):
    """
    For STUDENT_CREATED tasks:
        - Only the owning student or an admin can view/edit/delete.
    For ADMIN_ASSIGNED tasks:
        - Only admins can edit.
        - Students who are assigned can view (handled in queryset).
    """

    def has_object_permission(self, request, view, obj):
        from .models import Task
        if request.user.role == 'admin':
            return True
        if isinstance(obj, Task):
            if obj.source == 'STUDENT_CREATED':
                return obj.user == request.user
            # ADMIN_ASSIGNED: students can view only, not write
            if request.method in ('GET', 'HEAD', 'OPTIONS'):
                # Further scoped by assignment in the view queryset
                return True
            return False
        return False


class IsAssignedStudentOrAdmin(BasePermission):
    """
    For TaskAssignment objects:
        - The assigned student can view and perform workflow actions (start, submit).
        - Admins can do everything.
        - No student can access another student's assignment.
    """

    def has_object_permission(self, request, view, obj):
        from .models import TaskAssignment
        if request.user.role == 'admin':
            return True
        if isinstance(obj, TaskAssignment):
            return obj.student == request.user
        return False
