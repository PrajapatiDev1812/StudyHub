from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
from accounts.permissions import IsAdmin


class NotificationViewSet(viewsets.ModelViewSet):
    """
    Notification management.
    - Students: list, retrieve, mark_read their own notifications only.
    - Admins: full CRUD + can create notifications for any user.

    Read  (list, retrieve, mark_read) → any authenticated user (own only)
    Write (create, update, destroy)   → admin only
    """
    serializer_class = NotificationSerializer

    def get_permissions(self):
        """
        Action-level permission switching:
        - Safe read actions: any authenticated user
        - Mutating actions (create, update, partial_update, destroy): admin only
        """
        if self.action in ('list', 'retrieve', 'mark_read'):
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        """Students see only their own notifications; admins see all."""
        user = self.request.user
        if user.role == 'admin':
            return Notification.objects.all()
        return Notification.objects.filter(user=user)

    def perform_create(self, serializer):
        """Admin can specify a target user via 'user' field, or defaults to self."""
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        """POST /api/notifications/{id}/mark_read/"""
        notification = self.get_object()
        # Ensure the student can only mark their own notification as read
        if request.user.role != 'admin' and notification.user != request.user:
            return Response(
                {'error': 'You do not have permission to mark this notification.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

