"""
ai/serializers/workspace_serializers.py
----------------------------------------
Serializers for the Teacher AI Workspace.
"""
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from ai.models import (
    ChatSession, ChatMessage,
    AIGeneratedContent, PromptTemplate, ConversationTag,
)


class ConversationTagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ConversationTag
        fields = ['id', 'name', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']


class TeacherChatSessionSerializer(serializers.ModelSerializer):
    """Full session serializer for teacher workspace sidebar + info drawer."""
    subject_name  = serializers.CharField(source='subject.name', read_only=True, default='')
    topic_name    = serializers.CharField(source='topic.name',   read_only=True, default='')
    message_count = serializers.SerializerMethodField()
    last_preview  = serializers.SerializerMethodField()
    tags          = ConversationTagSerializer(many=True, read_only=True)
    tag_ids       = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ConversationTag.objects.all(),
        source='tags', write_only=True, required=False
    )

    class Meta:
        model  = ChatSession
        fields = [
            'id', 'title', 'mode', 'level',
            'subject', 'subject_name',
            'topic',   'topic_name',
            'is_pinned', 'is_archived', 'is_shared', 'sharing_level', 'share_token',
            'tags', 'tag_ids',
            'last_message_at', 'message_count', 'last_preview',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'share_token']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_preview(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return last.content[:120]
        return ''


class TeacherChatSessionUpdateSerializer(serializers.ModelSerializer):
    """PATCH — rename, pin, archive, set subject/topic, tags."""
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ConversationTag.objects.all(),
        source='tags', required=False
    )

    class Meta:
        model  = ChatSession
        fields = [
            'title', 'mode', 'level',
            'subject', 'topic',
            'is_pinned', 'is_archived', 'tag_ids',
        ]

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        instance = super().update(instance, validated_data)
        if tags is not None:
            instance.tags.set(tags)
        return instance


class AIGeneratedContentSerializer(serializers.ModelSerializer):
    subject_name     = serializers.CharField(source='subject.name', read_only=True, default='')
    topic_name       = serializers.CharField(source='topic.name',   read_only=True, default='')
    course_name      = serializers.CharField(source='course.title', read_only=True, default='')
    session_title    = serializers.CharField(source='source_session.title', read_only=True, default='')

    class Meta:
        model  = AIGeneratedContent
        fields = [
            'id', 'content_type', 'title', 'content', 'status',
            'source_session', 'session_title',
            'course', 'course_name',
            'subject', 'subject_name',
            'topic', 'topic_name',
            'metadata', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PromptTemplate
        fields = ['id', 'title', 'prompt', 'category', 'is_global', 'use_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'use_count', 'created_at', 'updated_at']
