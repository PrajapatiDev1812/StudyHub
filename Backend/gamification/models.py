from django.db import models
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
