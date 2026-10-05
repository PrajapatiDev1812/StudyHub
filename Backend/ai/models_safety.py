import uuid
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.conf import settings
from ai.models_governance import University
from courses.models import Content


class AIGovernanceConfig(models.Model):
    """
    University-level AI configuration.
    """
    MODE_CHOICES = [
        ('general', 'General Assistant Mode'),
        ('academic', 'Academic Assistant Mode'),
        ('strict', 'Strict University Mode'),
        ('research', 'Research Mode'),
    ]

    university = models.OneToOneField(
        University, on_delete=models.CASCADE,
        related_name='ai_configuration'
    )
    mode = models.CharField(
        max_length=20, choices=MODE_CHOICES, default='academic'
    )
    enabled_capabilities = models.JSONField(
        default=dict,
        help_text="Dictionary of boolean flags for capabilities like 'answer_academic_questions'."
    )
    allow_global_knowledge = models.BooleanField(default=True)
    KNOWLEDGE_PRIORITY_CHOICES = [
        ('material_only', 'Material Only'),
        ('material_first', 'University Material First + Global Knowledge'),
        ('global_first', 'Global Knowledge Enabled'),
    ]
    knowledge_priority = models.CharField(
        max_length=20, choices=KNOWLEDGE_PRIORITY_CHOICES, default='material_first'
    )
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Configuration'
        verbose_name_plural = 'AI Configurations'

    def __str__(self):
        return f"AI Config for {self.university.name} ({self.mode})"


class AISafetyPolicy(models.Model):
    """
    Safety policies for universities.
    """
    ACTION_CHOICES = [
        ('allow', 'Allow'),
        ('allow_context', 'Allow With Context'),
        ('warn', 'Warn'),
        ('block', 'Block'),
    ]

    university = models.ForeignKey(
        University, on_delete=models.CASCADE,
        related_name='ai_safety_policies'
    )
    category = models.CharField(max_length=100)
    severity = models.CharField(max_length=20, default='high')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, default='block')
    is_system_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Safety Policy'
        verbose_name_plural = 'AI Safety Policies'
        unique_together = [['university', 'category']]

    def __str__(self):
        return f"[{self.university.code}] {self.category} -> {self.action}"


class AIPromptVersion(models.Model):
    """
    System prompt management with versioning.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('archived', 'Archived'),
    ]

    university = models.ForeignKey(
        University, on_delete=models.CASCADE,
        related_name='ai_prompt_versions'
    )
    version = models.PositiveIntegerField()
    prompt_text = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'AI Prompt Version'
        verbose_name_plural = 'AI Prompt Versions'
        unique_together = [['university', 'version']]
        ordering = ['-version']

    def __str__(self):
        return f"{self.university.code} v{self.version} ({self.status})"


class AIContentPolicy(models.Model):
    """
    Material-level AI Permissions without migrating core courses app.
    """
    CLASSIFICATION_CHOICES = [
        ('general', 'General Education'),
        ('medical', 'Medical Education'),
        ('research', 'Research Material'),
        ('sensitive', 'Sensitive Academic Topic'),
    ]

    APPROVAL_STATUS = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    content = models.OneToOneField(
        Content, on_delete=models.CASCADE,
        related_name='ai_policy'
    )
    ai_access_enabled = models.BooleanField(default=True)
    allow_rag_retrieval = models.BooleanField(default=True)
    content_classification = models.CharField(
        max_length=20, choices=CLASSIFICATION_CHOICES, default='general'
    )
    allow_sensitive_topic = models.BooleanField(default=False)
    approval_status = models.CharField(
        max_length=20, choices=APPROVAL_STATUS, default='approved'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Content Policy'
        verbose_name_plural = 'AI Content Policies'

    def __str__(self):
        return f"AI Policy for {self.content.title}"


class AIFeaturePolicy(models.Model):
    """
    Feature-level governance (Chat Assistant, Quiz Generator, etc.)
    """
    university = models.ForeignKey(
        University, on_delete=models.CASCADE,
        related_name='ai_feature_policies'
    )
    feature_name = models.CharField(max_length=100)
    enabled_roles = models.JSONField(default=list, help_text="Roles allowed to use this feature")
    usage_limit_per_day = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Feature Policy'
        verbose_name_plural = 'AI Feature Policies'
        unique_together = [['university', 'feature_name']]


class AISafetyViolationCounter(models.Model):
    """
    Tracks safety violations per user.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='ai_safety_violations'
    )
    university = models.ForeignKey(
        University, on_delete=models.CASCADE,
        related_name='ai_safety_violations'
    )
    violation_type = models.CharField(max_length=100)
    violation_count = models.PositiveIntegerField(default=0)
    last_violation_time = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Safety Violation Counter'
        verbose_name_plural = 'AI Safety Violation Counters'
        unique_together = [['user', 'university', 'violation_type']]


class AIGovernanceLog(models.Model):
    """
    Detailed AI request tracing for auditing and cost analytics.
    """
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('blocked_safety', 'Blocked by Safety Policy'),
        ('blocked_quota', 'Blocked by Quota'),
        ('failed_system', 'System Failure'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    university = models.ForeignKey(
        University, on_delete=models.SET_NULL, null=True, blank=True
    )
    request_status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    KNOWLEDGE_SOURCE_CHOICES = [
        ('STUDYHUB_MATERIAL', 'StudyHub Material'),
        ('GLOBAL_KNOWLEDGE', 'Global Knowledge'),
        ('MIXED_SOURCE', 'Mixed Source'),
    ]
    knowledge_source = models.CharField(
        max_length=50, choices=KNOWLEDGE_SOURCE_CHOICES, default='STUDYHUB_MATERIAL'
    )
    quota_consumed = models.BooleanField(default=False)
    safety_category = models.CharField(max_length=100, blank=True, null=True)
    moderation_result = models.JSONField(default=dict, blank=True)
    
    # Detailed tracing
    model_name = models.CharField(max_length=100, blank=True, null=True)
    prompt_version = models.PositiveIntegerField(null=True, blank=True)
    retrieved_documents = models.JSONField(default=list, blank=True)
    latency_ms = models.PositiveIntegerField(null=True, blank=True)
    token_usage = models.PositiveIntegerField(default=0)
    cost_estimate = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'AI Request Log'
        verbose_name_plural = 'AI Request Logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.request_status} @ {self.timestamp}"
