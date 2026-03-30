from rest_framework import serializers
from .models import AdminContentChunk, StudentContentChunk, StudentNote


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


class DebugRetrievalRequestSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=5000)
