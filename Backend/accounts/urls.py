from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, ProfileView, ThemeListView, UpdateAppearanceView,
    CreateCustomThemeView, ThemeDetailView,
)
from .views_recovery import (
    ForgotPasswordView, ResetPasswordView,
    ForgotUsernameView, ManualRecoveryRequestView
)
from .views_admin_recovery import (
    AdminManualRecoveryListView, AdminManualRecoveryDetailView,
    AdminRecoveryLogListView
)
from .views_2fa import (
    TwoFactorLoginView, VerifyOTPView,
    Setup2FAView, Activate2FAView, Disable2FAView,
    BackupCodesView, TwoFAStatusView,
)

urlpatterns = [
    # ── Registration & Session ─────────────────────────────────────────────
    path('register/', RegisterView.as_view(), name='auth-register'),

    # Login now returns temp_token if 2FA is active, or JWT if not yet set up
    path('login/', TwoFactorLoginView.as_view(), name='auth-login'),

    # Step 2: verify OTP → receive JWT
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),

    # Refresh an expired access token
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # ── Profile ────────────────────────────────────────────────────────────
    path('profile/', ProfileView.as_view(), name='auth-profile'),

    # ── Themes and Appearance ─────────────────────────────────────────────
    path('themes/', ThemeListView.as_view(), name='themes-list'),
    path('themes/custom/', CreateCustomThemeView.as_view(), name='custom-theme-create'),
    path('themes/<int:pk>/', ThemeDetailView.as_view(), name='theme-detail'),
    path('appearance/', UpdateAppearanceView.as_view(), name='appearance-update'),

    # ── 2FA Management ────────────────────────────────────────────────────
    path('2fa/status/', TwoFAStatusView.as_view(), name='2fa-status'),
    path('2fa/setup/', Setup2FAView.as_view(), name='2fa-setup'),
    path('2fa/activate/', Activate2FAView.as_view(), name='2fa-activate'),
    path('2fa/disable/', Disable2FAView.as_view(), name='2fa-disable'),
    path('2fa/backup-codes/', BackupCodesView.as_view(), name='2fa-backup-codes'),

    # ── Account Recovery (Public) ─────────────────────────────────────────
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('forgot-username/', ForgotUsernameView.as_view(), name='forgot-username'),
    path('recovery-request/', ManualRecoveryRequestView.as_view(), name='manual-recovery-request'),

    # ── Admin Recovery Management ─────────────────────────────────────────
    path('admin/recovery-requests/', AdminManualRecoveryListView.as_view(), name='admin-recovery-list'),
    path('admin/recovery-requests/<int:pk>/', AdminManualRecoveryDetailView.as_view(), name='admin-recovery-detail'),
    path('admin/recovery-logs/', AdminRecoveryLogListView.as_view(), name='admin-recovery-logs'),
]
