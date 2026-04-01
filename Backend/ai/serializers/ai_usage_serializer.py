"""
ai/serializers/ai_usage_serializer.py
--------------------------------------
Serializer for the AI usage summary response.

Input: dict from services.ai_usage.get_usage_summary()
Output: validated JSON-ready representation
"""

from rest_framework import serializers


class AIUsageSerializer(serializers.Serializer):
    """
    Serializes the AI usage data for a user.

    Fields:
        daily_limit       — Total allowed AI requests per day
        used_today        — Number of requests made today
        remaining_today   — Requests remaining (never negative)
        reset_at          — ISO 8601 datetime when the counter resets (tz-aware)
        resets_in_seconds — Integer seconds until counter resets
    """

    daily_limit       = serializers.IntegerField(read_only=True, min_value=0)
    used_today        = serializers.IntegerField(read_only=True, min_value=0)
    remaining_today   = serializers.IntegerField(read_only=True, min_value=0)
    reset_at          = serializers.CharField(read_only=True)   # ISO string from get_usage_summary
    resets_in_seconds = serializers.IntegerField(read_only=True, min_value=0)
