"""
ai/serializers/serializers_governance.py
-----------------------------------------
Serializers for all AI Governance models.

Includes validation, read-only fields, and role-aware field filtering.
API keys are NEVER returned in plaintext — only masked versions.
"""

# pyrefly: ignore [missing-import]
from rest_framework import serializers


# ═══════════════════════════════════════════════════════════════════════════════
# UNIVERSITY
# ═══════════════════════════════════════════════════════════════════════════════

class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        from ai.models_governance import University
        model = University
        fields = [
            'id', 'name', 'code', 'is_active', 'ai_enabled',
            'max_requests_per_day', 'max_tokens_per_day',
            'contact_email', 'config', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ═══════════════════════════════════════════════════════════════════════════════
# AI PROVIDER
# ═══════════════════════════════════════════════════════════════════════════════

class AIProviderSerializer(serializers.ModelSerializer):
    """
    Serializer for AIProvider model.

    Security:
        - api_key_encrypted is NEVER returned to the frontend
        - api_key (write-only) accepts plaintext and encrypts it
        - masked_key (read-only) returns the masked version
    """
    api_key = serializers.CharField(
        write_only=True, required=False, allow_blank=True,
        help_text="Plaintext API key (will be encrypted before storage).",
    )
    masked_key = serializers.CharField(read_only=True)
    fallback_provider_name = serializers.SerializerMethodField()

    class Meta:
        from ai.models_governance import AIProvider
        model = AIProvider
        fields = [
            'id', 'name', 'slug', 'api_key', 'masked_key',
            'base_url', 'is_enabled', 'is_default', 'priority',
            'fallback_provider', 'fallback_provider_name',
            'max_requests_per_minute', 'config',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'masked_key', 'created_at', 'updated_at']
        extra_kwargs = {
            'api_key_encrypted': {'write_only': True},
        }

    def get_fallback_provider_name(self, obj):
        if obj.fallback_provider:
            return obj.fallback_provider.name
        return None

    def create(self, validated_data):
        api_key = validated_data.pop('api_key', '')
        instance = super().create(validated_data)
        if api_key:
            instance.api_key = api_key
            instance.save(update_fields=['api_key_encrypted'])
        return instance

    def update(self, instance, validated_data):
        api_key = validated_data.pop('api_key', None)
        instance = super().update(instance, validated_data)
        if api_key is not None and api_key != '':
            instance.api_key = api_key
            instance.save(update_fields=['api_key_encrypted'])
        return instance


# ═══════════════════════════════════════════════════════════════════════════════
# AI MODEL
# ═══════════════════════════════════════════════════════════════════════════════

class AIModelSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()

    class Meta:
        from ai.models_governance import AIModel
        model = AIModel
        fields = [
            'id', 'provider', 'provider_name', 'name', 'display_name',
            'input_token_limit', 'output_token_limit', 'context_window',
            'cost_per_input_token', 'cost_per_output_token',
            'status', 'is_default', 'supported_features', 'config',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'provider_name', 'created_at', 'updated_at']

    def get_provider_name(self, obj):
        return obj.provider.name if obj.provider else None

    def validate_cost_per_input_token(self, value):
        if value < 0:
            raise serializers.ValidationError("Cost cannot be negative.")
        return value

    def validate_cost_per_output_token(self, value):
        if value < 0:
            raise serializers.ValidationError("Cost cannot be negative.")
        return value


# ═══════════════════════════════════════════════════════════════════════════════
# AI QUOTA POLICY
# ═══════════════════════════════════════════════════════════════════════════════

class AIQuotaPolicySerializer(serializers.ModelSerializer):
    university_name = serializers.SerializerMethodField()
    is_unlimited = serializers.BooleanField(read_only=True)

    class Meta:
        from ai.models_governance import AIQuotaPolicy
        model = AIQuotaPolicy
        fields = [
            'id', 'name', 'role', 'university', 'university_name',
            'max_requests', 'max_tokens',
            'time_window_hours', 'window_type',
            'burst_limit', 'burst_window_seconds',
            'concurrent_requests',
            'warning_threshold_pct', 'grace_requests', 'auto_block',
            'is_active', 'priority', 'is_unlimited',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'university_name', 'is_unlimited', 'created_at', 'updated_at']

    def get_university_name(self, obj):
        return obj.university.name if obj.university else None

    def validate_warning_threshold_pct(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Threshold must be 0-100.")
        return value

    def validate_time_window_hours(self, value):
        if value < 1:
            raise serializers.ValidationError("Window must be at least 1 hour.")
        return value


# ═══════════════════════════════════════════════════════════════════════════════
# AI USER QUOTA OVERRIDE
# ═══════════════════════════════════════════════════════════════════════════════

class AIUserQuotaSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        from ai.models_governance import AIUserQuota
        model = AIUserQuota
        fields = [
            'id', 'user', 'username', 'quota_policy',
            'custom_max_requests', 'custom_max_tokens',
            'reason', 'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'username', 'created_by', 'created_at', 'updated_at']

    def get_username(self, obj):
        return obj.user.username if obj.user else None


# ═══════════════════════════════════════════════════════════════════════════════
# AI USAGE RECORD
# ═══════════════════════════════════════════════════════════════════════════════

class AIUsageRecordSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    university_name = serializers.SerializerMethodField()

    class Meta:
        from ai.models_governance import AIUsageRecord
        model = AIUsageRecord
        fields = [
            'id', 'user', 'username', 'university', 'university_name',
            'window_start', 'window_end',
            'requests_used', 'tokens_used',
            'lifetime_requests', 'lifetime_tokens',
            'last_request_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_username(self, obj):
        return obj.user.username if obj.user else None

    def get_university_name(self, obj):
        return obj.university.name if obj.university else None


# ═══════════════════════════════════════════════════════════════════════════════
# AI FEATURE FLAG
# ═══════════════════════════════════════════════════════════════════════════════

class AIFeatureFlagSerializer(serializers.ModelSerializer):
    university_name = serializers.SerializerMethodField()
    feature_display = serializers.SerializerMethodField()

    class Meta:
        from ai.models_governance import AIFeatureFlag
        model = AIFeatureFlag
        fields = [
            'id', 'feature', 'feature_display', 'scope',
            'university', 'university_name', 'role',
            'is_enabled', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'feature_display', 'university_name', 'created_at', 'updated_at']

    def get_university_name(self, obj):
        return obj.university.name if obj.university else None

    def get_feature_display(self, obj):
        return obj.get_feature_display()


# ═══════════════════════════════════════════════════════════════════════════════
# AI AUDIT LOG (Read-Only)
# ═══════════════════════════════════════════════════════════════════════════════

class AIAuditLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.SerializerMethodField()
    action_display = serializers.SerializerMethodField()

    class Meta:
        from ai.models_governance import AIAuditLog
        model = AIAuditLog
        fields = [
            'id', 'admin_user', 'admin_username',
            'action', 'action_display',
            'entity_type', 'entity_id',
            'previous_value', 'new_value', 'description',
            'ip_address', 'user_agent', 'timestamp',
        ]
        read_only_fields = fields

    def get_admin_username(self, obj):
        return obj.admin_user.username if obj.admin_user else 'system'

    def get_action_display(self, obj):
        return obj.get_action_display()


# ═══════════════════════════════════════════════════════════════════════════════
# AI REQUEST LOG (Read-Only, with filters)
# ═══════════════════════════════════════════════════════════════════════════════

class AIRequestLogAdminSerializer(serializers.ModelSerializer):
    """Admin-level request log serializer with full details."""
    username = serializers.SerializerMethodField()

    class Meta:
        from ai.models import AIRequestLog
        model = AIRequestLog
        fields = [
            'id', 'user', 'username', 'role_snapshot',
            'request_type', 'provider', 'model_name',
            'input_tokens', 'output_tokens', 'total_tokens',
            'response_time_ms', 'status', 'error_code',
            'timestamp', 'detected_topic',
        ]
        read_only_fields = fields

    def get_username(self, obj):
        return obj.user.username if obj.user else 'deleted_user'


# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

class AIAnalyticsDashboardSerializer(serializers.Serializer):
    """Serializer for the admin analytics dashboard response."""
    total_requests_today = serializers.IntegerField()
    total_tokens_today = serializers.IntegerField()
    active_users_today = serializers.IntegerField()
    most_active_user = serializers.DictField(required=False)
    average_response_time_ms = serializers.FloatField()
    failed_requests_today = serializers.IntegerField()
    blocked_requests_today = serializers.IntegerField()
    most_used_model = serializers.CharField(allow_blank=True)
    estimated_cost_today = serializers.FloatField()
