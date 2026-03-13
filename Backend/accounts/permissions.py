from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allow access only to users with role = 'admin'.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsStudent(BasePermission):
    """
    Allow access only to users with role = 'student'.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'student'
        )
