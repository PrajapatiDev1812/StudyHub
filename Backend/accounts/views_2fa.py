"""
2FA-specific views for StudyHub.

Endpoints:
  POST /api/auth/login/          → (overridden) returns temp_token if 2FA enabled
  POST /api/auth/verify-otp/    → verifies OTP, issues final JWT
  POST /api/auth/2fa/setup/     → generate secret + QR code
  POST /api/auth/2fa/activate/  → verify first OTP & enable 2FA
  POST /api/auth/2fa/disable/   → disable 2FA (requires OTP + password)
  POST /api/auth/2fa/backup-codes/ → regenerate backup codes (requires password)
  GET  /api/auth/2fa/status/    → current 2FA status for the user
"""
import logging
from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User2FA, OTPAttemptLog
from .serializers_2fa import (
    LoginSerializer, VerifyOTPSerializer, Setup2FASerializer,
    Activate2FASerializer, Disable2FASerializer, BackupCodesRegenerateSerializer
)
from .services.two_factor_service import (
    generate_totp_secret, get_totp_uri, generate_qr_code_base64,
    verify_totp, generate_backup_codes, verify_backup_code,
    generate_temp_token, store_temp_token, resolve_temp_token, consume_temp_token
)
from .services.recovery_service import get_client_ip

logger = logging.getLogger(__name__)
User = get_user_model()


# ─── Custom Throttles ──────────────────────────────────────────────────────────

class OTPVerifyThrottle(AnonRateThrottle):
    scope = 'otp_verify'

class OTPSetupThrottle(AnonRateThrottle):
    scope = 'otp_setup'


# ─── Helper ───────────────────────────────────────────────────────────────────

def _get_tokens_for_user(user):
    """Issue a JWT access + refresh token pair for a successfully authenticated user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }

def _log_otp_attempt(user, request, success, used_backup=False):
    OTPAttemptLog.objects.create(
        user=user,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', ''),
        success=success,
        used_backup_code=used_backup,
    )


# ─── Step 1: Login ─────────────────────────────────────────────────────────────

class TwoFactorLoginView(views.APIView):
    """
    POST /api/auth/login/

    Replaces the default SimpleJWT token view.
    - Validates credentials.
    - If 2FA is enabled and set up: returns a temp_token (NOT JWT).
    - If 2FA is NOT yet set up: issues JWT + signals that setup is required.
    - Admin users with 2FA disabled are blocked completely.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPVerifyThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(request, username=username, password=password)
        if not user:
            logger.warning(f"Failed login attempt for username='{username}' IP={get_client_ip(request)}")
            return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'This account has been deactivated.'}, status=status.HTTP_403_FORBIDDEN)

        # ── Attempt to fetch 2FA profile ──
        try:
            two_fa = user.two_fa
        except User2FA.DoesNotExist:
            two_fa = None

        # ── Admin MUST have 2FA fully set up ──
        if user.role == 'admin' and (not two_fa or not two_fa.is_enabled):
            return Response(
                {
                    'error': 'Admin accounts require 2FA to be configured before logging in.',
                    'requires_2fa_setup': True,
                    # Issue a restricted temp token so they can reach the setup page
                    'temp_token': _issue_setup_only_token(user),
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ── 2FA is fully enabled — issue temp token ──
        if two_fa and two_fa.is_enabled:
            if two_fa.is_locked():
                return Response(
                    {'error': 'Too many failed OTP attempts. Account is temporarily locked. Try again in 10 minutes.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            temp_token = generate_temp_token()
            store_temp_token(cache, user.id, temp_token)
            logger.info(f"2FA challenge issued for user '{user.username}'")
            return Response({
                'requires_2fa': True,
                'temp_token': temp_token,
            }, status=status.HTTP_200_OK)

        # ── 2FA not yet set up — issue JWT but flag setup as required ──
        tokens = _get_tokens_for_user(user)

        # Gamification login hook
        try:
            from gamification.services import track_event
            unlocked = track_event(user, 'login')
            if unlocked:
                tokens['badge_unlocked'] = True
                tokens['badge'] = {
                    'name': unlocked[0].name,
                    'description': unlocked[0].description,
                    'icon': unlocked[0].icon.url if unlocked[0].icon else None,
                    'xp': unlocked[0].xp_reward,
                }
            else:
                tokens['badge_unlocked'] = False
        except Exception:
            pass

        tokens['requires_2fa_setup'] = True  # Frontend should route to setup page
        logger.info(f"User '{user.username}' logged in without 2FA setup.")
        return Response(tokens, status=status.HTTP_200_OK)


def _issue_setup_only_token(user):
    """Issue a short-lived temp token allowing only 2FA setup."""
    token = generate_temp_token()
    store_temp_token(cache, user.id, token)
    return token


# ─── Step 2: OTP Verification ─────────────────────────────────────────────────

class VerifyOTPView(views.APIView):
    """
    POST /api/auth/verify-otp/

    Accepts { temp_token, otp }.
    Verifies TOTP or backup code, then issues real JWT.
    Enforces lockout after 5 consecutive failures.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPVerifyThrottle]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        temp_token = serializer.validated_data['temp_token']
        otp_code = serializer.validated_data['otp'].strip().upper()

        # 1. Resolve temp token → user
        user_id = resolve_temp_token(cache, temp_token)
        if not user_id:
            return Response({'error': 'Invalid or expired session token. Please login again.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = User.objects.select_related('two_fa').get(id=user_id)
            two_fa = user.two_fa
        except (User.DoesNotExist, User2FA.DoesNotExist):
            return Response({'error': 'Invalid session.'}, status=status.HTTP_401_UNAUTHORIZED)

        # 2. Check lockout
        if two_fa.is_locked():
            return Response(
                {'error': 'Account is temporarily locked due to too many failed OTP attempts. Try again in 10 minutes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # 3. Try TOTP first
        if verify_totp(two_fa.otp_secret, otp_code):
            two_fa.clear_failed_attempts()
            consume_temp_token(cache, temp_token)
            _log_otp_attempt(user, request, success=True)
            tokens = _get_tokens_for_user(user)

            # Gamification hook
            try:
                from gamification.services import track_event
                unlocked = track_event(user, 'login')
                if unlocked:
                    tokens['badge_unlocked'] = True
                    tokens['badge'] = {'name': unlocked[0].name, 'xp': unlocked[0].xp_reward}
                else:
                    tokens['badge_unlocked'] = False
            except Exception:
                pass

            logger.info(f"User '{user.username}' passed 2FA OTP verification.")
            return Response(tokens, status=status.HTTP_200_OK)

        # 4. Try backup code (8-char alphanumeric)
        if len(otp_code) == 8:
            is_valid, remaining = verify_backup_code(two_fa.backup_codes, otp_code)
            if is_valid:
                two_fa.backup_codes = remaining
                two_fa.clear_failed_attempts()
                two_fa.save()
                consume_temp_token(cache, temp_token)
                _log_otp_attempt(user, request, success=True, used_backup=True)
                tokens = _get_tokens_for_user(user)
                tokens['used_backup_code'] = True
                tokens['backup_codes_remaining'] = len(remaining)
                logger.warning(f"User '{user.username}' used a backup code. {len(remaining)} remaining.")
                return Response(tokens, status=status.HTTP_200_OK)

        # 5. Invalid OTP
        two_fa.record_failed_attempt()
        _log_otp_attempt(user, request, success=False)
        logger.warning(f"Invalid OTP for user '{user.username}'. Attempts: {two_fa.failed_attempts}")
        return Response({'error': 'Invalid or expired OTP code.'}, status=status.HTTP_401_UNAUTHORIZED)


# ─── 2FA Setup Flow ───────────────────────────────────────────────────────────

class Setup2FAView(views.APIView):
    """
    POST /api/auth/2fa/setup/

    Generates + returns a new TOTP secret and QR code for the user to scan.
    Requires password confirmation for security.
    The secret is saved (but not yet enabled) until the user verifies the first OTP.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [OTPSetupThrottle]

    def post(self, request):
        serializer = Setup2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Verify password
        if not request.user.check_password(serializer.validated_data['password']):
            return Response({'error': 'Incorrect password.'}, status=status.HTTP_403_FORBIDDEN)

        secret = generate_totp_secret()
        uri = get_totp_uri(secret, request.user.username)
        qr_base64 = generate_qr_code_base64(uri)

        # Save secret (not yet enabled)
        two_fa, _ = User2FA.objects.get_or_create(user=request.user)
        two_fa.otp_secret = secret
        two_fa.is_enabled = False
        two_fa.is_setup_complete = False
        two_fa.save()

        return Response({
            'qr_code': f'data:image/png;base64,{qr_base64}',
            'secret': secret,  # For manual entry in authenticator app
            'message': 'Scan the QR code in your authenticator app, then call /2fa/activate/ with your first OTP.',
        }, status=status.HTTP_200_OK)


class Activate2FAView(views.APIView):
    """
    POST /api/auth/2fa/activate/

    Verifies the user's first OTP after scanning the QR code.
    If valid: marks 2FA as enabled and generates backup codes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = Activate2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            two_fa = request.user.two_fa
        except User2FA.DoesNotExist:
            return Response({'error': 'Please initiate 2FA setup first.'}, status=status.HTTP_400_BAD_REQUEST)

        if two_fa.is_enabled:
            return Response({'error': '2FA is already active.'}, status=status.HTTP_400_BAD_REQUEST)

        if not verify_totp(two_fa.otp_secret, serializer.validated_data['otp']):
            return Response({'error': 'Invalid OTP. Please check your authenticator app and try again.'}, status=status.HTTP_400_BAD_REQUEST)

        # Enable 2FA and generate backup codes
        plaintext_codes, hashed_codes = generate_backup_codes()
        two_fa.backup_codes = hashed_codes
        two_fa.is_enabled = True
        two_fa.is_setup_complete = True
        two_fa.save()

        logger.info(f"2FA successfully activated for user '{request.user.username}'.")
        return Response({
            'message': '2FA has been successfully enabled for your account.',
            'backup_codes': plaintext_codes,  # Shown ONCE. User must save them.
            'warning': 'Save these backup codes in a safe place. They will not be shown again.',
        }, status=status.HTTP_200_OK)


class Disable2FAView(views.APIView):
    """
    POST /api/auth/2fa/disable/

    Disables 2FA. Requires BOTH the current password AND a valid OTP.
    Admin accounts CANNOT disable 2FA.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role == 'admin':
            return Response({'error': 'Admin accounts cannot disable 2FA.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = Disable2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(serializer.validated_data['password']):
            return Response({'error': 'Incorrect password.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            two_fa = request.user.two_fa
        except User2FA.DoesNotExist:
            return Response({'error': '2FA is not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        if not verify_totp(two_fa.otp_secret, serializer.validated_data['otp']):
            two_fa.record_failed_attempt()
            return Response({'error': 'Invalid OTP.'}, status=status.HTTP_401_UNAUTHORIZED)

        two_fa.is_enabled = False
        two_fa.is_setup_complete = False
        two_fa.otp_secret = ''
        two_fa.backup_codes = []
        two_fa.clear_failed_attempts()
        two_fa.save()

        logger.warning(f"2FA disabled for user '{request.user.username}'.")
        return Response({'message': '2FA has been disabled. You can re-enable it from your security settings.'}, status=status.HTTP_200_OK)


class BackupCodesView(views.APIView):
    """
    POST /api/auth/2fa/backup-codes/

    Regenerates backup codes. Requires password verification.
    Old codes are immediately invalidated.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BackupCodesRegenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(serializer.validated_data['password']):
            return Response({'error': 'Incorrect password.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            two_fa = request.user.two_fa
            if not two_fa.is_enabled:
                return Response({'error': '2FA must be enabled to manage backup codes.'}, status=status.HTTP_400_BAD_REQUEST)
        except User2FA.DoesNotExist:
            return Response({'error': '2FA is not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        plaintext_codes, hashed_codes = generate_backup_codes()
        two_fa.backup_codes = hashed_codes
        two_fa.save()

        return Response({
            'backup_codes': plaintext_codes,
            'warning': 'Your old backup codes have been invalidated. Save these new ones immediately.',
        }, status=status.HTTP_200_OK)


class TwoFAStatusView(views.APIView):
    """
    GET /api/auth/2fa/status/

    Returns the current 2FA configuration status for the logged-in user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            two_fa = request.user.two_fa
            return Response({
                'is_enabled': two_fa.is_enabled,
                'is_setup_complete': two_fa.is_setup_complete,
                'backup_codes_count': len(two_fa.backup_codes),
            })
        except User2FA.DoesNotExist:
            return Response({
                'is_enabled': False,
                'is_setup_complete': False,
                'backup_codes_count': 0,
            })
