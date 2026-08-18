# pyrefly: ignore [missing-import]
from rest_framework import generics, permissions, status
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.db import transaction
import json

from .models import Theme, ThemeVersion, UserAppearance
from .serializers_themes import (
    ThemeSerializer,
    ThemeCreateUpdateSerializer,
    ThemeVersionSerializer,
    ThemeExportSerializer
)

class ThemeListView(generics.ListAPIView):
    """
    GET /api/themes/
    Lists all available themes (built-in, global, public custom themes, and user's own custom themes).
    """
    serializer_class = ThemeSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        queryset = Theme.objects.filter(is_active=True)
        if user.is_authenticated:
            # Show built-in, global, university, public custom themes, plus user's own themes
            return queryset.filter(
                models_Q_is_global_or_public(user)
            ).distinct()
        else:
            return queryset.filter(is_public=True)

# pyrefly: ignore [missing-import]
from django.db.models import Q
def models_Q_is_global_or_public(user):
    return Q(is_public=True) | Q(is_global=True) | Q(created_by=user)


class ActiveThemeView(APIView):
    """
    GET /api/themes/active/
    Resolves the current active theme according to the official StudyHub Enterprise override hierarchy:
    1. Mandatory Scheduled Theme
    2. User Personal Preference
    3. Optional Scheduled Theme
    4. Department / Course Theme (Extensibility)
    5. University Branding Theme
    6. System Default Theme
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now = timezone.now()
        
        # 1. Mandatory Scheduled Theme (Highest Priority)
        mandatory_scheduled = Theme.objects.filter(
            is_active=True,
            is_mandatory_schedule=True,
            schedule_start__lte=now,
            schedule_end__gte=now
        ).first()
        if mandatory_scheduled:
            data = ThemeSerializer(mandatory_scheduled).data
            data['resolution_source'] = 'mandatory_scheduled'
            return Response(data)

        # 2. User Personal Preference
        user = request.user
        if user.is_authenticated and hasattr(user, 'appearance') and user.appearance.selected_theme:
            user_theme = user.appearance.selected_theme
            if user_theme.is_active:
                data = ThemeSerializer(user_theme).data
                data['resolution_source'] = 'user_preference'
                data['mode_preference'] = user.appearance.mode_preference
                return Response(data)

        # 3. Optional Scheduled Theme
        optional_scheduled = Theme.objects.filter(
            is_active=True,
            is_mandatory_schedule=False,
            schedule_start__lte=now,
            schedule_end__gte=now
        ).first()
        if optional_scheduled:
            data = ThemeSerializer(optional_scheduled).data
            data['resolution_source'] = 'optional_scheduled'
            return Response(data)

        # 4 & 5. University / Department Branding Theme
        university_theme = Theme.objects.filter(
            is_active=True,
            theme_type='university'
        ).first()
        if university_theme:
            data = ThemeSerializer(university_theme).data
            data['resolution_source'] = 'university_branding'
            return Response(data)

        # 6. System Default Theme
        default_theme = Theme.objects.filter(slug='dark', is_active=True).first() or Theme.objects.filter(is_active=True).first()
        if default_theme:
            data = ThemeSerializer(default_theme).data
            data['resolution_source'] = 'system_default'
            return Response(data)

        # Absolute safe fallback if database is empty
        return Response({
            'name': 'Fallback Dark',
            'slug': 'dark',
            'mode': 'dark',
            'config': {
                '--background-primary': '#020617',
                '--surface-color': '#111827',
                '--text-primary': '#f8fafc'
            },
            'resolution_source': 'hardcoded_fallback'
        })


class ThemeCreateView(generics.CreateAPIView):
    """
    POST /api/themes/create/
    Create a new theme and auto-generate initial ThemeVersion v1.
    """
    serializer_class = ThemeCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        theme = serializer.save()
        # Create initial version
        ThemeVersion.objects.create(
            theme=theme,
            version_number=1,
            name=theme.name,
            mode=theme.mode,
            primary_color=theme.primary_color,
            secondary_color=theme.secondary_color,
            accent_color=theme.accent_color,
            generated_colors=theme.generated_colors,
            config=theme.config,
            comment="Initial creation",
            created_by=self.request.user if self.request.user.is_authenticated else None
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(ThemeSerializer(serializer.instance).data, status=status.HTTP_201_CREATED, headers=headers)


class ThemeDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/themes/{id}/
    PUT/PATCH /api/themes/{id}/update/
    DELETE /api/themes/{id}/
    """
    queryset = Theme.objects.all()
    serializer_class = ThemeCreateUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ThemeSerializer
        return ThemeCreateUpdateSerializer

    def perform_update(self, serializer):
        theme = serializer.save()
        # Automatically generate a new version history snapshot on update
        latest_version_num = theme.versions.count() + 1
        ThemeVersion.objects.create(
            theme=theme,
            version_number=latest_version_num,
            name=theme.name,
            mode=theme.mode,
            primary_color=theme.primary_color,
            secondary_color=theme.secondary_color,
            accent_color=theme.accent_color,
            generated_colors=theme.generated_colors,
            config=theme.config,
            comment=f"Update by {self.request.user.username}",
            created_by=self.request.user
        )

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        instance = self.get_object()
        return Response(ThemeSerializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_global or instance.theme_type == 'builtin':
            return Response(
                {"error": "Built-in and global core platform themes cannot be deleted."},
                status=status.HTTP_403_FORBIDDEN
            )
        # Check ownership unless admin
        if request.user != instance.created_by and getattr(request.user, 'role', '') != 'admin':
            return Response(
                {"error": "You do not have permission to delete this theme."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class ThemeVersionListView(generics.ListAPIView):
    """
    GET /api/themes/{id}/versions/
    List version history for a theme.
    """
    serializer_class = ThemeVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        theme_id = self.kwargs.get('pk')
        return ThemeVersion.objects.filter(theme_id=theme_id)


class ThemeVersionRestoreView(APIView):
    """
    POST /api/themes/{id}/versions/{version_id}/restore/
    Rollback theme configuration to a historical version snapshot.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, version_id):
        theme = get_object_or_404(Theme, pk=pk)
        version = get_object_or_404(ThemeVersion, pk=version_id, theme=theme)

        with transaction.atomic():
            theme.name = version.name
            theme.mode = version.mode
            theme.primary_color = version.primary_color
            theme.secondary_color = version.secondary_color
            theme.accent_color = version.accent_color
            theme.generated_colors = version.generated_colors
            theme.config = version.config
            theme.save()

            # Record rollback as a new version
            new_ver_num = theme.versions.count() + 1
            ThemeVersion.objects.create(
                theme=theme,
                version_number=new_ver_num,
                name=theme.name,
                mode=theme.mode,
                primary_color=theme.primary_color,
                secondary_color=theme.secondary_color,
                accent_color=theme.accent_color,
                generated_colors=theme.generated_colors,
                config=theme.config,
                comment=f"Restored to v{version.version_number} by {request.user.username}",
                created_by=request.user
            )

        return Response(ThemeSerializer(theme).data)


class ThemeExportView(APIView):
    """
    GET /api/themes/{id}/export/
    Export theme configuration as portable JSON structure.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        theme = get_object_or_404(Theme, pk=pk)
        serializer = ThemeExportSerializer(theme)
        return Response({
            "export_version": "1.0",
            "studyhub_tenant_export": True,
            "theme_data": serializer.data
        })


class ThemeImportView(APIView):
    """
    POST /api/themes/import/
    Import a theme configuration from JSON payload.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payload = request.data.get('theme_data', request.data)
        serializer = ThemeCreateUpdateSerializer(data=payload, context={'request': request})
        if serializer.is_valid():
            theme = serializer.save(theme_type='custom', created_by=request.user)
            # Record v1
            ThemeVersion.objects.create(
                theme=theme,
                version_number=1,
                name=theme.name,
                mode=theme.mode,
                primary_color=theme.primary_color,
                secondary_color=theme.secondary_color,
                accent_color=theme.accent_color,
                generated_colors=theme.generated_colors,
                config=theme.config,
                comment="Imported from JSON",
                created_by=request.user
            )
            return Response(ThemeSerializer(theme).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
