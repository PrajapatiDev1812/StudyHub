from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import ManualRecoveryRequest, AccountRecoveryLog
from .serializers_recovery import ManualRecoveryReviewSerializer, ManualRecoveryRequestSerializer
from django.utils import timezone
from .services.email_service import send_recovery_email

class AdminManualRecoveryListView(generics.ListAPIView):
    """Admin view to list all pending manual recovery requests"""
    queryset = ManualRecoveryRequest.objects.all().order_by('-created_at')
    serializer_class = ManualRecoveryRequestSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['status', 'role_claimed']

class AdminManualRecoveryDetailView(generics.RetrieveUpdateAPIView):
    """Admin view to approve or reject a manual recovery request"""
    queryset = ManualRecoveryRequest.objects.all()
    serializer_class = ManualRecoveryReviewSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_update(self, serializer):
        instance = serializer.save(
            reviewed_by=self.request.user,
            reviewed_at=timezone.now()
        )
        
        # If approved, we could automatically trigger a password reset email if they didn't have a verified email
        if instance.status == 'approved' and instance.user:
            from django.contrib.auth.tokens import default_token_generator
            token = default_token_generator.make_token(instance.user)
            send_recovery_email(instance.user, 'password_reset', token=token, request=self.request)

class AdminRecoveryLogListView(generics.ListAPIView):
    """Admin view to audit all recovery logs for security monitoring"""
    queryset = AccountRecoveryLog.objects.all().order_by('-created_at')
    # Simple read-only serializer for logs could be added or just use a generic one
    permission_classes = [permissions.IsAdminUser]
    
    def list(self, request, *args, **kwargs):
        # Flattened list response for easier table rendering on frontend
        queryset = self.get_queryset()
        data = []
        for log in queryset:
            data.append({
                "id": log.id,
                "email": log.email_submitted,
                "type": log.get_recovery_type_display(),
                "ip": log.ip_address,
                "status": log.status,
                "risk": log.risk_score,
                "date": log.created_at
            })
        return Response(data)
