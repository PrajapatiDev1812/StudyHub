"""
ai/models_governance.py
------------------------
AI Governance models for StudyHub Enterprise LMS.

Contains all database entities for the AI Quota Management System:
    - University            (multi-tenant foundation)
    - AIProvider            (database-driven provider registry)
    - AIModel               (model catalog per provider)
    - AIQuotaPolicy         (configurable quota rules)
    - AIUserQuota           (per-user quota overrides)
    - AIUsageRecord         (persistent usage tracking)
    - AIFeatureFlag         (feature toggle system)
    - AIAuditLog            (admin action audit trail)

Design Principles:
    - All quota configuration is database-driven — no hardcoded limits.
    - Role field uses current 2-role system (admin/student) with expansion hooks.
    - University model is a foundation stub for future multi-tenant.
    - API keys are encrypted using ai.encryption module.
    - Hierarchical quota resolution: Platform → University → Role → User.
"""

import uuid
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.conf import settings


# ═══════════════════════════════════════════════════════════════════════════════
# UNIVERSITY — Multi-Tenant Foundation
# ═══════════════════════════════════════════════════════════════════════════════

class University(models.Model):
    """
    Multi-tenant foundation model.

    In the current phase, this provides a grouping entity for quota scoping
    and analytics. Full tenant isolation (row-level security, data partitioning)
    will be added in the Enterprise Multi-Tenant Architecture phase.

    Usage:
        - Admins can create universities in the AI Management panel.
        - Quota policies can be scoped to a university.
        - Usage analytics can be filtered by university.
    """
    name = models.CharField(
        max_length=255, unique=True,
        help_text="Official name of the university / institution.",
    )
    code = models.CharField(
        max_length=50, unique=True,
        help_text="Short unique code (e.g. 'MIT', 'GSFC').",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive universities cannot access AI features.",
    )
    ai_enabled = models.BooleanField(
        default=True,
        help_text="Master switch: disable all AI features for this university.",
    )
    # ── Aggregate Limits (university-level caps) ──────────────────────────────
    max_requests_per_day = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Maximum total AI requests per day for this university (null = unlimited).",
    )
    max_tokens_per_day = models.PositiveBigIntegerField(
        null=True, blank=True,
        help_text="Maximum total tokens per day for this university (null = unlimited).",
    )
    # ── Metadata ──────────────────────────────────────────────────────────────
    contact_email = models.EmailField(blank=True, default='')
    config = models.JSONField(
        default=dict, blank=True,
        help_text="Extensible JSON config for university-specific AI settings.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'University'
        verbose_name_plural = 'Universities'
        ordering = ['name']

    def __str__(self):
        status = '✓' if self.is_active else '✗'
        return f"[{status}] {self.name} ({self.code})"


# ═══════════════════════════════════════════════════════════════════════════════
# AI PROVIDER — Database-Driven Provider Registry
# ═══════════════════════════════════════════════════════════════════════════════

class AIProvider(models.Model):
    """
    Database-driven AI provider configuration.

    Replaces the hardcoded PROVIDER_REGISTRY in ai/providers/registry.py.
    Providers are managed through the Admin Panel — switching providers
    requires only a configuration change, not a code change.

    Supported providers (extensible):
        google, openai, anthropic, grok, deepseek, local_llm
    """
    PROVIDER_SLUGS = [
        ('google', 'Google Gemini'),
        ('openai', 'OpenAI'),
        ('anthropic', 'Anthropic Claude'),
        ('grok', 'xAI Grok'),
        ('deepseek', 'DeepSeek'),
        ('local_llm', 'Local LLM'),
    ]

    name = models.CharField(
        max_length=100,
        help_text="Display name (e.g. 'Google Gemini').",
    )
    slug = models.CharField(
        max_length=50, unique=True,
        choices=PROVIDER_SLUGS,
        help_text="Machine-readable identifier (e.g. 'google').",
    )
    # ── API Key (encrypted in DB) ─────────────────────────────────────────────
    api_key_encrypted = models.TextField(
        blank=True, default='',
        help_text="Fernet-encrypted API key. Use ai.encryption to read/write.",
    )
    # ── Provider Configuration ────────────────────────────────────────────────
    base_url = models.URLField(
        blank=True, default='',
        help_text="Override base URL (for proxied or self-hosted providers).",
    )
    is_enabled = models.BooleanField(
        default=True,
        help_text="Disabled providers are not used for AI requests.",
    )
    is_default = models.BooleanField(
        default=False,
        help_text="The default provider used when none is specified.",
    )
    priority = models.PositiveSmallIntegerField(
        default=10,
        help_text="Lower = higher priority. Used for fallback ordering.",
    )
    # ── Fallback ──────────────────────────────────────────────────────────────
    fallback_provider = models.ForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='primary_for',
        help_text="If this provider fails, try the fallback provider.",
    )
    # ── Rate Limits (provider-level) ──────────────────────────────────────────
    max_requests_per_minute = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Provider-level rate limit (RPM). Null = no limit.",
    )
    # ── Extensible Config ─────────────────────────────────────────────────────
    config = models.JSONField(
        default=dict, blank=True,
        help_text="Extra provider-specific config (headers, timeouts, etc.).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Provider'
        verbose_name_plural = 'AI Providers'
        ordering = ['priority', 'name']

    def __str__(self):
        status = '✓' if self.is_enabled else '✗'
        default = ' [DEFAULT]' if self.is_default else ''
        return f"[{status}] {self.name}{default}"

    @property
    def api_key(self):
        """Decrypt and return the API key."""
        if not self.api_key_encrypted:
            return ''
        from ai.encryption import decrypt_value
        return decrypt_value(self.api_key_encrypted)

    @api_key.setter
    def api_key(self, plaintext_key):
        """Encrypt and store the API key."""
        from ai.encryption import encrypt_value
        self.api_key_encrypted = encrypt_value(plaintext_key)

    @property
    def masked_key(self):
        """Return masked API key for display."""
        from ai.encryption import mask_api_key, decrypt_value
        if not self.api_key_encrypted:
            return '(not set)'
        try:
            return mask_api_key(decrypt_value(self.api_key_encrypted))
        except Exception:
            return '(decryption error)'

    def save(self, *args, **kwargs):
        # Enforce only one default provider
        if self.is_default:
            AIProvider.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


# ═══════════════════════════════════════════════════════════════════════════════
# AI MODEL — Model Catalog
# ═══════════════════════════════════════════════════════════════════════════════

class AIModel(models.Model):
    """
    Stores configuration for each AI model available on the platform.

    Each model belongs to a provider. Admins can enable/disable models,
    set token limits, and configure costs for future billing.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('deprecated', 'Deprecated'),
        ('testing', 'Testing'),
        ('disabled', 'Disabled'),
    ]

    provider = models.ForeignKey(
        AIProvider, on_delete=models.CASCADE,
        related_name='models',
        help_text="The AI provider this model belongs to.",
    )
    name = models.CharField(
        max_length=100,
        help_text="Model identifier (e.g. 'gemini-2.0-flash').",
    )
    display_name = models.CharField(
        max_length=200,
        help_text="Human-readable name (e.g. 'Gemini 2.0 Flash').",
    )
    # ── Token Limits ──────────────────────────────────────────────────────────
    input_token_limit = models.PositiveIntegerField(
        default=128000,
        help_text="Maximum input tokens per request.",
    )
    output_token_limit = models.PositiveIntegerField(
        default=8192,
        help_text="Maximum output tokens per request.",
    )
    context_window = models.PositiveIntegerField(
        default=128000,
        help_text="Total context window size in tokens.",
    )
    # ── Cost Tracking (for future billing) ────────────────────────────────────
    cost_per_input_token = models.DecimalField(
        max_digits=12, decimal_places=8, default=0,
        help_text="Cost per input token in USD (e.g. 0.00000015).",
    )
    cost_per_output_token = models.DecimalField(
        max_digits=12, decimal_places=8, default=0,
        help_text="Cost per output token in USD.",
    )
    # ── Status & Flags ────────────────────────────────────────────────────────
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='active', db_index=True,
    )
    is_default = models.BooleanField(
        default=False,
        help_text="The default model for this provider.",
    )
    # ── Capabilities ──────────────────────────────────────────────────────────
    supported_features = models.JSONField(
        default=list, blank=True,
        help_text=(
            "List of supported features: "
            "['chat', 'embedding', 'summarization', 'code', 'vision', 'function_calling']"
        ),
    )
    config = models.JSONField(
        default=dict, blank=True,
        help_text="Extra model-specific config (safety settings, etc.).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Model'
        verbose_name_plural = 'AI Models'
        ordering = ['provider', 'name']
        unique_together = [['provider', 'name']]

    def __str__(self):
        return f"{self.provider.name} / {self.display_name} [{self.status}]"

    def save(self, *args, **kwargs):
        # Enforce only one default per provider
        if self.is_default:
            AIModel.objects.filter(
                provider=self.provider, is_default=True,
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


# ═══════════════════════════════════════════════════════════════════════════════
# AI QUOTA POLICY — Configurable Quota Rules
# ═══════════════════════════════════════════════════════════════════════════════

class AIQuotaPolicy(models.Model):
    """
    Database-driven quota policy.

    Each policy defines limits for a specific role (and optionally university).
    Policies are resolved hierarchically:
        User override → University+Role → Role → Platform default.

    All quotas come from this table — no hardcoded limits.

    ROLE_CHOICES supports the current 2-role system plus expansion hooks
    for future roles (super_admin, university_admin, teacher, etc.).
    """
    ROLE_CHOICES = [
        # Current roles
        ('admin', 'Admin (Super Admin)'),
        ('student', 'Student'),
        # Future expansion hooks — uncomment when RBAC is expanded
        # ('super_admin', 'Super Admin'),
        # ('university_admin', 'University Admin'),
        # ('teacher', 'Teacher'),
        # ('teaching_assistant', 'Teaching Assistant'),
        # ('guest', 'Guest'),
    ]
    WINDOW_CHOICES = [
        ('rolling', 'Rolling Window'),
        ('fixed', 'Fixed Window (Calendar Day)'),
    ]

    name = models.CharField(
        max_length=200,
        help_text="Descriptive name (e.g. 'Student Default', 'Admin Unlimited').",
    )
    # ── Scope ─────────────────────────────────────────────────────────────────
    role = models.CharField(
        max_length=30, choices=ROLE_CHOICES, db_index=True,
        help_text="The role this policy applies to.",
    )
    university = models.ForeignKey(
        University, on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='quota_policies',
        help_text="If set, this policy applies only to this university.",
    )
    # ── Request Limits ────────────────────────────────────────────────────────
    max_requests = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Max requests per window. Null = unlimited.",
    )
    max_tokens = models.PositiveBigIntegerField(
        null=True, blank=True,
        help_text="Max tokens per window. Null = unlimited.",
    )
    # ── Time Window ───────────────────────────────────────────────────────────
    time_window_hours = models.PositiveIntegerField(
        default=24,
        help_text="Window duration in hours.",
    )
    window_type = models.CharField(
        max_length=10, choices=WINDOW_CHOICES, default='rolling',
        help_text="Rolling = from first request. Fixed = calendar day.",
    )
    # ── Burst Protection ──────────────────────────────────────────────────────
    burst_limit = models.PositiveIntegerField(
        default=5,
        help_text="Max requests per burst window (e.g. per minute).",
    )
    burst_window_seconds = models.PositiveIntegerField(
        default=60,
        help_text="Burst window duration in seconds.",
    )
    # ── Concurrency ───────────────────────────────────────────────────────────
    concurrent_requests = models.PositiveSmallIntegerField(
        default=2,
        help_text="Max simultaneous AI requests per user.",
    )
    # ── Threshold & Grace ─────────────────────────────────────────────────────
    warning_threshold_pct = models.PositiveSmallIntegerField(
        default=80,
        help_text="Show warning when usage reaches this percentage (0-100).",
    )
    grace_requests = models.PositiveSmallIntegerField(
        default=0,
        help_text="Extra requests allowed after limit is reached.",
    )
    auto_block = models.BooleanField(
        default=True,
        help_text="Automatically block requests when limit is exceeded.",
    )
    # ── Status ────────────────────────────────────────────────────────────────
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive policies are not enforced.",
    )
    priority = models.PositiveSmallIntegerField(
        default=10,
        help_text="Lower = higher priority. Used when multiple policies match.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Quota Policy'
        verbose_name_plural = 'AI Quota Policies'
        ordering = ['priority', 'role']

    def __str__(self):
        scope = f"@{self.university.code}" if self.university else "(platform)"
        return f"{self.name} — {self.role} {scope}"

    @property
    def is_unlimited(self):
        """True if both request and token limits are null (unlimited)."""
        return self.max_requests is None and self.max_tokens is None


# ═══════════════════════════════════════════════════════════════════════════════
# AI USER QUOTA — Per-User Overrides
# ═══════════════════════════════════════════════════════════════════════════════

class AIUserQuota(models.Model):
    """
    Per-user quota override.

    Allows admins to give specific users custom limits that differ from
    their role's default policy. Takes highest priority in resolution.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_quota_override',
        help_text="The user this override applies to.",
    )
    quota_policy = models.ForeignKey(
        AIQuotaPolicy, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='user_overrides',
        help_text="Assign a specific policy. If null, uses custom fields below.",
    )
    # ── Custom Overrides (optional — only used if quota_policy is null) ───────
    custom_max_requests = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Override max requests (null = use policy default).",
    )
    custom_max_tokens = models.PositiveBigIntegerField(
        null=True, blank=True,
        help_text="Override max tokens (null = use policy default).",
    )
    reason = models.CharField(
        max_length=500, blank=True, default='',
        help_text="Reason for the override (for audit purposes).",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='quota_overrides_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI User Quota Override'
        verbose_name_plural = 'AI User Quota Overrides'

    def __str__(self):
        return f"Override for {self.user.username}"


# ═══════════════════════════════════════════════════════════════════════════════
# AI USAGE RECORD — Persistent Usage Tracking
# ═══════════════════════════════════════════════════════════════════════════════

class AIUsageRecord(models.Model):
    """
    Persistent per-user usage tracking.

    Redis handles real-time counters for speed; this table provides
    the durable source of truth, updated on each request.

    Tracks both windowed and lifetime usage.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_usage_records',
    )
    university = models.ForeignKey(
        University, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ai_usage_records',
    )
    # ── Current Window ────────────────────────────────────────────────────────
    window_start = models.DateTimeField(
        help_text="Start of the current quota window.",
    )
    window_end = models.DateTimeField(
        help_text="End of the current quota window.",
    )
    requests_used = models.PositiveIntegerField(default=0)
    tokens_used = models.PositiveBigIntegerField(default=0)
    # ── Lifetime Counters ─────────────────────────────────────────────────────
    lifetime_requests = models.PositiveBigIntegerField(default=0)
    lifetime_tokens = models.PositiveBigIntegerField(default=0)
    # ── Timestamps ────────────────────────────────────────────────────────────
    last_request_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Usage Record'
        verbose_name_plural = 'AI Usage Records'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'window_start'], name='ai_usage_user_window_idx'),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.requests_used} req / {self.tokens_used} tok"


# ═══════════════════════════════════════════════════════════════════════════════
# AI FEATURE FLAG — Feature Toggle System
# ═══════════════════════════════════════════════════════════════════════════════

class AIFeatureFlag(models.Model):
    """
    Toggle AI features at platform, university, or role level.

    Resolution: Role+University → University → Role → Platform.
    More specific flags take precedence.

    Features:
        ai_chat, ai_notes, ai_summaries, ai_quiz_generator,
        ai_flashcards, ai_translation, ai_code_assistant
    """
    FEATURE_CHOICES = [
        ('ai_chat', 'AI Chat'),
        ('ai_notes', 'AI Notes'),
        ('ai_summaries', 'AI Summaries'),
        ('ai_quiz_generator', 'AI Quiz Generator'),
        ('ai_flashcards', 'AI Flashcards'),
        ('ai_translation', 'AI Translation'),
        ('ai_code_assistant', 'AI Code Assistant'),
    ]
    SCOPE_CHOICES = [
        ('platform', 'Platform-wide'),
        ('university', 'University-specific'),
        ('role', 'Role-specific'),
    ]

    feature = models.CharField(
        max_length=30, choices=FEATURE_CHOICES, db_index=True,
        help_text="The AI feature to toggle.",
    )
    scope = models.CharField(
        max_length=20, choices=SCOPE_CHOICES, default='platform',
        help_text="Scope of this flag.",
    )
    university = models.ForeignKey(
        University, on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='feature_flags',
        help_text="Required when scope = 'university'.",
    )
    role = models.CharField(
        max_length=30, blank=True, default='',
        help_text="Required when scope = 'role'. Uses same role choices as quota policy.",
    )
    is_enabled = models.BooleanField(
        default=True,
        help_text="Whether this feature is enabled for the specified scope.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Feature Flag'
        verbose_name_plural = 'AI Feature Flags'
        ordering = ['feature', 'scope']

    def __str__(self):
        state = '✓' if self.is_enabled else '✗'
        scope_str = self.scope
        if self.university:
            scope_str += f"@{self.university.code}"
        if self.role:
            scope_str += f"/{self.role}"
        return f"[{state}] {self.get_feature_display()} ({scope_str})"


# ═══════════════════════════════════════════════════════════════════════════════
# AI AUDIT LOG — Admin Action Audit Trail
# ═══════════════════════════════════════════════════════════════════════════════

class AIAuditLog(models.Model):
    """
    Immutable audit log for all admin actions on AI governance entities.

    Records who changed what, when, and the before/after values.
    Only accessible to administrators. Never modified after creation.
    """
    ACTION_CHOICES = [
        # Quota actions
        ('quota_policy_created', 'Quota Policy Created'),
        ('quota_policy_updated', 'Quota Policy Updated'),
        ('quota_policy_deleted', 'Quota Policy Deleted'),
        ('user_quota_reset', 'User Quota Reset'),
        ('user_quota_override', 'User Quota Override'),
        # Provider actions
        ('provider_created', 'Provider Created'),
        ('provider_updated', 'Provider Updated'),
        ('provider_deleted', 'Provider Deleted'),
        ('provider_key_rotated', 'Provider API Key Rotated'),
        # Model actions
        ('model_created', 'Model Created'),
        ('model_updated', 'Model Updated'),
        ('model_deleted', 'Model Deleted'),
        # Feature flag actions
        ('feature_flag_changed', 'Feature Flag Changed'),
        # Config actions
        ('global_config_changed', 'Global Config Changed'),
        ('university_config_changed', 'University Config Changed'),
    ]
    ENTITY_TYPE_CHOICES = [
        ('quota_policy', 'Quota Policy'),
        ('user_quota', 'User Quota'),
        ('provider', 'AI Provider'),
        ('model', 'AI Model'),
        ('feature_flag', 'Feature Flag'),
        ('university', 'University'),
        ('global_config', 'Global Config'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ai_audit_logs',
        help_text="The admin who performed this action.",
    )
    action = models.CharField(
        max_length=30, choices=ACTION_CHOICES, db_index=True,
    )
    entity_type = models.CharField(
        max_length=20, choices=ENTITY_TYPE_CHOICES,
    )
    entity_id = models.CharField(
        max_length=100, blank=True, default='',
        help_text="PK of the affected entity.",
    )
    # ── Change Details ────────────────────────────────────────────────────────
    previous_value = models.JSONField(
        null=True, blank=True,
        help_text="Snapshot of entity state BEFORE the change.",
    )
    new_value = models.JSONField(
        null=True, blank=True,
        help_text="Snapshot of entity state AFTER the change.",
    )
    description = models.TextField(
        blank=True, default='',
        help_text="Human-readable description of what changed.",
    )
    # ── Context ───────────────────────────────────────────────────────────────
    ip_address = models.GenericIPAddressField(
        null=True, blank=True,
    )
    user_agent = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'AI Audit Log'
        verbose_name_plural = 'AI Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['admin_user', 'timestamp'], name='ai_audit_admin_ts_idx'),
            models.Index(fields=['entity_type', 'entity_id'], name='ai_audit_entity_idx'),
        ]

    def __str__(self):
        admin_name = self.admin_user.username if self.admin_user else 'system'
        return f"[{admin_name}] {self.get_action_display()} @ {self.timestamp:%Y-%m-%d %H:%M}"
