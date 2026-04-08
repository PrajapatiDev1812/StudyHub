import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from gamification.models import Badge

badges = [
    {
        "name": "First Steps",
        "description": "Complete your first task.",
        "category": "task",
        "condition_type": "tasks_completed",
        "condition_value": 1,
        "xp_reward": 50,
    },
    {
        "name": "Task Master",
        "description": "Complete 10 tasks.",
        "category": "task",
        "condition_type": "tasks_completed",
        "condition_value": 10,
        "xp_reward": 200,
    },
    {
        "name": "Focus Novice",
        "description": "Accumulate 30 minutes of focus time.",
        "category": "focus",
        "condition_type": "focus_time",
        "condition_value": 30,
        "xp_reward": 100,
    },
    {
        "name": "Focus Master",
        "description": "Accumulate 120 minutes of focus time.",
        "category": "focus",
        "condition_type": "focus_time",
        "condition_value": 120,
        "xp_reward": 300,
    },
    {
        "name": "Top Scorer",
        "description": "Achieve an average test score above 90%.",
        "category": "test",
        "condition_type": "test_score",
        "condition_value": 90,
        "xp_reward": 500,
    },
    {
        "name": "AI Explorer",
        "description": "Interact with FitAI 5 times.",
        "category": "ai",
        "condition_type": "ai_usage",
        "condition_value": 5,
        "xp_reward": 150,
    },
    {
        "name": "Streak Beginner",
        "description": "Achieve a 3-day streak.",
        "category": "streak",
        "condition_type": "streak_days",
        "condition_value": 3,
        "xp_reward": 100,
    },
    {
        "name": "Dedicated Learner",
        "description": "Achieve a 7-day streak.",
        "category": "streak",
        "condition_type": "streak_days",
        "condition_value": 7,
        "xp_reward": 300,
    }
]

def seed():
    print("Seeding badges...")
    for b in badges:
        obj, created = Badge.objects.get_or_create(
            name=b['name'],
            defaults={
                'description': b['description'],
                'category': b['category'],
                'condition_type': b['condition_type'],
                'condition_value': b['condition_value'],
                'xp_reward': b['xp_reward']
            }
        )
        if created:
            print(f"Created badge: {obj.name}")
        else:
            print(f"Badge already exists: {obj.name}")
    print("Done seeding.")

if __name__ == "__main__":
    seed()
