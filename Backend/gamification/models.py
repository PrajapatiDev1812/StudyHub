# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Badge(models.Model):
    CATEGORY_CHOICES = [
        ('task', 'Task'),
        ('focus', 'Focus'),
        ('test', 'Test'),
        ('streak', 'Streak'),
        ('special', 'Special'),
    ]
    
    CONDITION_TYPE_CHOICES = [
        ('tasks_completed', 'Tasks Completed'),
        ('focus_time', 'Focus Time (Minutes)'),
        ('test_score', 'Test Score'),
        ('streak_days', 'Streak Days'),
        ('ai_usage', 'AI Usage Count'),
    ]

    TIER_CHOICES = [
        ('none', 'No Tier'),
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('legendary', 'Legendary'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    icon = models.ImageField(upload_to='badges/', blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='special')
    condition_type = models.CharField(max_length=30, choices=CONDITION_TYPE_CHOICES)
    condition_value = models.IntegerField()
    xp_reward = models.IntegerField(default=50)
    is_hidden = models.BooleanField(default=False)
    
    # New fields for Advanced Badge System
    repeatable = models.BooleanField(default=False)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='none')
    milestone_value = models.IntegerField(default=0, help_text="Threshold count for tiered badges")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='earned_by')
    earned_count = models.IntegerField(default=1)
    earned_at = models.DateTimeField(auto_now_add=True)
    last_earned_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'badge')
        ordering = ['-last_earned_at']

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"

class UserStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
    tasks_completed = models.IntegerField(default=0)
    total_focus_minutes = models.IntegerField(default=0)
    tests_attempted = models.IntegerField(default=0)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    streak_days = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    ai_usage_count = models.IntegerField(default=0)
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)

    def __str__(self):
        return f"Stats for {self.user.username} (Lvl {self.level})"

class AchievementRule(models.Model):
    OPERATOR_CHOICES = [
        ('>=', 'Greater than or equal'),
        ('>', 'Greater than'),
        ('==', 'Equal to'),
        ('<=', 'Less than or equal'),
        ('<', 'Less than'),
    ]
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='rules')
    metric = models.CharField(max_length=50) # e.g., 'focus_sessions', 'test_score', 'tasks_completed'
    operator = models.CharField(max_length=5, choices=OPERATOR_CHOICES, default='>=')
    value = models.FloatField()
    required_occurrences = models.IntegerField(default=1, help_text="Number of times this rule must be met")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.badge.name}: {self.metric} {self.operator} {self.value}"

class XPTransaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='xp_transactions')
    amount = models.IntegerField()
    reason = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} {'+' if self.amount > 0 else ''}{self.amount} XP - {self.reason}"

class LevelConfiguration(models.Model):
    level = models.IntegerField(unique=True)
    xp_threshold = models.IntegerField()
    title = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['level']

    def __str__(self):
        return f"Level {self.level} ({self.xp_threshold} XP)"

class AchievementAuditLog(models.Model):
    ACTION_CHOICES = [
        ('badge_created', 'Badge Created'),
        ('badge_updated', 'Badge Updated'),
        ('rule_modified', 'Rule Modified'),
        ('manual_award', 'Manual Award'),
        ('manual_revoke', 'Manual Revoke'),
        ('xp_modified', 'XP Modified'),
        ('status_change', 'Status Changed'),
    ]
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='achievement_actions_performed')
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='achievement_actions_received')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    reason = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.actor} - {self.action} - {self.timestamp}"
