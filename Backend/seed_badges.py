import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from gamification.models import Badge

# repeatable = BooleanField(default=False)
# tier = CharField (choices: bronze, silver, gold, legendary, none)
# milestone_value = IntegerField (threshold for tier unlock)

badges = [
    # --- TASK COMPLETION ---
    {
        "name": "Task Finisher",
        "description": "Keep completing tasks to reach new milestones!",
        "category": "task",
        "condition_type": "tasks_completed",
        "condition_value": 1,
        "xp_reward": 10,
        "repeatable": True,
        "tier": "none",
        "milestone_value": 0
    },
    {
        "name": "Task Finisher - Bronze",
        "description": "Completed 10 tasks. You're getting the hang of it!",
        "category": "task",
        "condition_type": "tasks_completed",
        "condition_value": 10,
        "xp_reward": 100,
        "repeatable": False,
        "tier": "bronze",
        "milestone_value": 10
    },
    {
        "name": "Task Finisher - Silver",
        "description": "Completed 50 tasks! Consistency is key.",
        "category": "task",
        "condition_type": "tasks_completed",
        "condition_value": 50,
        "xp_reward": 250,
        "repeatable": False,
        "tier": "silver",
        "milestone_value": 50
    },
    {
        "name": "Task Finisher - Gold",
        "description": "Completed 100 tasks! A true study warrior.",
        "category": "task",
        "condition_type": "tasks_completed",
        "condition_value": 100,
        "xp_reward": 500,
        "repeatable": False,
        "tier": "gold",
        "milestone_value": 100
    },
    {
        "name": "Task Finisher - Legendary",
        "description": "Completed 500 tasks! You are absolute legend.",
        "category": "task",
        "condition_type": "tasks_completed",
        "condition_value": 500,
        "xp_reward": 1500,
        "repeatable": False,
        "tier": "legendary",
        "milestone_value": 500
    },

    # --- FOCUS TIME ---
    {
        "name": "Deep Researcher",
        "description": "Keep focusing to earn tiered rewards.",
        "category": "focus",
        "condition_type": "focus_time",
        "condition_value": 1,
        "xp_reward": 10,
        "repeatable": True,
        "tier": "none",
        "milestone_value": 0
    },
    {
        "name": "Focus - Bronze",
        "description": "Focused for 60 minutes.",
        "category": "focus",
        "condition_type": "focus_time",
        "condition_value": 60,
        "xp_reward": 100,
        "repeatable": False,
        "tier": "bronze",
        "milestone_value": 60
    },
    {
        "name": "Focus - Silver",
        "description": "Focused for 300 minutes.",
        "category": "focus",
        "condition_type": "focus_time",
        "condition_value": 300,
        "xp_reward": 300,
        "repeatable": False,
        "tier": "silver",
        "milestone_value": 300
    },
    {
        "name": "Focus - Gold",
        "description": "Focused for 1000 minutes.",
        "category": "focus",
        "condition_type": "focus_time",
        "condition_value": 1000,
        "xp_reward": 700,
        "repeatable": False,
        "tier": "gold",
        "milestone_value": 1000
    },

    # --- TEST PERFORMANCE ---
    {
        "name": "Academic Excellence - Bronze",
        "description": "Maintain a 70% average score.",
        "category": "test",
        "condition_type": "test_score",
        "condition_value": 70,
        "xp_reward": 150,
        "repeatable": False,
        "tier": "bronze",
        "milestone_value": 70
    },
    {
        "name": " Academic Excellence - Silver",
        "description": "Maintain an 85% average score.",
        "category": "test",
        "condition_type": "test_score",
        "condition_value": 85,
        "xp_reward": 350,
        "repeatable": False,
        "tier": "silver",
        "milestone_value": 85
    },
    {
        "name": "Academic Excellence - Gold",
        "description": "Maintain a 95% average score.",
        "category": "test",
        "condition_type": "test_score",
        "condition_value": 95,
        "xp_reward": 800,
        "repeatable": False,
        "tier": "gold",
        "milestone_value": 95
    }
]

def seed():
    print("Seeding upgraded badges...")
    for b in badges:
        obj, created = Badge.objects.get_or_create(
            name=b['name'],
            defaults={
                'description': b['description'],
                'category': b['category'],
                'condition_type': b['condition_type'],
                'condition_value': b['condition_value'],
                'xp_reward': b['xp_reward'],
                'repeatable': b.get('repeatable', False),
                'tier': b.get('tier', 'none'),
                'milestone_value': b.get('milestone_value', 0)
            }
        )
        if created:
            print(f"Created badge: {obj.name}")
        else:
            # Update existing if necessary to add new logic
            obj.repeatable = b.get('repeatable', False)
            obj.tier = b.get('tier', 'none')
            obj.milestone_value = b.get('milestone_value', 0)
            obj.save()
            print(f"Updated badge: {obj.name}")
    print("Done seeding.")

if __name__ == "__main__":
    seed()
