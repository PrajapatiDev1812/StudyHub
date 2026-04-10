from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    RegisterView, ProfileView, ThemeListView, UpdateAppearanceView, 
    CreateCustomThemeView, ThemeDetailView, CustomTokenObtainPairView
)
from .views_recovery import (
    ForgotPasswordView, ResetPasswordView, 
    ForgotUsernameView, ManualRecoveryRequestView
)
from .views_admin_recovery import (
    AdminManualRecoveryListView, AdminManualRecoveryDetailView, 
    AdminRecoveryLogListView
)

urlpatterns = [
    # Register a new user
    path('register/', RegisterView.as_view(), name='auth-register'),

    # Login — returns access + refresh tokens
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),

    # Refresh an expired access token
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # Get current user's profile
    path('profile/', ProfileView.as_view(), name='auth-profile'),

    # Themes and Appearance
    path('themes/', ThemeListView.as_view(), name='themes-list'),
    path('themes/custom/', CreateCustomThemeView.as_view(), name='custom-theme-create'),
    path('themes/<int:pk>/', ThemeDetailView.as_view(), name='theme-detail'),
    path('appearance/', UpdateAppearanceView.as_view(), name='appearance-update'),

    # Recovery Public
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('forgot-username/', ForgotUsernameView.as_view(), name='forgot-username'),
    path('recovery-request/', ManualRecoveryRequestView.as_view(), name='manual-recovery-request'),

    # Admin Recovery Management
    path('admin/recovery-requests/', AdminManualRecoveryListView.as_view(), name='admin-recovery-list'),
    path('admin/recovery-requests/<int:pk>/', AdminManualRecoveryDetailView.as_view(), name='admin-recovery-detail'),
    path('admin/recovery-logs/', AdminRecoveryLogListView.as_view(), name='admin-recovery-logs'),
]
