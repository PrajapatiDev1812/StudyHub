from rest_framework import serializers
from .models import Course, Subject, Topic, Content, Enrollment, Progress


# ---------- Content ----------
class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = [
            'id', 'topic', 'title', 'content_type',
            'file', 'text_content', 'external_link', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ---------- Topic ----------
class TopicSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(many=True, read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'subject', 'name', 'description', 'contents']
        read_only_fields = ['id']


class TopicListSerializer(serializers.ModelSerializer):
    """Lighter serializer without nested contents (used in lists)."""

    class Meta:
        model = Topic
        fields = ['id', 'subject', 'name', 'description']
        read_only_fields = ['id']


# ---------- Subject ----------
class SubjectSerializer(serializers.ModelSerializer):
    topics = TopicListSerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'course', 'name', 'description', 'topics']
        read_only_fields = ['id']


class SubjectListSerializer(serializers.ModelSerializer):
    """Lighter serializer without nested topics."""

    class Meta:
        model = Subject
        fields = ['id', 'course', 'name', 'description']
        read_only_fields = ['id']


# ---------- Course ----------
class CourseSerializer(serializers.ModelSerializer):
    subjects = SubjectListSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True
    )
    enrolled_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'created_by', 'created_by_username',
            'is_public', 'created_at', 'enrolled_count', 'is_enrolled', 'subjects',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_enrolled_count(self, obj):
        return obj.enrollments.count()

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user).exists()
        return False


class CourseListSerializer(serializers.ModelSerializer):
    """Compact serializer for list view (no nested subjects)."""
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True
    )
    enrolled_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'created_by_username',
            'is_public', 'created_at', 'enrolled_count', 'is_enrolled',
        ]

    def get_enrolled_count(self, obj):
        return obj.enrollments.count()

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(student=request.user).exists()
        return False


# ---------- Enrollment ----------
class EnrollmentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'course_name', 'student_name', 'enrolled_at']
        read_only_fields = ['id', 'student', 'enrolled_at']


# ---------- Progress ----------
class ProgressSerializer(serializers.ModelSerializer):
    content_title = serializers.CharField(source='content.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Progress
        fields = ['id', 'student', 'student_name', 'content', 'content_title', 'completed_at']
        read_only_fields = ['id', 'student', 'completed_at']
