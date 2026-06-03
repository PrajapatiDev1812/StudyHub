# pyrefly: ignore [missing-import]
from rest_framework import generics, status
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.contrib.auth.hashers import check_password

from .models import UserPreference, NotificationPreference, LoginActivity, ActiveSession, User2FA
from .serializers import (
    UserPreferenceSerializer, 
    NotificationPreferenceSerializer, 
    LoginActivitySerializer, 
    ActiveSessionSerializer,
    UserSerializer
)

User = get_user_model()

# --- Profile Management ---

class ProfilePersonalView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class ProfilePreferencesView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, _ = UserPreference.objects.get_or_create(user=self.request.user)
        return obj

class ProfileNotificationsView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj

class ProfileActivitySummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from concurrent.futures import ThreadPoolExecutor
        from ai.models import AIRequestLog
        from focus.models import FocusSession
        # pyrefly: ignore [missing-import]
        from django.db.models import Sum
        from materials.models import StudentMaterial
        from assessments.models import StudentAttempt
        from gamification.models import UserStats

        user = request.user

        def get_ai_requests():
            return AIRequestLog.objects.filter(user=user).count()

        def get_focus_hours():
            sec = FocusSession.objects.filter(
                student=user, status='completed'
            ).aggregate(total=Sum('total_focus_seconds'))['total'] or 0
            return round(sec / 3600, 1)

        def get_materials():
            return StudentMaterial.objects.filter(student=user, is_deleted=False).count()

        def get_tests():
            return StudentAttempt.objects.filter(student=user).count()

        def get_streak():
            try:
                return UserStats.objects.get(user=user).streak_days
            except UserStats.DoesNotExist:
                return 0

        # Run all queries in parallel
        with ThreadPoolExecutor(max_workers=5) as pool:
            f_ai       = pool.submit(get_ai_requests)
            f_focus    = pool.submit(get_focus_hours)
            f_materials = pool.submit(get_materials)
            f_tests    = pool.submit(get_tests)
            f_streak   = pool.submit(get_streak)

        return Response({
            "ai_requests":        f_ai.result(),
            "focus_hours":        f_focus.result(),
            "materials_uploaded": f_materials.result(),
            "tests_attempted":    f_tests.result(),
            "current_streak":     f_streak.result(),
            "last_active":        user.last_login,
        })

# --- Security & Activity ---

class SecurityLoginActivityView(generics.ListAPIView):
    serializer_class = LoginActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LoginActivity.objects.filter(user=self.request.user)[:20]

class SecurityActiveSessionsView(generics.ListAPIView):
    serializer_class = ActiveSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActiveSession.objects.filter(user=self.request.user, is_active=True)

class SecurityLogoutOthersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ActiveSession.objects.filter(user=request.user).update(is_active=False)
        return Response({"message": "Logged out from other devices successfully."})

# pyrefly: ignore [import-outside-toplevel, missing-import]
from rest_framework.throttling import UserRateThrottle

class PasswordChangeThrottle(UserRateThrottle):
    scope = 'password_change'


class SecurityChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [PasswordChangeThrottle]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({"error": "Current and new password are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.check_password(current_password):
            return Response({"error": "Incorrect current password."}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters long."}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password changed successfully."})

class SecurityToggle2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user2fa, _ = User2FA.objects.get_or_create(user=request.user)
        action = request.data.get('action') # 'enable' or 'disable'
        
        if action == 'disable':
            password = request.data.get('password')
            if not password or not request.user.check_password(password):
                return Response({"error": "Incorrect password. Valid password is required to disable 2FA."}, status=status.HTTP_403_FORBIDDEN)
            user2fa.is_enabled = False
            user2fa.is_setup_complete = False
            user2fa.save()
            return Response({"message": "2FA disabled successfully.", "is_enabled": False})
        else:
            return Response(
                {"error": "2FA cannot be enabled directly. Please use the /api/auth/2fa/setup/ and /api/auth/2fa/activate/ endpoints to verify your OTP and enable 2FA."},
                status=status.HTTP_400_BAD_REQUEST
            )

class SecurityRegenerateBackupCodesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # pyrefly: ignore [missing-import]
        import bcrypt
        import secrets
        
        user2fa, _ = User2FA.objects.get_or_create(user=request.user)
        
        # Generate 10 new 8-character codes
        raw_codes = [secrets.token_hex(4) for _ in range(10)]
        
        # Hash them
        hashed_codes = [bcrypt.hashpw(c.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') for c in raw_codes]
        
        user2fa.backup_codes = hashed_codes
        user2fa.save()
        
        # Return RAW codes ONLY ONCE
        return Response({
            "message": "Backup codes generated successfully. Store them safely now.",
            "backup_codes": raw_codes
        })
