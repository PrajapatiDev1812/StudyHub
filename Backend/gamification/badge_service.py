from .models import Badge, UserBadge, UserStats
from django.db.models import Q

def award_badge(user, badge, count=1):
    """
    Actually assigns a badge to a user or updates their record.
    Returns (user_badge, was_created, xp_rewarded)
    """
    user_badge, created = UserBadge.objects.get_or_create(
        user=user, 
        badge=badge,
        defaults={'earned_count': count}
    )
    
    xp_rewarded = 0
    if created:
        # First time earning this specific badge
        stats, _ = UserStats.objects.get_or_create(user=user)
        stats.xp += badge.xp_reward
        stats.level = (stats.xp // 100) + 1
        stats.save()
        xp_rewarded = badge.xp_reward
    elif badge.repeatable:
        # If it's the base repeatable badge and we're just and incrementing
        # (Though we usually call increment_repeatable_badge for this)
        user_badge.earned_count = count
        user_badge.save()

    return user_badge, created, xp_rewarded

def increment_repeatable_badge(user, condition_type):
    """
    Increments the count for the base repeatable badge of a given type.
    Example: condition_type='tasks_completed'
    """
    # Find the base badge (repeatable=True, tier='none')
    base_badge = Badge.objects.filter(
        condition_type=condition_type, 
        repeatable=True,
        tier='none'
    ).first()
    
    if not base_badge:
        return 0, None

    user_badge, created = UserBadge.objects.get_or_create(
        user=user, 
        badge=base_badge,
        defaults={'earned_count': 0}
    )
    
    user_badge.earned_count += 1
    user_badge.save()
    
    # Base repeatable actions might give a small XP boost independently of milestones
    # as per user feedback: "not too much xp in between badge tier"
    # We already handle base XP in track_event, so we won't add extra here 
    # unless it's the FIRST time they earn the badge.
    
    if created:
        stats, _ = UserStats.objects.get_or_create(user=user)
        stats.xp += base_badge.xp_reward
        stats.level = (stats.xp // 100) + 1
        stats.save()

    return user_badge.earned_count, base_badge

def check_milestones(user, condition_type, current_count):
    """
    Checks if any tiered milestones have been reached.
    """
    # Get all milestone badges for this condition that the user hasn't earned yet
    earned_badge_ids = UserBadge.objects.filter(user=user).values_list('badge_id', flat=True)
    
    milestones = Badge.objects.filter(
        condition_type=condition_type,
        repeatable=False,
        milestone_value__lte=current_count
    ).exclude(tier='none').exclude(id__in=earned_badge_ids).order_by('milestone_value')
    
    unlocked = []
    for badge in milestones:
        # Award the milestone badge
        ub, created, xp = award_badge(user, badge)
        if created:
            unlocked.append(badge)
            
    return unlocked
