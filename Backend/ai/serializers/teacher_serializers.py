"""
ai/serializers/teacher_serializers.py
---------------------------------------
Serializers for the Teacher AI Panel endpoints.

Covers:
  - AIConfiguration (GET/PUT)
  - KnowledgeDocument (GET/POST/DELETE)
  - QuestionGeneratorSerializer (POST validation)
"""

# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from ai.models import AIConfiguration, KnowledgeDocument


# ── AI Configuration ───────────────────────────────────────────────────────────

class AIConfigurationSerializer(serializers.ModelSerializer):
    # Read-only display fields for M2M subjects/topics
    allowed_subjects_display = serializers.SerializerMethodField()
    blocked_topics_display   = serializers.SerializerMethodField()

    class Meta:
        model = AIConfiguration
        fields = [
            'id',
            'assistant_name',
            'provider', 'model_name',
            'teaching_style', 'difficulty_level', 'temperature',
            'custom_system_prompt',
            # M2M - writable as list of PKs
            'allowed_subjects', 'blocked_topics',
            # Read-only display
            'allowed_subjects_display', 'blocked_topics_display',
            # Feature flags
            'enable_chat', 'enable_question_generation', 'enable_summarization',
            'enable_exam_mode', 'enable_rag', 'enable_external_knowledge',
            # Multi-tenant
            'institution',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_allowed_subjects_display(self, obj):
        return [{'id': s.id, 'name': s.name} for s in obj.allowed_subjects.all()]

    def get_blocked_topics_display(self, obj):
        return [{'id': t.id, 'name': t.name} for t in obj.blocked_topics.all()]

    def validate_temperature(self, value):
        if not (0.0 <= value <= 1.0):
            raise serializers.ValidationError("Temperature must be between 0.0 and 1.0.")
        return round(value, 2)


# ── Knowledge Document ─────────────────────────────────────────────────────────

class KnowledgeDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    course_name      = serializers.CharField(source='course.name', read_only=True, default='')
    subject_name     = serializers.CharField(source='subject.name', read_only=True, default='')

    class Meta:
        model = KnowledgeDocument
        fields = [
            'id', 'title', 'file', 'file_type', 'file_size',
            'course', 'course_name', 'subject', 'subject_name',
            'embedding_status', 'error_message',
            'total_chunks', 'embedded_chunks',
            'uploaded_by', 'uploaded_by_name',
            'institution',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'uploaded_by', 'uploaded_by_name',
            'embedding_status', 'error_message',
            'total_chunks', 'embedded_chunks',
            'created_at', 'updated_at',
        ]

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024  # 10 MB
        if value.size > max_size:
            raise serializers.ValidationError("File too large. Maximum size is 10 MB.")

        name = value.name.lower()
        if name.endswith('.pdf'):
            pass
        elif name.endswith('.docx'):
            pass
        elif name.endswith('.txt'):
            pass
        else:
            raise serializers.ValidationError(
                "Unsupported file type. Allowed: PDF, DOCX, TXT."
            )
        return value

    def validate(self, data):
        # Auto-detect file_type from filename
        file = data.get('file')
        if file:
            name = file.name.lower()
            if name.endswith('.pdf'):
                data['file_type'] = 'pdf'
            elif name.endswith('.docx'):
                data['file_type'] = 'docx'
            elif name.endswith('.txt'):
                data['file_type'] = 'txt'
            data['file_size'] = file.size
        return data


class KnowledgeDocumentStatusSerializer(serializers.ModelSerializer):
    """Lightweight serializer for the polling endpoint."""
    class Meta:
        model = KnowledgeDocument
        fields = ['id', 'embedding_status', 'total_chunks', 'embedded_chunks', 'error_message']
        read_only_fields = fields


# ── Question Generator ─────────────────────────────────────────────────────────

BLOOMS_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']

class QuestionGeneratorSerializer(serializers.Serializer):
    # Required fields
    subject       = serializers.CharField(max_length=200)
    topic         = serializers.CharField(max_length=200)
    difficulty    = serializers.ChoiceField(choices=['easy', 'medium', 'hard'])
    question_type = serializers.ChoiceField(
        choices=['mcq', 'short_answer', 'long_answer', 'case_study']
    )
    count = serializers.IntegerField(min_value=1, max_value=20, default=5)

    # Enhancement 9: Advanced options (all optional)
    blooms_level         = serializers.ChoiceField(choices=BLOOMS_LEVELS, required=False, default=None, allow_null=True)
    marks_per_question   = serializers.IntegerField(min_value=1, max_value=20, required=False, default=None, allow_null=True)
    include_answer_key   = serializers.BooleanField(default=True)
    include_explanation  = serializers.BooleanField(default=False)
    shuffle_mcq_options  = serializers.BooleanField(default=False)
