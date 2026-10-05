"""
ai/throttles.py
---------------
Custom throttle classes for the AI chatbot.

UPDATED: Now delegates to QuotaService for database-driven quota enforcement.
Falls back to the legacy DRF throttle if QuotaService is unavailable.

Throttles applied to ChatbotView and other AI endpoints:
    - AIQuotaThrottle:  Database-driven request + burst + concurrency
    - AIAnonThrottle:   IP-based daily cap for unauthenticated users
"""

# pyrefly: ignore [missing-import]
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
import logging

logger = logging.getLogger(__name__)


class AIQuotaThrottle(UserRateThrottle):
    """
    Database-driven quota throttle for authenticated users.

    Delegates to QuotaService.check_quota() for policy resolution.
    Falls back to DRF's built-in rate limiting if QuotaService fails.

    Note: When using AIQuotaMixin on views, this throttle becomes
    redundant (the mixin handles quota checking). Kept for backward
    compatibility with views that use throttle_classes directly.
    """
    scope = 'ai_daily'

    def allow_request(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return True  # Handled by AIAnonThrottle

        try:
            from ai.services.quota_service import QuotaService

            result = QuotaService.check_quota(request.user)
            if not result.allowed:
                # Store result for the view to access
                request.ai_quota_result = result
                self.wait_seconds = result.resets_in_seconds
                return False

            request.ai_quota_result = result
            return True

        except Exception as exc:
            logger.warning(f"[AIQuotaThrottle] QuotaService failed, using legacy: {exc}")
            # Fall back to legacy DRF throttle
            if request.user.is_superuser or getattr(request.user, 'role', '') == 'admin':
                self.scope = 'ai_admin'
            return super().allow_request(request, view)

    def wait(self):
        """Return seconds to wait before next request is allowed."""
        return getattr(self, 'wait_seconds', None) or super().wait()

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            return None
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident,
        }


class AIAnonThrottle(AnonRateThrottle):
    """
    Daily cap for unauthenticated (anonymous) users.
    Identifies by IP address.
    """
    scope = 'ai_anon'


# ── Legacy aliases for backward compatibility ─────────────────────────────────
# Existing code may import these names from throttles.py
AIDailyThrottle = AIQuotaThrottle
AIBurstThrottle = AIQuotaThrottle  # Burst is now integrated into QuotaService
