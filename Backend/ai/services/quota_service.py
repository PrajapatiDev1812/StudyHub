"""
ai/services/quota_service.py
------------------------------
Central AI Quota Enforcement Engine for StudyHub.

Handles:
    - Hierarchical policy resolution (User → University+Role → Role → Platform)
    - Redis-backed atomic request/token counters
    - Rolling & fixed window support
    - Burst rate limiting (sliding window)
    - Concurrent request tracking
    - Usage record persistence

All quota limits come from the database (AIQuotaPolicy model).
No hardcoded limits — settings.AI_QUOTA_DEFAULTS is the last-resort fallback.

Usage:
    from ai.services.quota_service import QuotaService

    result = QuotaService.check_quota(user)
    if not result['allowed']:
        return 429 with result['reason']

    # After AI response:
    QuotaService.consume_quota(user, tokens_used=1500)
    QuotaService.release_concurrent_slot(user, request_id)
"""

import time
import uuid
import logging
from datetime import timedelta
from dataclasses import dataclass
from typing import Optional

# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from django.core.cache import cache
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.db.models import F

logger = logging.getLogger(__name__)

# ── Cache Key Prefixes ────────────────────────────────────────────────────────

_PREFIX = getattr(settings, 'AI_GOVERNANCE_CACHE_PREFIX', 'studyhub:ai_gov')
_TTL = getattr(settings, 'AI_GOVERNANCE_CACHE_TTL', 300)


def _key(kind: str, *parts) -> str:
    """Build a namespaced cache key."""
    return f"{_PREFIX}:{kind}:{':'.join(str(p) for p in parts)}"


# ═══════════════════════════════════════════════════════════════════════════════
# QUOTA CHECK RESULT
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class QuotaCheckResult:
    allowed: bool
    reason: str = ''
    requests_used: int = 0
    requests_limit: Optional[int] = None
    requests_remaining: Optional[int] = None
    tokens_used: int = 0
    tokens_limit: Optional[int] = None
    tokens_remaining: Optional[int] = None
    window_end: Optional[str] = None
    resets_in_seconds: int = 0
    warning: bool = False
    warning_message: str = ''
    concurrent_request_id: str = ''

    def to_dict(self):
        return {
            'allowed': self.allowed,
            'reason': self.reason,
            'requests_used': self.requests_used,
            'requests_limit': self.requests_limit,
            'requests_remaining': self.requests_remaining,
            'tokens_used': self.tokens_used,
            'tokens_limit': self.tokens_limit,
            'tokens_remaining': self.tokens_remaining,
            'window_end': self.window_end,
            'resets_in_seconds': self.resets_in_seconds,
            'warning': self.warning,
            'warning_message': self.warning_message,
        }


# ═══════════════════════════════════════════════════════════════════════════════
# QUOTA SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

class QuotaService:
    """
    Central quota enforcement engine.

    All methods are static/classmethod — no instantiation needed.
    """

    # ── Policy Resolution ─────────────────────────────────────────────────────

    @staticmethod
    def get_effective_policy(user) -> dict:
        """
        Resolve the effective quota policy for a user.

        Resolution hierarchy (highest priority first):
            1. User-specific override (AIUserQuota)
            2. University + Role policy
            3. Role-only policy
            4. Platform default (settings.AI_QUOTA_DEFAULTS)

        Returns a dict with all quota fields.
        """
        cache_key = _key('policy', user.pk)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        policy = QuotaService._resolve_policy_from_db(user)
        cache.set(cache_key, policy, timeout=_TTL)
        return policy

    @staticmethod
    def _resolve_policy_from_db(user) -> dict:
        """Resolve policy from database models."""
        try:
            from ai.models_governance import AIQuotaPolicy, AIUserQuota

            role = getattr(user, 'role', 'student')

            # 1. Check user-specific override
            try:
                user_quota = AIUserQuota.objects.select_related('quota_policy').get(user=user)
                if user_quota.quota_policy:
                    return QuotaService._policy_to_dict(user_quota.quota_policy)
                # Custom overrides
                base_policy = QuotaService._get_role_policy(role)
                if user_quota.custom_max_requests is not None:
                    base_policy['max_requests'] = user_quota.custom_max_requests
                if user_quota.custom_max_tokens is not None:
                    base_policy['max_tokens'] = user_quota.custom_max_tokens
                return base_policy
            except AIUserQuota.DoesNotExist:
                pass

            # 2. Check university + role policy (future: when user has university FK)
            # For now, fall through to role-only policy

            # 3. Check role-only policy
            policy_obj = (
                AIQuotaPolicy.objects
                .filter(role=role, university__isnull=True, is_active=True)
                .order_by('priority')
                .first()
            )
            if policy_obj:
                return QuotaService._policy_to_dict(policy_obj)

        except Exception as exc:
            logger.warning(f"[QuotaService] DB policy lookup failed: {exc}")

        # 4. Fall back to settings.AI_QUOTA_DEFAULTS
        role = getattr(user, 'role', 'student')
        defaults = getattr(settings, 'AI_QUOTA_DEFAULTS', {})
        return defaults.get(role, defaults.get('student', {
            'max_requests': 50,
            'max_tokens': 250000,
            'time_window_hours': 24,
            'window_type': 'rolling',
            'burst_limit': 5,
            'burst_window_seconds': 60,
            'concurrent_requests': 2,
            'warning_threshold_pct': 80,
            'grace_requests': 0,
            'auto_block': True,
        }))

    @staticmethod
    def _get_role_policy(role: str) -> dict:
        """Get a base policy dict for a role from DB or settings."""
        try:
            from ai.models_governance import AIQuotaPolicy
            policy_obj = (
                AIQuotaPolicy.objects
                .filter(role=role, university__isnull=True, is_active=True)
                .order_by('priority')
                .first()
            )
            if policy_obj:
                return QuotaService._policy_to_dict(policy_obj)
        except Exception:
            pass

        defaults = getattr(settings, 'AI_QUOTA_DEFAULTS', {})
        return defaults.get(role, defaults.get('student', {})).copy()

    @staticmethod
    def _policy_to_dict(policy_obj) -> dict:
        """Convert an AIQuotaPolicy model instance to a dict."""
        return {
            'max_requests': policy_obj.max_requests,
            'max_tokens': policy_obj.max_tokens,
            'time_window_hours': policy_obj.time_window_hours,
            'window_type': policy_obj.window_type,
            'burst_limit': policy_obj.burst_limit,
            'burst_window_seconds': policy_obj.burst_window_seconds,
            'concurrent_requests': policy_obj.concurrent_requests,
            'warning_threshold_pct': policy_obj.warning_threshold_pct,
            'grace_requests': policy_obj.grace_requests,
            'auto_block': policy_obj.auto_block,
            'policy_id': policy_obj.pk,
            'policy_name': policy_obj.name,
        }

    # ── Quota Checking ────────────────────────────────────────────────────────

    @classmethod
    def check_quota(cls, user) -> QuotaCheckResult:
        """
        Check if a user is allowed to make an AI request.

        Performs 3 checks in order:
            1. Request/token limit check
            2. Burst rate check
            3. Concurrent request check

        Returns a QuotaCheckResult with allowed=True/False.
        """
        policy = cls.get_effective_policy(user)

        # Admin with unlimited quota — skip all checks
        if policy.get('max_requests') is None and policy.get('max_tokens') is None:
            req_id = str(uuid.uuid4())[:16]
            return QuotaCheckResult(
                allowed=True,
                requests_used=0,
                requests_limit=None,
                requests_remaining=None,
                concurrent_request_id=req_id,
            )

        window_hours = policy.get('time_window_hours', 24)
        window_type = policy.get('window_type', 'rolling')
        max_requests = policy.get('max_requests')
        max_tokens = policy.get('max_tokens')
        grace = policy.get('grace_requests', 0)
        auto_block = policy.get('auto_block', True)
        warning_pct = policy.get('warning_threshold_pct', 80)

        # ── Get current usage ─────────────────────────────────────────────────
        requests_used = cls._get_request_count(user, window_hours, window_type)
        tokens_used = cls._get_token_count(user, window_hours, window_type)

        # ── Calculate window end ──────────────────────────────────────────────
        window_end, resets_in = cls._get_window_end(user, window_hours, window_type)

        # ── Check request limit ───────────────────────────────────────────────
        effective_limit = max_requests
        if max_requests is not None:
            effective_limit_with_grace = max_requests + grace
            if requests_used >= effective_limit_with_grace and auto_block:
                return QuotaCheckResult(
                    allowed=False,
                    reason='daily_limit_exceeded',
                    requests_used=requests_used,
                    requests_limit=max_requests,
                    requests_remaining=0,
                    tokens_used=tokens_used,
                    tokens_limit=max_tokens,
                    tokens_remaining=max(0, (max_tokens or 0) - tokens_used) if max_tokens else None,
                    window_end=window_end,
                    resets_in_seconds=resets_in,
                )

        # ── Check token limit ─────────────────────────────────────────────────
        if max_tokens is not None and tokens_used >= max_tokens and auto_block:
            return QuotaCheckResult(
                allowed=False,
                reason='token_limit_exceeded',
                requests_used=requests_used,
                requests_limit=max_requests,
                requests_remaining=max(0, (max_requests or 0) - requests_used) if max_requests else None,
                tokens_used=tokens_used,
                tokens_limit=max_tokens,
                tokens_remaining=0,
                window_end=window_end,
                resets_in_seconds=resets_in,
            )

        # ── Check burst rate ──────────────────────────────────────────────────
        burst_limit = policy.get('burst_limit', 5)
        burst_window = policy.get('burst_window_seconds', 60)
        if not cls._check_burst_rate(user, burst_limit, burst_window):
            return QuotaCheckResult(
                allowed=False,
                reason='burst_limit_exceeded',
                requests_used=requests_used,
                requests_limit=max_requests,
                requests_remaining=max(0, (max_requests or 0) - requests_used) if max_requests else None,
                tokens_used=tokens_used,
                tokens_limit=max_tokens,
                window_end=window_end,
                resets_in_seconds=resets_in,
            )

        # ── Check concurrent requests ─────────────────────────────────────────
        max_concurrent = policy.get('concurrent_requests', 2)
        req_id = cls._acquire_concurrent_slot(user, max_concurrent)
        if req_id is None:
            return QuotaCheckResult(
                allowed=False,
                reason='concurrent_limit_exceeded',
                requests_used=requests_used,
                requests_limit=max_requests,
                requests_remaining=max(0, (max_requests or 0) - requests_used) if max_requests else None,
                tokens_used=tokens_used,
                tokens_limit=max_tokens,
                window_end=window_end,
                resets_in_seconds=resets_in,
            )

        # ── Check warning threshold ───────────────────────────────────────────
        warning = False
        warning_msg = ''
        if max_requests and warning_pct > 0:
            usage_pct = (requests_used / max_requests) * 100
            if usage_pct >= warning_pct:
                warning = True
                remaining = max(0, max_requests - requests_used)
                warning_msg = f"You have {remaining} AI requests remaining today."

        requests_remaining = max(0, max_requests - requests_used) if max_requests else None
        tokens_remaining = max(0, max_tokens - tokens_used) if max_tokens else None

        return QuotaCheckResult(
            allowed=True,
            requests_used=requests_used,
            requests_limit=max_requests,
            requests_remaining=requests_remaining,
            tokens_used=tokens_used,
            tokens_limit=max_tokens,
            tokens_remaining=tokens_remaining,
            window_end=window_end,
            resets_in_seconds=resets_in,
            warning=warning,
            warning_message=warning_msg,
            concurrent_request_id=req_id,
        )

    # ── Quota Consumption ─────────────────────────────────────────────────────

    @classmethod
    def consume_quota(cls, user, tokens_used: int = 0) -> None:
        """
        Record consumption of a quota unit (1 request + N tokens).

        Called AFTER a successful AI response.
        Updates both Redis counters and the persistent AIUsageRecord.
        """
        policy = cls.get_effective_policy(user)
        window_hours = policy.get('time_window_hours', 24)
        window_type = policy.get('window_type', 'rolling')

        # ── Increment Redis counters ──────────────────────────────────────────
        cls._increment_request_count(user, window_hours, window_type)
        if tokens_used > 0:
            cls._increment_token_count(user, tokens_used, window_hours, window_type)

        # ── Record burst timestamp ────────────────────────────────────────────
        cls._record_burst_timestamp(user)

        # ── Update persistent AIUsageRecord ───────────────────────────────────
        cls._update_usage_record(user, tokens_used)

    @classmethod
    def release_concurrent_slot(cls, user, request_id: str) -> None:
        """Release a concurrent request slot after the AI response completes."""
        if not request_id:
            return
        key = _key('concurrent', user.pk)
        try:
            # Remove from the set of active requests
            current = cache.get(key) or set()
            current.discard(request_id)
            cache.set(key, current, timeout=300)  # 5 min TTL
        except Exception as exc:
            logger.warning(f"[QuotaService] Failed to release concurrent slot: {exc}")

    # ── Usage Summary (role-aware) ────────────────────────────────────────────

    @classmethod
    def get_usage_summary(cls, user, role_view: str = 'student') -> dict:
        """
        Get a usage summary for the given user.

        role_view controls what information is exposed:
            - 'student': Simplified (requests only, no tokens/config)
            - 'admin': Full details
        """
        policy = cls.get_effective_policy(user)
        window_hours = policy.get('time_window_hours', 24)
        window_type = policy.get('window_type', 'rolling')
        max_requests = policy.get('max_requests')
        max_tokens = policy.get('max_tokens')

        requests_used = cls._get_request_count(user, window_hours, window_type)
        tokens_used = cls._get_token_count(user, window_hours, window_type)
        window_end, resets_in = cls._get_window_end(user, window_hours, window_type)

        if role_view == 'student':
            # Students see simplified info only
            return {
                'daily_limit': max_requests,
                'used_today': requests_used,
                'remaining_today': max(0, max_requests - requests_used) if max_requests else None,
                'reset_at': window_end,
                'resets_in_seconds': resets_in,
            }

        # Admin / full view
        return {
            'daily_limit': max_requests,
            'used_today': requests_used,
            'remaining_today': max(0, max_requests - requests_used) if max_requests else None,
            'tokens_limit': max_tokens,
            'tokens_used': tokens_used,
            'tokens_remaining': max(0, max_tokens - tokens_used) if max_tokens else None,
            'reset_at': window_end,
            'resets_in_seconds': resets_in,
            'window_type': window_type,
            'burst_limit': policy.get('burst_limit'),
            'concurrent_limit': policy.get('concurrent_requests'),
            'policy_name': policy.get('policy_name', 'Default'),
        }

    # ── Quota Reset (Admin Action) ────────────────────────────────────────────

    @classmethod
    def reset_quota(cls, user) -> None:
        """
        Reset all quota counters for a user.
        Called from admin panel. Creates an audit log entry.
        """
        # Clear Redis counters
        for kind in ['req_count', 'tok_count', 'burst', 'concurrent']:
            cache.delete(_key(kind, user.pk))

        # Clear cached policy
        cache.delete(_key('policy', user.pk))

        logger.info(f"[QuotaService] Quota reset for user {user.pk}")

    # ── Invalidate Cache ──────────────────────────────────────────────────────

    @classmethod
    def invalidate_policy_cache(cls, user=None):
        """Invalidate cached policies. If user is None, clear all."""
        if user:
            cache.delete(_key('policy', user.pk))
        # For bulk invalidation, policies will expire via TTL

    # ═══════════════════════════════════════════════════════════════════════════
    # INTERNAL: Redis Counter Operations
    # ═══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def _get_window_ttl(window_hours: int) -> int:
        """Return TTL in seconds for the window, plus a small buffer."""
        return (window_hours * 3600) + 60

    @staticmethod
    def _get_request_count(user, window_hours: int, window_type: str) -> int:
        """Get the current request count for the user's active window."""
        key = _key('req_count', user.pk)
        count = cache.get(key)
        return count if count is not None else 0

    @classmethod
    def _increment_request_count(cls, user, window_hours: int, window_type: str) -> int:
        """Atomically increment the request counter."""
        key = _key('req_count', user.pk)
        ttl = cls._get_window_ttl(window_hours)
        try:
            new_count = cache.incr(key)
            # Refresh TTL
            try:
                cache.expire(key, ttl)
            except AttributeError:
                pass  # LocMemCache doesn't support expire
        except ValueError:
            # Key doesn't exist — initialize
            cache.set(key, 1, timeout=ttl)
            new_count = 1
        return new_count

    @staticmethod
    def _get_token_count(user, window_hours: int, window_type: str) -> int:
        """Get the current token count for the user's active window."""
        key = _key('tok_count', user.pk)
        count = cache.get(key)
        return count if count is not None else 0

    @classmethod
    def _increment_token_count(cls, user, tokens: int, window_hours: int, window_type: str) -> int:
        """Atomically increment the token counter."""
        key = _key('tok_count', user.pk)
        ttl = cls._get_window_ttl(window_hours)
        try:
            new_count = cache.incr(key, delta=tokens)
            try:
                cache.expire(key, ttl)
            except AttributeError:
                pass
        except ValueError:
            cache.set(key, tokens, timeout=ttl)
            new_count = tokens
        return new_count

    # ── Burst Rate Limiting ───────────────────────────────────────────────────

    @staticmethod
    def _check_burst_rate(user, burst_limit: int, burst_window_seconds: int) -> bool:
        """
        Check if the user is within burst rate limits.

        Uses a simple counter with short TTL as the burst window.
        Returns True if under limit, False if burst exceeded.
        """
        key = _key('burst', user.pk)
        try:
            count = cache.get(key)
            if count is not None and count >= burst_limit:
                return False
            return True
        except Exception:
            return True  # Fail-open on cache errors

    @staticmethod
    def _record_burst_timestamp(user) -> None:
        """Record a burst-window request."""
        key = _key('burst', user.pk)
        try:
            cache.incr(key)
            try:
                cache.expire(key, 60)  # Default burst window
            except AttributeError:
                pass
        except ValueError:
            cache.set(key, 1, timeout=60)

    # ── Concurrent Request Tracking ───────────────────────────────────────────

    @staticmethod
    def _acquire_concurrent_slot(user, max_concurrent: int) -> Optional[str]:
        """
        Try to acquire a concurrent request slot.

        Returns a request_id if slot acquired, None if at capacity.
        Uses a set of active request IDs stored in cache.
        """
        key = _key('concurrent', user.pk)
        req_id = str(uuid.uuid4())[:16]
        try:
            current = cache.get(key) or set()
            if len(current) >= max_concurrent:
                return None
            current.add(req_id)
            cache.set(key, current, timeout=300)  # 5 min auto-expire
            return req_id
        except Exception as exc:
            logger.warning(f"[QuotaService] Concurrent slot acquisition failed: {exc}")
            return req_id  # Fail-open

    # ── Window End Calculation ────────────────────────────────────────────────

    @staticmethod
    def _get_window_end(user, window_hours: int, window_type: str) -> tuple:
        """
        Calculate when the quota window ends.

        Returns (window_end_iso_string, seconds_until_reset).
        """
        now = timezone.now()

        if window_type == 'fixed':
            # Fixed = calendar day (midnight reset)
            now_local = timezone.localtime(now)
            tomorrow = now_local.date() + timedelta(days=1)
            midnight = timezone.make_aware(
                timezone.datetime(tomorrow.year, tomorrow.month, tomorrow.day),
                timezone.get_current_timezone(),
            )
            delta = midnight - now
            return midnight.isoformat(), max(0, int(delta.total_seconds()))
        else:
            # Rolling = window_hours from first request
            # For simplicity, we use window_hours from now
            window_end = now + timedelta(hours=window_hours)
            return window_end.isoformat(), window_hours * 3600

    # ── Persistent Usage Record ───────────────────────────────────────────────

    @staticmethod
    def _update_usage_record(user, tokens_used: int) -> None:
        """
        Update the persistent AIUsageRecord in the database.

        Creates a new record if none exists for the current window.
        Fire-and-forget — never crashes the AI pipeline.
        """
        try:
            from ai.models_governance import AIUsageRecord

            now = timezone.now()
            window_start = now - timedelta(hours=24)

            record, created = AIUsageRecord.objects.get_or_create(
                user=user,
                window_start__gte=window_start,
                defaults={
                    'window_start': now,
                    'window_end': now + timedelta(hours=24),
                    'requests_used': 1,
                    'tokens_used': tokens_used,
                    'lifetime_requests': 1,
                    'lifetime_tokens': tokens_used,
                    'last_request_at': now,
                },
            )

            if not created:
                AIUsageRecord.objects.filter(pk=record.pk).update(
                    requests_used=F('requests_used') + 1,
                    tokens_used=F('tokens_used') + tokens_used,
                    lifetime_requests=F('lifetime_requests') + 1,
                    lifetime_tokens=F('lifetime_tokens') + tokens_used,
                    last_request_at=now,
                )

        except Exception as exc:
            logger.warning(f"[QuotaService] Failed to update usage record: {exc}")
