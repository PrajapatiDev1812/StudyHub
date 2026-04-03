from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('student', 'Student'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    is_active_user = models.BooleanField(default=True)

    def __str__(self):
        return self.username


class Theme(models.Model):
    """
    Stores built-in and user-created themes.
    Config JSON contains the CSS variable mappings.
    """
    THEME_TYPES = (
        ('builtin', 'Built-in'),
        ('custom', 'Custom'),
    )

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    theme_type = models.CharField(max_length=20, choices=THEME_TYPES, default='builtin')
    config = models.JSONField(help_text="JSON object of CSS variables and values")
    background_image = models.ImageField(upload_to='themes/backgrounds/', null=True, blank=True)
    
    # For custom themes
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='created_themes')
    is_public = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class UserAppearance(models.Model):
    """
    Stores a user's selected theme and other UI preferences.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='appearance')
    selected_theme = models.ForeignKey(Theme, on_delete=models.SET_NULL, null=True, related_name='users_selected')
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Appearance"


# --- Signals ---
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_appearance(sender, instance, created, **kwargs):
    if created:
        # Get default theme (light)
        default_theme = Theme.objects.filter(slug='light').first()
        UserAppearance.objects.create(user=instance, selected_theme=default_theme)