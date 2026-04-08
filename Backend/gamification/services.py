from django.utils import timezone
from datetime import timedelta
from .models import UserStats, Badge, UserBadge

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
        earned_badges = set(user.earned_badges.values_list('badge_id', flat=True))
        all_badges = Badge.objects.all()
        
        unlocked = []
        for badge in all_badges:
            if badge.id in earned_badges:
                continue
                
            if BadgeEngine.is_badge_earned(stats, badge):
                UserBadge.objects.create(user=user, badge=badge)
                stats.xp += badge.xp_reward
                stats.level = (stats.xp // 100) + 1  # basic level formula
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
    
    if event_type == 'task_complete':
        stats.tasks_completed += 1
        stats.xp += 10  # Base XP for task
        StreakManager.update_streak(stats)
        
    elif event_type == 'focus_complete':
        # value = minutes of focus
        if value:
            stats.total_focus_minutes += value
            stats.xp += (value // 5) * 5 # Base XP 1 per minute roughly
        StreakManager.update_streak(stats)
        
    elif event_type == 'test_submit':
        # value = percentage score
        if value is not None:
            stats.tests_attempted += 1
            # Recalculate average
            old_total = (stats.tests_attempted - 1) * float(stats.average_score)
            new_total = old_total + float(value)
            stats.average_score = new_total / stats.tests_attempted
            stats.xp += 20 # Base XP
        StreakManager.update_streak(stats)
        
    elif event_type == 'ai_used':
        stats.ai_usage_count += 1
        stats.xp += 1 # small XP for using AI
        
    elif event_type == 'login':
        StreakManager.update_streak(stats)
    
    # Recalculate level initially before badges just in case
    stats.level = (stats.xp // 100) + 1
        
    unlocked_badges = BadgeEngine.check_badges(user, stats)
    
    stats.save()
    
    return unlocked_badges
