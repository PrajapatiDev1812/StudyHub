"""
ai/views/ai_usage_view.py
--------------------------
API view: GET /api/ai/usage/

Returns the current authenticated user's AI usage status for today.
No request body needed — reads from cache (Redis).
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ai.services.ai_usage import get_usage_summary
from ai.serializers.ai_usage_serializer import AIUsageSerializer


class AIUsageView(APIView):
    """
    GET /api/ai/usage/

    Returns the authenticated user's AI usage stats for today.

    Response example:
    {
        "daily_limit"      : 50,
        "used_today"       : 12,
        "remaining_today"  : 38,
        "reset_at"         : "2026-04-02T00:00:00+05:30",
        "resets_in_seconds": 20000
    }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary    = get_usage_summary(request.user)
        serializer = AIUsageSerializer(data=summary)
        serializer.is_valid()           # Always valid — no user input
        return Response(serializer.data)
