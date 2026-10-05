# Generated manually
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0003_task_manager'),
    ]

    operations = [
        migrations.AddField(
            model_name='taskassignment',
            name='achievement_credited',
            field=models.BooleanField(default=False),
        ),
    ]
