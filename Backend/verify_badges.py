import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from gamification.services import track_event
from gamification.models import UserBadge, UserStats

User = get_user_model()
user = User.objects.filter(role='student').first()

if not user:
    print("No student user found.")
else:
    print(f"Testing for user: {user.username}")
    
    # Reset stats for clean test if needed (optional)
    stats, _ = UserStats.objects.get_or_create(user=user)
    stats.tasks_completed = 0
    stats.save()
    UserBadge.objects.filter(user=user).delete()
    
    print("Simulating 10 task completions...")
    all_unlocked = []
    for i in range(10):
        unlocked = track_event(user, 'task_complete')
        if unlocked:
            for b in unlocked:
                print(f"  [Event {i+1}] Unlocked: {b.name} (Tier: {b.tier})")
                all_unlocked.append(b)

    # Check repeatable count
    rb = UserBadge.objects.filter(user=user, badge__repeatable=True).first()
    if rb:
        print(f"Repeatable badge '{rb.badge.name}' count: {rb.earned_count}")
    
    # Check milestone
    mb = UserBadge.objects.filter(user=user, badge__tier='bronze').first()
    if mb:
        print(f"Milestone badge '{mb.badge.name}' UNLOCKED at count {stats.tasks_completed}")
    else:
        print("Milestone badge NOT unlocked.")
