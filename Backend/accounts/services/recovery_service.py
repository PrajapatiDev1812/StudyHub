import logging
from django.utils import timezone
from django.contrib.auth.hashers import check_password, make_password
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from ..models import AccountRecoveryLog, PasswordHistory, User
from django.conf import settings

logger = logging.getLogger(__name__)

def calculate_recovery_risk(email, ip_address, user_agent):
    """
    Calculates a risk score (0-100) for a recovery attempt.
    High scores suggest botting or targeted account takeover attempts.
    """
    score = 0
    
    # Check frequency of attempts for this email in the last hour
    hour_ago = timezone.now() - timezone.timedelta(hours=1)
    email_attempts = AccountRecoveryLog.objects.filter(
        email_submitted=email, 
        created_at__gt=hour_ago
    ).count()
    
    if email_attempts > 2:
        score += 30
    if email_attempts > 5:
        score += 50

    # Check frequency for this IP in the last hour
    ip_attempts = AccountRecoveryLog.objects.filter(
        ip_address=ip_address,
        created_at__gt=hour_ago
    ).count()
    
    if ip_attempts > 5:
        score += 20
    if ip_attempts > 10:
        score += 50
        
    return min(score, 100)

def log_recovery_action(email, recovery_type, ip_address, user_agent, status, user=None, risk_score=0):
    """
    Records an entry in the recovery audit log.
    """
    return AccountRecoveryLog.objects.create(
        user=user,
        email_submitted=email,
        recovery_type=recovery_type,
        ip_address=ip_address,
        user_agent=user_agent,
        status=status,
        risk_score=risk_score
    )

def is_password_in_history(user, new_password):
    """
    Checks if the provided new password matches any of the user's recent passwords.
    """
    history = PasswordHistory.objects.filter(user=user).order_by('-created_at')[:settings.PASSWORD_HISTORY_COUNT]
    for h in history:
        if check_password(new_password, h.password_hash):
            return True
    return False

def add_to_password_history(user, password_hash):
    """
    Adds a new password hash to the user's history.
    """
    PasswordHistory.objects.create(user=user, password_hash=password_hash)
    
    # Prune old history entries beyond the limit
    history_ids = PasswordHistory.objects.filter(user=user).values_list('id', flat=True).order_by('-created_at')
    if len(history_ids) > settings.PASSWORD_HISTORY_COUNT:
        to_delete = history_ids[settings.PASSWORD_HISTORY_COUNT:]
        PasswordHistory.objects.filter(id__in=to_delete).delete()

def invalidate_all_user_sessions(user):
    """
    Force-logout a user on all devices by blacklisting all their refresh tokens.
    """
    # This requires 'rest_framework_simplejwt.token_blacklist' to be in INSTALLED_APPS
    # and OutstandingToken/BlacklistedToken to exist.
    tokens = OutstandingToken.objects.filter(user=user)
    for token in tokens:
        BlacklistedToken.objects.get_or_create(token=token)
    
    logger.info(f"Invalidated all sessions for user {user.username}")

def get_client_ip(request):
    """Helper to extract IP from request meta"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
