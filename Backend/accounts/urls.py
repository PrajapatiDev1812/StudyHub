from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import RegisterView, ProfileView, ThemeListView, UpdateAppearanceView, CreateCustomThemeView, ThemeDetailView, CustomTokenObtainPairView

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
]
