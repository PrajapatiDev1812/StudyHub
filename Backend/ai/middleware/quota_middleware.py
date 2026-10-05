"""
ai/middleware/quota_middleware.py
----------------------------------
DRF-compatible mixin for AI quota enforcement.

Apply this mixin to any AI view to automatically:
    1. Check quota before the request is processed
    2. Set X-AI-* response headers
    3. Return structured 429 responses
    4. Release concurrent slots after response
    5. Consume quota after successful response

Usage:
    from ai.middleware.quota_middleware import AIQuotaMixin

    class ChatbotView(AIQuotaMixin, APIView):
        ai_feature = 'ai_chat'  # Optional: feature flag check

        def post(self, request):
            # Quota is already checked. Process AI request...
            ...
            # After getting AI response, call self.finalize_quota()
"""

import logging
import time

# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status

# pyrefly: ignore [missing-import]
logger = logging.getLogger(__name__)


class AIQuotaMixin:
    """
    View mixin that integrates quota checking into the DRF dispatch cycle.

    Attributes:
        ai_feature (str): Optional feature flag name (e.g. 'ai_chat').
                          If set, the feature flag is checked before quota.

    Stores quota check result on the request for use in the view:
        request.ai_quota_result — QuotaCheckResult instance
        request.ai_request_start — timestamp for response_time_ms calculation
    """

    ai_feature = None

    def initial(self, request, *args, **kwargs):
        """
        Override DRF's initial() to inject quota checks after authentication
        but before the view handler runs.
        """
        super().initial(request, *args, **kwargs)

        # Only check quota for authenticated users
        if not (request.user and request.user.is_authenticated):
            return

        # Only check on state-changing methods (POST, PUT, PATCH)
        # GET requests (like usage/analytics) don't consume quota
        if request.method not in ('POST', 'PUT', 'PATCH'):
            return

        # ── Feature flag check ────────────────────────────────────────────────
        if self.ai_feature:
            try:
                # pyrefly: ignore [missing-import]
                from ai.services.feature_flag_service import is_feature_enabled
                if not is_feature_enabled(self.ai_feature, user=request.user):
                    # pyrefly: ignore [missing-import]
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied(
                        detail=f"The AI feature '{self.ai_feature}' is currently disabled.",
                        code='ai_feature_disabled',
                    )
            except ImportError:
                pass  # Feature flag service not yet available

        # ── Quota check ───────────────────────────────────────────────────────
        try:
            from ai.services.quota_service import QuotaService

            result = QuotaService.check_quota(request.user)
            request.ai_quota_result = result
            request.ai_request_start = time.time()

            if not result.allowed:
                logger.info(
                    f"[AIQuota] User {request.user.pk} denied: {result.reason}"
                )
                # Log the throttled request
                try:
                    from ai.services.logging_service import log_ai_request
                    log_ai_request(
                        request,
                        request_type='chat',
                        status='throttled',
                        error_code=result.reason,
                    )
                except Exception:
                    pass

                response_data = {
                    'error': True,
                    'code': result.reason,
                    'message': self._get_denial_message(result),
                    'quota': {
                        'used': result.requests_used,
                        'limit': result.requests_limit,
                        'remaining': result.requests_remaining,
                        'resets_in_seconds': result.resets_in_seconds,
                        'reset_at': result.window_end,
                    },
                }

                # pyrefly: ignore [missing-import]
                from rest_framework.exceptions import Throttled
                exc = Throttled(
                    wait=result.resets_in_seconds,
                    detail=response_data,
                )
                exc.status_code = 429
                raise exc

        except ImportError:
            pass  # QuotaService not yet available — fail-open

    def finalize_response(self, request, response, *args, **kwargs):
        """Add X-AI-* headers to the response."""
        response = super().finalize_response(request, response, *args, **kwargs)

        result = getattr(request, 'ai_quota_result', None)
        if result and result.allowed:
            response['X-AI-Requests-Used'] = str(result.requests_used)
            if result.requests_limit is not None:
                response['X-AI-Requests-Limit'] = str(result.requests_limit)
                response['X-AI-Requests-Remaining'] = str(result.requests_remaining)
            if result.resets_in_seconds:
                response['X-AI-Reset-In'] = str(result.resets_in_seconds)
            if result.warning:
                response['X-AI-Warning'] = result.warning_message

        return response

    def finalize_quota(self, request, tokens_used: int = 0):
        """
        Call this after a successful AI response to:
        1. Consume quota (increment counters)
        2. Release concurrent slot
        """
        try:
            from ai.services.quota_service import QuotaService

            QuotaService.consume_quota(request.user, tokens_used=tokens_used)

            result = getattr(request, 'ai_quota_result', None)
            if result:
                QuotaService.release_concurrent_slot(
                    request.user, result.concurrent_request_id
                )
        except Exception as exc:
            logger.warning(f"[AIQuota] Failed to finalize quota: {exc}")

    @staticmethod
    def _get_denial_message(result) -> str:
        """Return a user-friendly denial message."""
        messages = {
            'daily_limit_exceeded': (
                "You've reached your AI request limit. "
                "Your quota will refresh soon."
            ),
            'token_limit_exceeded': (
                "You've reached your AI usage limit for today. "
                "Please try again later."
            ),
            'burst_limit_exceeded': (
                "You're sending messages too quickly. "
                "Please wait a moment before trying again."
            ),
            'concurrent_limit_exceeded': (
                "You already have an AI request in progress. "
                "Please wait for it to complete."
            ),
        }
        return messages.get(result.reason, "AI request limit reached. Please try again later.")
