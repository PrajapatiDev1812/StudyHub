from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
import requests
import os

from .serializers_recovery import (
    ForgotPasswordSerializer, ResetPasswordSerializer, 
    ForgotUsernameSerializer, ManualRecoveryRequestSerializer
)
from .services.recovery_service import (
    calculate_recovery_risk, log_recovery_action, 
    invalidate_all_user_sessions, add_to_password_history, get_client_ip
)
from .services.email_service import send_recovery_email
from .models import ManualRecoveryRequest, User

# Custom Throttles
class RecoveryEmailThrottle(AnonRateThrottle):
    rate = '3/hour'
    scope = 'recovery_email'

class RecoveryIPThrottle(AnonRateThrottle):
    rate = '5/hour'
    scope = 'recovery_ip'

def verify_recaptcha(token):
    """Simple verification helper for reCAPTCHA"""
    if not token:
        return False
    secret = os.getenv('RECAPTCHA_SECRET_KEY')
    res = requests.post('https://www.google.com/recaptcha/api/siteverify', data={
        'secret': secret,
        'response': token
    })
    return res.json().get('success', False)

class ForgotPasswordView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RecoveryEmailThrottle, RecoveryIPThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', '')

        # ANTI-ENUMERATION: Generic success response
        generic_response = Response(
            {"detail": "If an account exists with this email, recovery instructions have been sent."},
            status=status.HTTP_200_OK
        )

        risk_score = calculate_recovery_risk(email, ip, ua)
        if risk_score > 80:
            log_recovery_action(email, 'password', ip, ua, 'blocked_high_risk', risk_score=risk_score)
            return generic_response

        try:
            user = User.objects.get(email__iexact=email)
            
            # Enforce verified email rule
            if not user.is_email_verified:
                log_recovery_action(email, 'password', ip, ua, 'unverified_redirect', user=user)
                return Response(
                    {"detail": "This account requires manual recovery as the email is not verified.", "manual_required": True},
                    status=status.HTTP_403_FORBIDDEN
                )

            token = default_token_generator.make_token(user)
            send_recovery_email(user, 'password_reset', token=token, request=request)
            log_recovery_action(email, 'password', ip, ua, 'initiated', user=user, risk_score=risk_score)
        except User.DoesNotExist:
            log_recovery_action(email, 'password', ip, ua, 'not_found', risk_score=risk_score)

        return generic_response

class ResetPasswordView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RecoveryIPThrottle]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = serializer.validated_data['user_id']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            user = User.objects.get(id=user_id)
            if default_token_generator.check_token(user, token):
                # Update password
                user.set_password(new_password)
                user.save()
                
                # Security Actions
                add_to_password_history(user, user.password)
                invalidate_all_user_sessions(user)
                send_recovery_email(user, 'password_changed', request=request)
                
                return Response({"detail": "Password has been reset successfully. Please log in with your new password."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)

class ForgotUsernameView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RecoveryEmailThrottle, RecoveryIPThrottle]

    def post(self, request):
        serializer = ForgotUsernameSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', '')

        generic_response = Response(
            {"detail": "If an account exists, your username has been sent to your email."},
            status=status.HTTP_200_OK
        )

        try:
            user = User.objects.get(email__iexact=email)
            send_recovery_email(user, 'username_reminder', request=request)
            log_recovery_action(email, 'username', ip, ua, 'completed', user=user)
        except User.DoesNotExist:
            log_recovery_action(email, 'username', ip, ua, 'not_found')

        return generic_response

class ManualRecoveryRequestView(views.APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RecoveryIPThrottle]

    def post(self, request):
        serializer = ManualRecoveryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # reCAPTCHA Check (optional if provided in data)
        token = request.data.get('recaptcha_token')
        if token and not verify_recaptcha(token):
             return Response({"error": "reCAPTCHA verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {"detail": "Your manual recovery request has been submitted. An administrator will review it shortly."},
            status=status.HTTP_201_CREATED
        )
