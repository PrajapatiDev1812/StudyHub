"""
focus/serializers.py
"""
from rest_framework import serializers
from .models import FocusSession
from courses.serializers import SubjectSerializer, TopicSerializer


class FocusSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    content_title = serializers.CharField(source='content_item.title', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    break_minutes = serializers.SerializerMethodField()

    class Meta:
        model = FocusSession
        fields = [
            'id', 'subject', 'subject_name', 'topic', 'topic_name',
            'content_item', 'content_title',
            'session_goal', 'mode', 'status',
            'suggested_focus_minutes', 'selected_focus_minutes',
            'suggested_break_minutes', 'selected_break_minutes',
            'suggestion_source',
            'total_focus_seconds', 'total_break_seconds',
            'break_count', 'interruption_count',
            'start_time', 'end_time', 'break_started_at',
            'duration_minutes', 'break_minutes',
        ]
        read_only_fields = [
            'id', 'student', 'start_time', 'end_time',
            'total_focus_seconds', 'total_break_seconds',
            'break_count', 'interruption_count', 'break_started_at',
            'suggested_focus_minutes', 'suggested_break_minutes',
            'suggestion_source',
        ]

    def get_duration_minutes(self, obj):
        return round(obj.total_focus_seconds / 60, 1)

    def get_break_minutes(self, obj):
        return round(obj.total_break_seconds / 60, 1)


class StartSessionSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()
    session_goal = serializers.CharField(max_length=500)
    mode = serializers.ChoiceField(choices=['normal', 'strict'])
    selected_focus_minutes = serializers.IntegerField(min_value=5, max_value=180)
    selected_break_minutes = serializers.IntegerField(min_value=1, max_value=60)
    topic_id = serializers.IntegerField(required=False, allow_null=True)
    content_id = serializers.IntegerField(required=False, allow_null=True)


class UpdateTimerSerializer(serializers.Serializer):
    """Used by frontend to sync elapsed seconds to backend."""
    focus_seconds_elapsed = serializers.IntegerField(min_value=0, default=0)


class TimerSuggestionSerializer(serializers.Serializer):
    suggested_focus_minutes = serializers.IntegerField()
    suggested_break_minutes = serializers.IntegerField()
    source = serializers.CharField()
    focus_presets = serializers.ListField(child=serializers.IntegerField())
    break_presets = serializers.ListField(child=serializers.IntegerField())
    difficulty = serializers.CharField(allow_null=True)
