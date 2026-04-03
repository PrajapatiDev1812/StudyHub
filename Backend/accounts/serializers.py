from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Theme, UserAppearance

User = get_user_model()


class ThemeSerializer(serializers.ModelSerializer):
    """Serializer for built-in and custom themes."""
    class Meta:
        model = Theme
        fields = ['id', 'name', 'slug', 'theme_type', 'config', 'is_public', 'background_image']

class CustomThemeCreateSerializer(serializers.ModelSerializer):
    """Serializer for uploading a custom theme."""
    class Meta:
        model = Theme
        fields = ['name', 'background_image', 'config']
        
    def create(self, validated_data):
        import uuid
        slug = f"custom-{uuid.uuid4().hex[:8]}"
        user = self.context['request'].user
        return Theme.objects.create(
            slug=slug,
            theme_type='custom',
            created_by=user,
            is_public=False,
            **validated_data
        )

class UserAppearanceSerializer(serializers.ModelSerializer):
    """Serializer for user appearance preferences."""
    selected_theme_detail = ThemeSerializer(source='selected_theme', read_only=True)
    
    class Meta:
        model = UserAppearance
        fields = ['selected_theme', 'selected_theme_detail', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']

    def create(self, validated_data):
        # Use create_user so the password gets hashed properly
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'student'),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Read-only serializer for user profile, including appearance."""
    appearance = UserAppearanceSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active_user', 'date_joined', 'appearance']
        read_only_fields = fields
