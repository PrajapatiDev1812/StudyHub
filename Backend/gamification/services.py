from django.utils import timezone
from datetime import timedelta
from .models import UserStats, Badge, UserBadge
from . import badge_service

class StreakManager:
    @staticmethod
    def update_streak(stats):
        today = timezone.localtime(timezone.now()).date()
        
        if stats.last_activity_date == today:
            return  # Already logged activity today, do nothing

        if stats.last_activity_date == today - timedelta(days=1):
            # Consecutive day
            stats.streak_days += 1
        else:
            # Gap or first activity
            stats.streak_days = 1
            
        stats.last_activity_date = today

class BadgeEngine:
    @staticmethod
    def is_badge_earned(stats, badge):
        val = badge.condition_value
        
        if badge.condition_type == 'tasks_completed' and stats.tasks_completed >= val:
            return True
        if badge.condition_type == 'focus_time' and stats.total_focus_minutes >= val:
            return True
        if badge.condition_type == 'test_score' and stats.average_score >= val:
            # For now, evaluate test master on average score.
            # (An alternative could be checking individual scores during track_event)
            return True
        if badge.condition_type == 'streak_days' and stats.streak_days >= val:
            return True
        if badge.condition_type == 'ai_usage' and stats.ai_usage_count >= val:
            return True
            
        return False

    @staticmethod
    def check_badges(user, stats):
        earned_badge_ids = set(user.earned_badges.values_list('badge_id', flat=True))
        
        # Only check badges that are NOT repeatable and NOT milestones
        # (Those are handled specifically via badge_service during events)
        one_time_badges = Badge.objects.filter(
            repeatable=False, 
            tier='none',
            milestone_value=0
        )
        
        unlocked = []
        for badge in one_time_badges:
            if badge.id in earned_badge_ids:
                continue
                
            if BadgeEngine.is_badge_earned(stats, badge):
                _, created, xp = badge_service.award_badge(user, badge)
                if created:
                    unlocked.append(badge)
                
        return unlocked
        

def track_event(user, event_type, value=None):
    """
    Central function to track events.
    event_type can be: 'task_complete', 'focus_complete', 'test_submit', 'ai_used', 'login'
    """
    if not user or not user.is_authenticated:
        return []

    stats, _ = UserStats.objects.get_or_create(user=user)
    
    # Mapping event types to Badge condition types for milestones
    event_to_condition = {
        'task_complete': 'tasks_completed',
        'focus_complete': 'focus_time',
        'test_submit': 'test_score',
        'ai_used': 'ai_usage',
        'login': 'streak_days'
    }
    
    unlocked_badges = []
    
    if event_type == 'task_complete':
        stats.tasks_completed += 1
        stats.xp += 10
        StreakManager.update_streak(stats)
        
    elif event_type == 'focus_complete':
        if value:
            stats.total_focus_minutes += int(value)
            stats.xp += (int(value) // 5) * 5
        StreakManager.update_streak(stats)
        
    elif event_type == 'test_submit':
        if value is not None:
            stats.tests_attempted += 1
            old_total = (stats.tests_attempted - 1) * float(stats.average_score)
            new_total = old_total + float(value)
            stats.average_score = new_total / stats.tests_attempted
            stats.xp += 20
        StreakManager.update_streak(stats)
        
    elif event_type == 'ai_used':
        stats.ai_usage_count += 1
        stats.xp += 1
        
    elif event_type == 'login':
        StreakManager.update_streak(stats)
    
    stats.level = (stats.xp // 100) + 1
    stats.save()
    
    # 1. Handle Repeatable & Milestone Badges
    condition_type = event_to_condition.get(event_type)
    if condition_type:
        # Increment repeatable count
        new_count, base_badge = badge_service.increment_repeatable_badge(user, condition_type)
        if base_badge:
            # We return the base badge in the list if it was JUST earned for the first time
            # But the UI will mostly care about the increment if it's already earned.
            # We'll handle refined response in the View.
            pass
            
        # Check milestones based on the new count
        # For test_score, we might use stats.average_score instead of a count
        milestone_input = stats.average_score if condition_type == 'test_score' else new_count
        milestone_badges = badge_service.check_milestones(user, condition_type, milestone_input)
        unlocked_badges.extend(milestone_badges)

    # 2. Check traditional One-time Badges
    one_time_unlocked = BadgeEngine.check_badges(user, stats)
    unlocked_badges.extend(one_time_unlocked)
    
    return unlocked_badges
