"""
ai/services/cache_service.py
------------------------------
Redis response cache for StudyHub AI.

Caches identical AI responses keyed on:
  question + subject + topic + mode + config_id

If Redis is unavailable (IGNORE_EXCEPTIONS=True in settings),
caching is transparently bypassed — the system continues normally.

Usage:
    from ai.services.cache_service import make_cache_key, get_cached_response, set_cached_response

    key    = make_cache_key(message, subject, topic, mode, config_id)
    cached = get_cached_response(key)
    if cached:
        return Response({**cached, 'cache_hit': True})

    # ... call Gemini ...
    set_cached_response(key, response_data)
"""

import hashlib
import logging

from django.core.cache import cache

logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────
CACHE_PREFIX = 'ai_resp'
CACHE_TTL    = 60 * 60   # 1 hour — adjust in settings if needed


def make_cache_key(
    question: str,
    subject: str = '',
    topic: str   = '',
    mode: str    = 'student_mode',
    config_id: int = 0,
) -> str:
    """
    Build a deterministic cache key from the semantic inputs.

    The key is an SHA-256 prefix (20 hex chars) so it fits Redis key size limits.
    """
    # Normalise whitespace + case for better hit rate
    raw = '|'.join([
        question.lower().strip(),
        subject.lower().strip(),
        topic.lower().strip(),
        mode,
        str(config_id),
    ])
    digest = hashlib.sha256(raw.encode('utf-8')).hexdigest()[:24]
    return f"{CACHE_PREFIX}:{digest}"


def get_cached_response(key: str) -> dict | None:
    """
    Retrieve a cached AI response dict.

    Returns None if:
      - No cache entry exists for `key`
      - Redis is unavailable (exception silently swallowed)
    """
    try:
        return cache.get(key)
    except Exception as exc:
        logger.debug(f"[Cache] get_cached_response failed (Redis unavailable?): {exc}")
        return None


def set_cached_response(key: str, response: dict, ttl: int = CACHE_TTL) -> None:
    """
    Store an AI response dict in cache.

    Silently no-ops if Redis is unavailable.
    """
    try:
        cache.set(key, response, timeout=ttl)
    except Exception as exc:
        logger.debug(f"[Cache] set_cached_response failed (Redis unavailable?): {exc}")


def invalidate_cache(key: str) -> None:
    """Delete a specific cache entry (e.g. after knowledge base update)."""
    try:
        cache.delete(key)
    except Exception:
        pass
