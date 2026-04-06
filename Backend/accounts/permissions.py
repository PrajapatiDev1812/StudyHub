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


class IsAdminOrReadOnly(BasePermission):
    """
    Admin users can do anything.
    Authenticated students/users can only read (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        # First check that the user is authenticated
        if not (request.user and request.user.is_authenticated):
            return False

        # Read-only methods are allowed for any authenticated user
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True

        # Write methods are only allowed for admins
        return request.user.role == 'admin'


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


class IsOwnerOrAdmin(BasePermission):
    """
    Custom permission to only allow owners of an object or admins to view/edit it.
    Assumes the model has a 'user' or 'student' attribute.
    """

    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if request.user.role == 'admin':
            return True

        # Check if the object belongs to the user
        # Handle different naming conventions: 'user' or 'student'
        owner = getattr(obj, 'user', getattr(obj, 'student', None))
        return owner == request.user
