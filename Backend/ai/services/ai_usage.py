"""
ai/services/ai_usage.py
-----------------------
Modular service layer for AI usage tracking.

Tracks how many AI requests each authenticated user has made today
using Django's cache (works with both LocMemCache and Redis).

Cache Key Format:
    ai_usage:{user_id}:{YYYY-MM-DD}

Example:
    ai_usage:7:2026-04-01
"""

from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta


# ── Constants ──────────────────────────────────────────────────────────────────

STUDENT_DAILY_LIMIT = 50
ADMIN_DAILY_LIMIT   = 100


# ── Internal Helpers ───────────────────────────────────────────────────────────

def get_today_date() -> str:
    """Return today's date as YYYY-MM-DD string (timezone-aware)."""
    return timezone.localdate().isoformat()


def get_cache_key(user) -> str:
    """
    Build a unique per-user-per-day cache key.

    Format: ai_usage:{user_id}:{YYYY-MM-DD}
    Example: ai_usage:7:2026-04-01
    """
    return f"ai_usage:{user.pk}:{get_today_date()}"


def get_next_midnight() -> timezone.datetime:
    """
    Return the next calendar midnight as a timezone-aware datetime.
    Uses Django's configured TIME_ZONE setting.
    """
    now_local   = timezone.localtime(timezone.now())
    tomorrow    = now_local.date() + timedelta(days=1)
    # Build naive midnight for tomorrow, then make it timezone-aware
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
    now       = timezone.now()
    midnight  = get_next_midnight()
    delta     = midnight - now
    return max(0, int(delta.total_seconds()))


def _ttl_until_midnight() -> int:
    """
    Cache TTL to use when storing today's usage count.
    Ensures the key expires automatically at midnight.
    Adds a 60-second buffer to avoid edge-case race conditions.
    """
    return get_seconds_until_midnight() + 60


# ── Public API ─────────────────────────────────────────────────────────────────

def get_daily_limit(user) -> int:
    """
    Return the daily AI message limit for this user.

    - Superusers and staff/admin role: ADMIN_DAILY_LIMIT (100)
    - All other authenticated users  : STUDENT_DAILY_LIMIT (50)
    """
    if user.is_superuser or user.is_staff or getattr(user, 'role', '') == 'admin':
        return ADMIN_DAILY_LIMIT
    return STUDENT_DAILY_LIMIT


def get_used_today(user) -> int:
    """Return how many AI requests this user has made today."""
    count = cache.get(get_cache_key(user))
    return count if count is not None else 0


def increment_usage(user) -> int:
    """
    Increment the user's daily AI request counter by 1.

    Uses atomic cache increment when available (Redis supports this).
    Falls back to a get-set cycle for LocMemCache.

    Returns the NEW count after incrementing.
    """
    key = get_cache_key(user)
    ttl = _ttl_until_midnight()

    try:
        # Atomic increment — works natively with Redis.
        # If the key doesn't exist yet, cache.incr raises ValueError.
        new_count = cache.incr(key)
        # Refresh TTL so it doesn't expire mid-day
        cache.expire(key, ttl)
    except ValueError:
        # Key doesn't exist — initialize it to 1
        cache.set(key, 1, timeout=ttl)
        new_count = 1

    return new_count


def get_remaining(user) -> int:
    """Return how many AI requests the user can still make today (never < 0)."""
    used  = get_used_today(user)
    limit = get_daily_limit(user)
    return max(0, limit - used)


def get_usage_summary(user) -> dict:
    """
    Return a complete usage summary dict for the given user.

    Response shape:
    {
        "daily_limit"      : 50,
        "used_today"       : 12,
        "remaining_today"  : 38,
        "reset_at"         : "2026-04-02T00:00:00+05:30",   # ISO, tz-aware
        "resets_in_seconds": 20000
    }
    """
    used      = get_used_today(user)
    limit     = get_daily_limit(user)
    remaining = max(0, limit - used)
    midnight  = get_next_midnight()
    seconds   = get_seconds_until_midnight()

    return {
        "daily_limit"      : limit,
        "used_today"       : used,
        "remaining_today"  : remaining,
        "reset_at"         : midnight.isoformat(),
        "resets_in_seconds": seconds,
    }
