from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('student', 'Student'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    is_active_user = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class User2FA(models.Model):
    """
    Stores the 2FA configuration for every user.
    otp_secret is a Base32-encoded string for TOTP.
    backup_codes holds a JSON array of bcrypt-hashed one-time recovery codes.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='two_fa')
    otp_secret = models.CharField(max_length=64)           # Base32 TOTP secret
    is_enabled = models.BooleanField(default=False)        # True only after first OTP verified
    is_setup_complete = models.BooleanField(default=False) # False until user scans + verifies QR
    backup_codes = models.JSONField(default=list)          # List of hashed one-time codes

    # Brute-force lockout tracking
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_locked(self):
        """Check if OTP verification is currently locked out."""
        if self.locked_until and timezone.now() < self.locked_until:
            return True
        return False

    def record_failed_attempt(self):
        """Increment failure count; lock after 5 failures for 10 minutes."""
        self.failed_attempts += 1
        if self.failed_attempts >= 5:
            self.locked_until = timezone.now() + timezone.timedelta(minutes=10)
            self.failed_attempts = 0
        self.save(update_fields=['failed_attempts', 'locked_until'])

    def clear_failed_attempts(self):
        """Reset on successful OTP verification."""
        self.failed_attempts = 0
        self.locked_until = None
        self.save(update_fields=['failed_attempts', 'locked_until'])

    def __str__(self):
        return f"2FA for {self.user.username} ({'enabled' if self.is_enabled else 'disabled'})"


class OTPAttemptLog(models.Model):
    """
    Audit log for every OTP verification attempt.
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='otp_logs')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=False)
    used_backup_code = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        result = "SUCCESS" if self.success else "FAILED"
        return f"OTP [{result}] for {self.user} at {self.created_at}"


class AccountRecoveryLog(models.Model):
    """
    Detailed audit log for all account recovery attempts.
    """
    RECOVERY_TYPES = (
        ('password', 'Forgot Password'),
        ('username', 'Forgot Username'),
        ('manual', 'Manual Request'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='recovery_logs')
    email_submitted = models.EmailField()
    recovery_type = models.CharField(max_length=20, choices=RECOVERY_TYPES)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    status = models.CharField(max_length=50)  # e.g., 'initiated', 'completed', 'blocked_rate_limit', 'failed'
    risk_score = models.IntegerField(default=0)  # 0-100 score based on IP/behavior
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.recovery_type} log for {self.email_submitted} at {self.created_at}"


class ManualRecoveryRequest(models.Model):
    """
    Fallback request for manual admin intervention.
    """
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='manual_recovery_requests')
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    username = models.CharField(max_length=150, blank=True)
    enrollment_no = models.CharField(max_length=50, blank=True)
    role_claimed = models.CharField(max_length=20)
    reason = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_recoveries')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Manual Recovery: {self.full_name} ({self.status})"


class PasswordHistory(models.Model):
    """
    Stores past password hashes to prevent reuse of the last 5 passwords.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_history')
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Password histories"

    def __str__(self):
        return f"History for {self.user.username} at {self.created_at}"


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