from rest_framework import serializers
from .models import Badge, UserBadge, UserStats

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = [
            'id', 'name', 'description', 'icon', 'category', 'condition_type', 
            'condition_value', 'xp_reward', 'is_hidden', 'repeatable', 
            'tier', 'milestone_value', 'created_at'
        ]

class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'earned_at', 'earned_count', 'last_earned_at']

class UserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStats
        fields = [
            'tasks_completed', 'total_focus_minutes', 'tests_attempted', 
            'average_score', 'streak_days', 'last_activity_date', 
            'ai_usage_count', 'xp', 'level'
        ]
