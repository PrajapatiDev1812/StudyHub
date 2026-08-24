# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from .models import Badge, UserBadge, UserStats, AchievementRule, LevelConfiguration, XPTransaction, AchievementAuditLog

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = [
            'id', 'name', 'description', 'icon', 'category', 'condition_type', 
            'condition_value', 'xp_reward', 'is_hidden', 'repeatable', 
            'tier', 'milestone_value', 'status', 'created_at'
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

class AchievementRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AchievementRule
        fields = '__all__'

class LevelConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LevelConfiguration
        fields = '__all__'

class XPTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = XPTransaction
        fields = '__all__'

class AchievementAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    target_user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AchievementAuditLog
        fields = '__all__'
        
    def get_actor_name(self, obj):
        return f"{obj.actor.first_name} {obj.actor.last_name}" if obj.actor else "System"
        
    def get_target_user_name(self, obj):
        return f"{obj.target_user.first_name} {obj.target_user.last_name}" if obj.target_user else ""
