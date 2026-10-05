import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from gamification.models import Badge, UserStats
from tasks.models import TaskAssignment
from django.db import transaction

def seed_badges():
    print("Seeding Admin/Teacher Task Badges...")
    
    # 1. Base Repeatable Badge (Admin Tasks)
    Badge.objects.get_or_create(
        name="Verified Admin Task",
        condition_type="admin_tasks_completed",
        repeatable=True,
        tier="none",
        defaults={
            "description": "Base repeatable badge for completing an admin/teacher assigned task.",
            "category": "task",
            "condition_value": 1,
            "xp_reward": 10,
            "is_hidden": True,
        }
    )

    # 2. Milestones (Admin Tasks)
    milestones = [
        ("Task Starter", 5, "bronze", 50),
        ("Task Achiever", 10, "silver", 100),
        ("Task Master", 25, "gold", 250),
        ("Task Champion", 50, "legendary", 500),
        ("Task Legend", 100, "legendary", 1000),
    ]
    
    for name, required, tier, xp in milestones:
        Badge.objects.get_or_create(
            name=name,
            condition_type="admin_tasks_completed",
            milestone_value=required,
            defaults={
                "description": f"Complete {required} verified Admin/Teacher tasks.",
                "category": "task",
                "condition_value": required,
                "tier": tier,
                "xp_reward": xp,
                "repeatable": False,
            }
        )

    # 3. Base Repeatable Badge (Hard Admin Tasks)
    Badge.objects.get_or_create(
        name="Verified Hard Admin Task",
        condition_type="hard_admin_tasks_completed",
        repeatable=True,
        tier="none",
        defaults={
            "description": "Base repeatable badge for completing a hard admin/teacher assigned task.",
            "category": "task",
            "condition_value": 1,
            "xp_reward": 15,
            "is_hidden": True,
        }
    )

    # 4. Milestones (Hard Admin Tasks)
    hard_milestones = [
        ("Challenge Seeker", 5, "silver", 100),
        ("Challenge Master", 10, "gold", 250),
        ("Challenge Champion", 25, "legendary", 500),
    ]
    
    for name, required, tier, xp in hard_milestones:
        Badge.objects.get_or_create(
            name=name,
            condition_type="hard_admin_tasks_completed",
            milestone_value=required,
            defaults={
                "description": f"Complete {required} verified Hard Admin/Teacher tasks.",
                "category": "task",
                "condition_value": required,
                "tier": tier,
                "xp_reward": xp,
                "repeatable": False,
            }
        )

    print("Badges seeded successfully.")

def migrate_historical_data():
    print("Migrating historical Admin/Teacher task progress...")
    
    with transaction.atomic():
        # Get all completely verified admin/teacher tasks that haven't been credited yet
        assignments = TaskAssignment.objects.filter(
            status='VERIFIED',
            task__source='ADMIN_ASSIGNED',
            achievement_credited=False
        ).select_related('student', 'task')
        
        credited_count = 0
        
        for assignment in assignments:
            assignment.achievement_credited = True
            
            student = assignment.student
            stats, _ = UserStats.objects.get_or_create(user=student)
            
            stats.admin_tasks_completed += 1
            if assignment.task.priority == 'high':
                stats.hard_admin_tasks_completed += 1
                
            stats.save(update_fields=['admin_tasks_completed', 'hard_admin_tasks_completed'])
            credited_count += 1
            
        TaskAssignment.objects.filter(id__in=[a.id for a in assignments]).update(achievement_credited=True)
        
        print(f"Migrated {credited_count} historical task assignments for achievements.")

if __name__ == '__main__':
    seed_badges()
    migrate_historical_data()
