"""
ai/permissions_governance.py
------------------------------
Permission classes for the AI Governance Module.

All AI management APIs enforce backend RBAC. Frontend restrictions
alone are NOT acceptable — every endpoint validates permissions.

Current role mapping:
    admin  → Super Admin (full platform access)
    student → Student (AI usage only, no management access)

Future expansion hooks:
    university_admin → University-level access (when RBAC is expanded)
    teacher → Usage only + personal stats
"""

# pyrefly: ignore [missing-import]
from rest_framework.permissions import BasePermission
import logging

logger = logging.getLogger(__name__)


class IsSuperAdmin(BasePermission):
    """
    Full platform-level AI governance access.

    Currently maps to: user.role == 'admin' OR user.is_superuser
    """
    message = "Only administrators can access AI management settings."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.is_superuser
            or getattr(request.user, 'role', '') == 'admin'
        )


class IsUniversityAdmin(BasePermission):
    """
    University-level AI governance access.

    Currently: same as IsSuperAdmin (no separate university_admin role yet).
    When RBAC is expanded, this will check for university_admin role
    and scope access to the admin's university.
    """
    message = "Only university administrators can access this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.is_superuser
            or getattr(request.user, 'role', '') == 'admin'
        )


class IsAIAdmin(BasePermission):
    """
    Union of Super Admin + University Admin.

    Any user with admin-level access to AI governance.
    When RBAC is expanded, this will be:
        is_superuser OR role == 'super_admin' OR role == 'university_admin'
    """
    message = "You do not have permission to manage AI settings."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return (
            request.user.is_superuser
            or getattr(request.user, 'role', '') == 'admin'
        )


class CanManageProviders(BasePermission):
    """
    Only Super Admins can manage AI providers.

    University admins can VIEW providers but not modify them.
    """
    message = "Only super administrators can manage AI providers."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        # Read-only for all admins
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return getattr(request.user, 'role', '') == 'admin' or request.user.is_superuser
        # Write operations: super admin only
        return request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'


class CanManageModels(BasePermission):
    """Only Super Admins can manage AI models."""
    message = "Only super administrators can manage AI models."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'


class CanManageQuotas(BasePermission):
    """
    Quota management access.

    Super Admin: full access (all universities, all roles)
    University Admin: restricted to their university (future)
    """
    message = "You do not have permission to manage quotas."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'


class CanManageFeatureFlags(BasePermission):
    """Only admins can manage AI feature flags."""
    message = "You do not have permission to manage feature flags."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'


class CanViewAILogs(BasePermission):
    """Only admins can view AI request logs and audit logs."""
    message = "You do not have permission to view AI logs."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'


class CanViewAIAnalytics(BasePermission):
    """Only admins can access AI analytics dashboard."""
    message = "You do not have permission to view AI analytics."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'
