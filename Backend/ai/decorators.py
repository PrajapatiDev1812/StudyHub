"""
ai/decorators.py
------------------
Decorators for AI feature flag enforcement.

Usage on class-based views:

    class ChatbotView(APIView):
        @require_ai_feature('ai_chat')
        def post(self, request):
            ...

Usage on function-based views:

    @api_view(['POST'])
    @require_ai_feature('ai_chat')
    def chatbot(request):
        ...
"""

import functools
import logging

# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status

logger = logging.getLogger(__name__)


def require_ai_feature(feature_name: str):
    """
    Decorator that checks if an AI feature is enabled for the requesting user.

    Returns 403 with a descriptive message if the feature is disabled.

    Parameters
    ----------
    feature_name : The feature key (e.g. 'ai_chat', 'ai_summaries')
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapper(self_or_request, *args, **kwargs):
            # Handle both class-based and function-based views
            if hasattr(self_or_request, 'request'):
                # Class-based view: self_or_request is `self`
                request = self_or_request.request
                call_args = (self_or_request, request) + args
            else:
                # Function-based view: self_or_request is `request`
                request = self_or_request
                call_args = (request,) + args

            try:
                from ai.services.feature_flag_service import is_feature_enabled

                user = getattr(request, 'user', None)
                if user and user.is_authenticated:
                    if not is_feature_enabled(feature_name, user=user):
                        logger.info(
                            f"[FeatureFlag] {feature_name} disabled for user {user.pk}"
                        )
                        return Response(
                            {
                                'error': True,
                                'code': 'ai_feature_disabled',
                                'message': (
                                    f'This AI feature is currently disabled. '
                                    f'Please contact your administrator.'
                                ),
                                'feature': feature_name,
                            },
                            status=status.HTTP_403_FORBIDDEN,
                        )
            except ImportError:
                pass  # Feature flag service not yet available — allow request

            return view_func(self_or_request, *args, **kwargs)

        return wrapper
    return decorator
