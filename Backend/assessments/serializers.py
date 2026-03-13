from rest_framework import serializers
from .models import Test, Question, Option, StudentAttempt, StudentAnswer


# ---------- Option ----------
class OptionSerializer(serializers.ModelSerializer):
    """Full serializer (admin can see is_correct)."""

    class Meta:
        model = Option
        fields = ['id', 'question', 'text', 'is_correct']
        read_only_fields = ['id']


class OptionStudentSerializer(serializers.ModelSerializer):
    """Student view — hides which option is correct."""

    class Meta:
        model = Option
        fields = ['id', 'text']
        read_only_fields = ['id']


# ---------- Question ----------
class QuestionSerializer(serializers.ModelSerializer):
    """Full serializer with options (admin view — shows correct answers)."""
    options = OptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'test', 'text', 'question_type', 'marks', 'order', 'options']
        read_only_fields = ['id']


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Student view — hides correct answers."""
    options = OptionStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'marks', 'order', 'options']
        read_only_fields = fields


# ---------- Test ----------
class TestSerializer(serializers.ModelSerializer):
    """Full test detail with questions (admin view)."""
    questions = QuestionSerializer(many=True, read_only=True)
    total_questions = serializers.IntegerField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Test
        fields = [
            'id', 'topic', 'title', 'description', 'created_by', 'created_by_username',
            'time_limit_minutes', 'passing_score', 'is_active',
            'total_questions', 'created_at', 'updated_at', 'questions',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class TestListSerializer(serializers.ModelSerializer):
    """Compact list view (no nested questions)."""
    total_questions = serializers.IntegerField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)

    class Meta:
        model = Test
        fields = [
            'id', 'title', 'topic', 'topic_name', 'created_by_username',
            'time_limit_minutes', 'passing_score', 'is_active',
            'total_questions', 'created_at',
        ]


class TestStudentSerializer(serializers.ModelSerializer):
    """Student view — shows questions without correct answers."""
    questions = QuestionStudentSerializer(many=True, read_only=True)
    total_questions = serializers.IntegerField(read_only=True)

    class Meta:
        model = Test
        fields = [
            'id', 'title', 'description', 'time_limit_minutes',
            'passing_score', 'total_questions', 'questions',
        ]
        read_only_fields = fields


# ---------- Student Answer (for submitting) ----------
class SubmitAnswerSerializer(serializers.Serializer):
    """Used when a student submits their answers."""
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField()


class SubmitTestSerializer(serializers.Serializer):
    """Wraps a list of answers for test submission."""
    answers = SubmitAnswerSerializer(many=True)


# ---------- Student Answer (for viewing results) ----------
class StudentAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    selected_option_text = serializers.CharField(source='selected_option.text', read_only=True)
    correct_option = serializers.SerializerMethodField()

    class Meta:
        model = StudentAnswer
        fields = [
            'id', 'question', 'question_text',
            'selected_option', 'selected_option_text',
            'is_correct', 'correct_option',
        ]

    def get_correct_option(self, obj):
        correct = obj.question.options.filter(is_correct=True).first()
        if correct:
            return {'id': correct.id, 'text': correct.text}
        return None


# ---------- Student Attempt ----------
class StudentAttemptSerializer(serializers.ModelSerializer):
    answers = StudentAnswerSerializer(many=True, read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = StudentAttempt
        fields = [
            'id', 'student', 'student_name', 'test', 'test_title',
            'score', 'total_marks_obtained', 'total_marks_possible',
            'passed', 'started_at', 'completed_at', 'answers',
        ]
        read_only_fields = fields


class StudentAttemptListSerializer(serializers.ModelSerializer):
    """Compact list (no nested answers)."""
    test_title = serializers.CharField(source='test.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = StudentAttempt
        fields = [
            'id', 'student_name', 'test', 'test_title',
            'score', 'passed', 'started_at', 'completed_at',
        ]
