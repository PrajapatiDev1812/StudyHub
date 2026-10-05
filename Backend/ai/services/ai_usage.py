"""
ai/services/ai_usage.py
-----------------------
Modular service layer for AI usage tracking.

UPDATED: Now delegates to QuotaService for database-driven quotas.
Maintains full backward compatibility with existing API surface.

All public functions (get_usage_summary, get_remaining, etc.) continue
to work identically — they now read from the governance system instead
of hardcoded constants.

Cache Key Format:
    Managed by QuotaService (ai_gov:req_count:USER_ID etc.)
"""

import logging
# pyrefly: ignore [missing-import]
from django.core.cache import cache
# pyrefly: ignore [missing-import]
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

# ── Legacy Constants (kept for backward compatibility) ─────────────────────────
# These are now FALLBACK VALUES ONLY. Actual limits come from the database.
STUDENT_DAILY_LIMIT = 50
ADMIN_DAILY_LIMIT = 100


# ── Internal Helpers ───────────────────────────────────────────────────────────

def get_today_date() -> str:
    """Return today's date as YYYY-MM-DD string (timezone-aware)."""
    return timezone.localdate().isoformat()


def get_next_midnight() -> timezone.datetime:
    """Return the next calendar midnight as a timezone-aware datetime."""
    now_local = timezone.localtime(timezone.now())
    tomorrow = now_local.date() + timedelta(days=1)
    midnight_naive = timezone.datetime(
        year=tomorrow.year,
        month=tomorrow.month,
        day=tomorrow.day,
        hour=0,
        minute=0,
        second=0,
    )
    return timezone.make_aware(midnight_naive, timezone.get_current_timezone())


def get_seconds_until_midnight() -> int:
    """Return integer seconds remaining until next calendar midnight."""
    now = timezone.now()
    midnight = get_next_midnight()
    delta = midnight - now
    return max(0, int(delta.total_seconds()))


# ── Public API (backward compatible) ──────────────────────────────────────────

def get_daily_limit(user) -> int:
    """
    Return the daily AI message limit for this user.

    Now reads from QuotaService (database-driven).
    Falls back to legacy constants if QuotaService is unavailable.
    """
    try:
        from ai.services.quota_service import QuotaService
        policy = QuotaService.get_effective_policy(user)
        limit = policy.get('max_requests')
        if limit is None:
            return 999999  # Unlimited
        return limit
    except Exception:
        # Legacy fallback
        if user.is_superuser or user.is_staff or getattr(user, 'role', '') == 'admin':
            return ADMIN_DAILY_LIMIT
        return STUDENT_DAILY_LIMIT


def get_used_today(user) -> int:
    """Return how many AI requests this user has made in the current window."""
    try:
        from ai.services.quota_service import QuotaService
        policy = QuotaService.get_effective_policy(user)
        window_hours = policy.get('time_window_hours', 24)
        window_type = policy.get('window_type', 'rolling')
        return QuotaService._get_request_count(user, window_hours, window_type)
    except Exception:
        # Legacy fallback
        key = f"ai_usage:{user.pk}:{get_today_date()}"
        count = cache.get(key)
        return count if count is not None else 0


def increment_usage(user) -> int:
    """
    Increment the user's daily AI request counter by 1.

    Now delegates to QuotaService.consume_quota().
    Returns the NEW count after incrementing.
    """
    try:
        from ai.services.quota_service import QuotaService
        QuotaService.consume_quota(user, tokens_used=0)
        policy = QuotaService.get_effective_policy(user)
        window_hours = policy.get('time_window_hours', 24)
        window_type = policy.get('window_type', 'rolling')
        return QuotaService._get_request_count(user, window_hours, window_type)
    except Exception:
        # Legacy fallback
        key = f"ai_usage:{user.pk}:{get_today_date()}"
        ttl = get_seconds_until_midnight() + 60
        try:
            new_count = cache.incr(key)
            try:
                cache.expire(key, ttl)
            except AttributeError:
                pass
        except ValueError:
            cache.set(key, 1, timeout=ttl)
            new_count = 1
        return new_count


def get_remaining(user) -> int:
    """Return how many AI requests the user can still make (never < 0)."""
    used = get_used_today(user)
    limit = get_daily_limit(user)
    return max(0, limit - used)


def get_usage_summary(user) -> dict:
    """
    Return a complete usage summary dict for the given user.

    Now delegates to QuotaService.get_usage_summary() for database-driven quotas.
    Falls back to legacy behavior if QuotaService is unavailable.
    """
    try:
        from ai.services.quota_service import QuotaService
        role = getattr(user, 'role', 'student')
        return QuotaService.get_usage_summary(user, role_view=role)
    except Exception:
        # Legacy fallback
        used = get_used_today(user)
        limit = get_daily_limit(user)
        remaining = max(0, limit - used)
        midnight = get_next_midnight()
        seconds = get_seconds_until_midnight()
        return {
            "daily_limit": limit,
            "used_today": used,
            "remaining_today": remaining,
            "reset_at": midnight.isoformat(),
            "resets_in_seconds": seconds,
        }
