# Generated manually
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0003_levelconfiguration_badge_status_achievementauditlog_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userstats',
            name='admin_tasks_completed',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='userstats',
            name='hard_admin_tasks_completed',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='badge',
            name='condition_type',
            field=models.CharField(choices=[('tasks_completed', 'Tasks Completed'), ('focus_time', 'Focus Time (Minutes)'), ('test_score', 'Test Score'), ('streak_days', 'Streak Days'), ('ai_usage', 'AI Usage Count'), ('admin_tasks_completed', 'Verified Admin Tasks Completed'), ('hard_admin_tasks_completed', 'Verified Hard Admin Tasks Completed')], max_length=50),
        ),
    ]
