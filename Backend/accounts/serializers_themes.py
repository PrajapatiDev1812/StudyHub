# pyrefly: ignore [missing-import]
from rest_framework import serializers
import uuid
# pyrefly: ignore [missing-import]
from django.utils.text import slugify
from .models import Theme, ThemeVersion

class ThemeSerializer(serializers.ModelSerializer):
    """Complete serializer for enterprise themes including brand colors, tokens, and scheduling."""
    # Returns the fully-qualified URL (e.g. http://127.0.0.1:8000/media/themes/backgrounds/x.jpg)
    # so the frontend never needs to resolve relative paths.
    background_image_url = serializers.SerializerMethodField()

    def get_background_image_url(self, obj):
        if not obj.background_image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.background_image.url)
        # Fallback: return the relative URL (starts with /media/)
        return obj.background_image.url

    class Meta:
        model = Theme
        fields = [
            'id', 'name', 'slug', 'description', 'theme_type', 'mode',
            'primary_color', 'secondary_color', 'accent_color',
            'generated_colors', 'config', 'background_image', 'background_image_url',
            'logo', 'favicon',
            'university', 'created_by', 'is_public', 'is_global', 'is_active',
            'schedule_start', 'schedule_end', 'is_mandatory_schedule',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'background_image_url']


class ThemeCreateUpdateSerializer(serializers.ModelSerializer):
    """Used for creating and updating themes with automatic slug generation."""
    class Meta:
        model = Theme
        fields = [
            'name', 'description', 'theme_type', 'mode',
            'primary_color', 'secondary_color', 'accent_color',
            'generated_colors', 'config', 'background_image', 'logo', 'favicon',
            'university', 'is_public', 'is_global', 'is_active',
            'schedule_start', 'schedule_end', 'is_mandatory_schedule'
        ]

    def create(self, validated_data):
        name = validated_data.get('name', 'Custom Theme')
        base_slug = slugify(name) or "theme"
        slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"
        user = None
        if 'request' in self.context and self.context['request'] and hasattr(self.context['request'], 'user'):
            user = self.context['request'].user
            if not user.is_authenticated:
                user = None
        return Theme.objects.create(slug=slug, created_by=user, **validated_data)


class ThemeVersionSerializer(serializers.ModelSerializer):
    """Serializer for viewing audit history and rollback snapshots."""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = ThemeVersion
        fields = [
            'id', 'theme', 'version_number', 'name', 'mode',
            'primary_color', 'secondary_color', 'accent_color',
            'generated_colors', 'config', 'comment',
            'created_by', 'created_by_username', 'created_at'
        ]
        read_only_fields = fields


class ThemeExportSerializer(serializers.ModelSerializer):
    """Serializer for exporting theme structure to portable JSON."""
    class Meta:
        model = Theme
        fields = [
            'name', 'description', 'mode', 'theme_type',
            'primary_color', 'secondary_color', 'accent_color',
            'generated_colors', 'config', 'is_global',
            'schedule_start', 'schedule_end', 'is_mandatory_schedule'
        ]
