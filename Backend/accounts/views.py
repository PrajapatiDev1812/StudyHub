# pyrefly: ignore [missing-import]
from rest_framework import generics, status
# pyrefly: ignore [missing-import]
from rest_framework.permissions import AllowAny, IsAuthenticated
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.parsers import MultiPartParser, FormParser
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.views import TokenObtainPairView
# pyrefly: ignore [missing-import]
from django.contrib.auth.models import update_last_login

from .models import Theme, UserAppearance
# pyrefly: ignore [import-import]
from .serializers import RegisterSerializer, UserSerializer, ThemeSerializer, UserAppearanceSerializer, CustomThemeCreateSerializer
# pyrefly: ignore [missing-import]
from django.db.models import Q


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = self.get_serializer().validate(request.data).get('user')
            if hasattr(self.get_serializer(), 'user'):
                user = self.get_serializer().user
            
            # Hook Gamification login
            if user:
                from gamification.services import track_event
                unlocked_badges = track_event(user, 'login')
                if unlocked_badges:
                    response.data['badge_unlocked'] = True
                    response.data['badge'] = {
                        "name": unlocked_badges[0].name,
                        "description": unlocked_badges[0].description,
                        "icon": unlocked_badges[0].icon.url if unlocked_badges[0].icon else None,
                        "xp": unlocked_badges[0].xp_reward
                    }
                else:
                    response.data['badge_unlocked'] = False
                    
                # Log Activity
                from .models import LoginActivity
                ip = request.META.get('REMOTE_ADDR')
                ua = request.META.get('HTTP_USER_AGENT', '')
                LoginActivity.objects.create(user=user, ip_address=ip, user_agent=ua, status='success', device='Web Browser')
                
        return response

class ThemeListView(generics.ListAPIView):
    """
    GET /api/auth/themes/
    Returns ALL built-in themes and the authenticated user's own custom themes.
    Pagination is disabled so the frontend always receives a plain array.
    """
    serializer_class = ThemeSerializer
    permission_classes = [AllowAny]
    pagination_class = None  # Return all themes as a plain JSON array

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Theme.objects.filter(Q(theme_type='builtin') | Q(created_by=user)).order_by('-created_at')
        return Theme.objects.filter(theme_type='builtin').order_by('-created_at')


class CreateCustomThemeView(generics.CreateAPIView):
    """
    POST /api/auth/themes/custom/
    Upload an image and config to create a new custom theme.
    """
    serializer_class = CustomThemeCreateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        # We also want to auto-select this newly created theme for the user
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        theme = serializer.save()

        # Update User's selected theme
        app, _ = UserAppearance.objects.get_or_create(user=request.user)
        app.selected_theme = theme
        app.save()

        # Return updated appearance config with request context so background_image_url is absolute
        app_serializer = UserAppearanceSerializer(app, context={'request': request})
        return Response(app_serializer.data, status=status.HTTP_201_CREATED)


class ThemeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET, PATCH, DELETE /api/auth/themes/<id>/
    Allows retrieving, updating (e.g. sharing), and deleting a custom theme.
    """
    serializer_class = ThemeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only modify their own themes
        return Theme.objects.filter(created_by=self.request.user, theme_type='custom')

    def perform_destroy(self, instance):
        if instance.theme_type == 'builtin':
            return Response({"error": "Cannot delete built-in themes."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if this theme is currently active for any users (including the creator)
        # and revert them to default light theme
        active_users = UserAppearance.objects.filter(selected_theme=instance)
        if active_users.exists():
            default_theme = Theme.objects.filter(slug='light').first()
            active_users.update(selected_theme=default_theme)
            
        instance.delete()


class UpdateAppearanceView(generics.UpdateAPIView):
    """
    PATCH /api/auth/appearance/
    Updates the appearance preference of the currently logged-in user.
    Accepts:
      - selected_theme (int id)
      - mode_preference ('system' | 'light' | 'dark')
    Both fields are optional; at least one must be present.
    """
    serializer_class = UserAppearanceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj, created = UserAppearance.objects.get_or_create(user=self.request.user)
        return obj

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        updated = False

        # ── Optional: update mode preference ──
        mode_preference = request.data.get('mode_preference')
        if mode_preference:
            instance.mode_preference = mode_preference
            updated = True

        # ── Optional: update selected theme ──
        theme_id = request.data.get('selected_theme')
        if theme_id:
            try:
                theme = Theme.objects.filter(
                    Q(theme_type='builtin') | Q(created_by=request.user) | Q(is_public=True)
                ).get(id=theme_id)
                instance.selected_theme = theme
                updated = True
            except (Theme.DoesNotExist, ValueError):
                return Response({"error": "Theme not found."}, status=status.HTTP_404_NOT_FOUND)

        if not updated:
            return Response({"error": "No valid fields provided. Supply 'selected_theme' or 'mode_preference'."}, status=status.HTTP_400_BAD_REQUEST)

        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# pyrefly: ignore [missing-import]
from rest_framework.throttling import AnonRateThrottle

class RegisterThrottle(AnonRateThrottle):
    scope = 'register'


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Creates a new user account (open access — no login required).
    """
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [RegisterThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "User registered successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveAPIView):
    """
    GET /api/auth/profile/
    Returns the profile of the currently logged-in user.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
