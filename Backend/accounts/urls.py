from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import RegisterView, ProfileView

urlpatterns = [
    # Register a new user
    path('register/', RegisterView.as_view(), name='auth-register'),

    # Login — returns access + refresh tokens
    path('login/', TokenObtainPairView.as_view(), name='auth-login'),

    # Refresh an expired access token
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # Get current user's profile
    path('profile/', ProfileView.as_view(), name='auth-profile'),
]
