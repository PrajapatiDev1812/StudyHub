from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import UserStats

User = settings.AUTH_USER_MODEL

@receiver(post_save, sender=User)
def create_user_stats(sender, instance, created, **kwargs):
    if created:
        UserStats.objects.create(user=instance)
