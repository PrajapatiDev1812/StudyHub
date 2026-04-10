from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.urls import reverse
import logging

logger = logging.getLogger(__name__)

def send_recovery_email(user, recovery_type, token=None, request=None):
    """
    Sends a security-hardened recovery email.
    Supports Forgot Password, Forgot Username, and Security Alerts.
    """
    subject = ""
    template_name = ""
    context = {
        'user': user,
        'app_name': 'StudyHub',
        'support_email': 'support@studyhub.edu'
    }

    # Determine protocol and domain for links
    # In production, we force HTTPS
    protocol = 'https' if not settings.DEBUG or (request and request.is_secure()) else 'http'
    domain = request.get_host() if request else 'studyhub.edu'
    base_url = f"{protocol}://{domain}"

    if recovery_type == 'password_reset':
        subject = "Reset your StudyHub Password"
        template_name = "emails/password_reset.html"
        # The frontend handles the token, usually at a route like /reset-password?token=...
        context['reset_link'] = f"http://localhost:5173/reset-password?token={token}&user_id={user.id}"
        # When deployed, the user will provide the real domain. For now we use the local frontend.
        
    elif recovery_type == 'username_reminder':
        subject = "Your StudyHub Username"
        template_name = "emails/username_reminder.html"
        
    elif recovery_type == 'password_changed':
        subject = "SECURITY ALERT: Your password was changed"
        template_name = "emails/password_changed_alert.html"
        context['timestamp'] = timezone.now()
        context['ip_address'] = request.META.get('REMOTE_ADDR') if request else 'Unknown'

    try:
        # We'll create simple templates or just use strings if templates don't exist yet
        # For this implementation, I'll use a standardized HTML structure string to ensure it works immediately
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #6C63FF; margin: 0;">StudyHub</h1>
            </div>
            <div style="color: #333; line-height: 1.6;">
                <p>Hello {user.username or 'User'},</p>
                {"<p>We received a request to reset your password. Click the button below to proceed. This link will expire in 30 minutes.</p>" if recovery_type == 'password_reset' else ""}
                {"<p>We received a request for your username. Here it is:</p><div style='padding: 15px; background: #f4f4f4; text-align: center; font-weight: bold; font-size: 1.2rem;'>" + user.username + "</div>" if recovery_type == 'username_reminder' else ""}
                {"<p>Your password was successfully changed. If you did not perform this action, please contact support immediately.</p>" if recovery_type == 'password_changed' else ""}
                
                {f'<div style="text-align: center; margin: 30px 0;"><a href="{context.get("reset_link")}" style="background: #6C63FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a></div>' if recovery_type == 'password_reset' else ""}
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            <div style="color: #888; font-size: 0.8rem; text-align: center;">
                <p>This is an automated security notification. Please do not reply.</p>
                <p>&copy; 2026 StudyHub Platform</p>
            </div>
        </div>
        """
        
        text_content = strip_tags(html_content)
        
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        logger.info(f"Recovery email ({recovery_type}) sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send {recovery_type} email: {str(e)}")
        return False

def send_manual_recovery_alert(request_obj):
    """Notify admins of a new manual recovery request"""
    # Placeholder for admin notification logic
    pass
