"""
config/exceptions.py
--------------------
Custom DRF exception handler.
Returns a clean JSON 429 response when a throttle limit is hit,
instead of DRF's default plain-text Throttled error.
"""

from rest_framework.views import exception_handler
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework import status
import math


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler.
    Intercepts Throttled exceptions and returns a structured JSON body
    with a human-readable message and retry_after in seconds.
    """
    # Let DRF handle everything first
    response = exception_handler(exc, context)

    if isinstance(exc, Throttled):
        wait = exc.wait  # seconds until limit resets (float or None)
        retry_after = math.ceil(wait) if wait is not None else None

        # Build a friendly message based on how long they have to wait
        if retry_after is None:
            message = "You have reached your AI usage limit. Please try again later."
        elif retry_after < 120:
            message = f"Too many requests. Please wait {retry_after} seconds before trying again."
        elif retry_after < 3600:
            minutes = math.ceil(retry_after / 60)
            message = f"You have reached your AI usage limit. Please try again in {minutes} minute(s)."
        else:
            hours = math.ceil(retry_after / 3600)
            message = f"You have reached your daily AI usage limit. Please try again in {hours} hour(s)."

        response = Response(
            {
                "error": "Rate limit exceeded",
                "message": message,
                "retry_after": retry_after,  # seconds (int or null)
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

        # Add Retry-After header so clients can auto-retry
        if retry_after is not None:
            response["Retry-After"] = str(retry_after)

    return response
