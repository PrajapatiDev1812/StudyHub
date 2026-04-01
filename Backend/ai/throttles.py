"""
ai/throttles.py
---------------
Custom per-endpoint throttle classes for the AI chatbot.

These throttles are applied ONLY to ChatbotView — no other
API endpoint is affected.

Limits (easy to change in settings.py → DEFAULT_THROTTLE_RATES):
  - Authenticated students : 50 requests/day  +  5 requests/min (burst)
  - Admin / superusers      : 100 requests/day (no burst limit)
  - Anonymous users         : 5 requests/day
"""

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class AIDailyThrottle(UserRateThrottle):
    """
    Daily cap for authenticated users.
    Admins/superusers automatically get the higher 'ai_admin' scope.
    """
    scope = 'ai_daily'

    def allow_request(self, request, view):
        # Superusers get a separate, higher quota
        if request.user and request.user.is_authenticated:
            if request.user.is_superuser or getattr(request.user, 'role', '') == 'admin':
                self.scope = 'ai_admin'
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        """
        Make the cache key scope-aware so admin & student buckets
        are tracked independently even within the same day.
        """
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            return None  # Anonymous — handled by AIAnonThrottle
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident,
        }


class AIBurstThrottle(UserRateThrottle):
    """
    Short-window burst cap for authenticated users.
    Prevents rapid-fire spam (e.g. script abuse).
    Admin users are EXEMPT from burst limiting.
    """
    scope = 'ai_burst'

    def allow_request(self, request, view):
        # Admins bypass burst limit
        if request.user and request.user.is_authenticated:
            if request.user.is_superuser or getattr(request.user, 'role', '') == 'admin':
                return True
        return super().allow_request(request, view)


class AIAnonThrottle(AnonRateThrottle):
    """
    Daily cap for unauthenticated (anonymous) users.
    Identifies by IP address.
    """
    scope = 'ai_anon'
