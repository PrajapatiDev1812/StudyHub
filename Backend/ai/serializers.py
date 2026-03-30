from rest_framework import serializers
from .models import (
    AdminContentChunk, StudentContentChunk, StudentNote,
    ChatSession, ChatMessage, ChatAttachment,
)


class AdminContentChunkSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default='')
    topic_name = serializers.CharField(source='topic.name', read_only=True, default='')

    class Meta:
        model = AdminContentChunk
        fields = [
            'id', 'course', 'course_name', 'subject', 'subject_name',
            'topic', 'topic_name', 'source_content', 'chunk_text',
            'chunk_index', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class StudentNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentNote
        fields = [
            'id', 'user', 'title', 'content',
            'subject', 'topic', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class StudentContentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentContentChunk
        fields = [
            'id', 'user', 'source_note', 'title',
            'chunk_text', 'chunk_index', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=5000)
    mode = serializers.ChoiceField(
        choices=['student_mode', 'teacher_mode', 'exam_mode'],
        default='student_mode',
    )
    level = serializers.ChoiceField(
        choices=['beginner', 'medium', 'advance'],
        default='beginner',
    )
    subject = serializers.CharField(max_length=200, required=False, default='')
    topic = serializers.CharField(max_length=200, required=False, default='')
    debug = serializers.BooleanField(default=False)
    session_id = serializers.UUIDField(required=False, allow_null=True)


class DebugRetrievalRequestSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=5000)


# ─────────────────────────────────────────────
# Chat History Serializers
# ─────────────────────────────────────────────

class ChatAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatAttachment
        fields = ['id', 'file', 'file_name', 'file_type', 'file_size', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    attachments = ChatAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'session', 'role', 'content', 'feedback', 'attachments', 'created_at']
        read_only_fields = ['id', 'session', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = [
            'id', 'title', 'is_pinned', 'mode', 'level',
            'message_count', 'last_message_preview',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message_preview(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return last_msg.content[:100]
        return ''


class ChatSessionUpdateSerializer(serializers.ModelSerializer):
    """Used for PATCH operations (rename, pin/unpin)."""
    class Meta:
        model = ChatSession
        fields = ['title', 'is_pinned', 'mode', 'level']


class MessageFeedbackSerializer(serializers.Serializer):
    feedback = serializers.ChoiceField(choices=['good', 'bad', ''])

