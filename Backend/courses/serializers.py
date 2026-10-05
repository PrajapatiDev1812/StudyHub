from rest_framework import serializers
from .models import Course, CourseCategory, Subject, Topic, Material, Content, Enrollment, Progress


# ── CourseCategory ─────────────────────────────────────────────────────────────

class CourseCategorySerializer(serializers.ModelSerializer):
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = CourseCategory
        fields = ['id', 'name', 'icon', 'slug', 'course_count']

    def get_course_count(self, obj):
        return getattr(obj, 'course_count', obj.courses.filter(is_published=True).count())


# ── Material ──────────────────────────────────────────────────────────────────

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = [
            'id', 'topic', 'title', 'slug', 'description',
            'material_type', 'file', 'thumbnail',
            'video_url', 'external_url', 'text_content',
            'duration', 'order', 'is_downloadable', 'is_published',
            'view_count', 'download_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'view_count', 'download_count', 'created_at', 'updated_at']


class MaterialListSerializer(serializers.ModelSerializer):
    """Compact serializer for list views."""
    class Meta:
        model = Material
        fields = [
            'id', 'topic', 'title', 'slug', 'material_type',
            'order', 'is_published', 'duration', 'is_downloadable',
            'thumbnail', 'view_count',
        ]


# ── Content (legacy) ──────────────────────────────────────────────────────────

class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = [
            'id', 'topic', 'title', 'content_type',
            'file', 'text_content', 'external_link', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ── Topic ─────────────────────────────────────────────────────────────────────

class TopicSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True)
    contents = ContentSerializer(many=True, read_only=True)  # Legacy
    total_materials = serializers.IntegerField(read_only=True)

    class Meta:
        model = Topic
        fields = [
            'id', 'subject', 'title', 'slug', 'description', 'thumbnail',
            'order', 'estimated_duration', 'difficulty',
            'is_published', 'created_at', 'updated_at',
            'total_materials', 'materials', 'contents',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_total_materials(self, obj):
        return getattr(obj, 'materials_count', obj.materials.count())


class TopicListSerializer(serializers.ModelSerializer):
    """Lighter serializer without nested materials."""
    total_materials = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = [
            'id', 'subject', 'title', 'slug', 'description', 'thumbnail',
            'order', 'estimated_duration', 'difficulty', 'is_published',
            'created_at', 'total_materials',
        ]
        read_only_fields = ['id', 'slug', 'created_at']

    def get_total_materials(self, obj):
        return getattr(obj, 'materials_count', obj.materials.count())


# ── Subject ───────────────────────────────────────────────────────────────────

class SubjectSerializer(serializers.ModelSerializer):
    topics = TopicListSerializer(many=True, read_only=True)
    total_topics = serializers.SerializerMethodField()
    total_materials = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = [
            'id', 'course', 'title', 'slug', 'description', 'thumbnail',
            'order', 'is_published', 'created_at', 'updated_at',
            'total_topics', 'total_materials', 'topics',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def get_total_topics(self, obj):
        return obj.topics.count()

    def get_total_materials(self, obj):
        return getattr(obj, 'materials_count', obj.total_materials)


class SubjectListSerializer(serializers.ModelSerializer):
    """Lighter serializer without nested topics."""
    total_topics = serializers.SerializerMethodField()
    total_materials = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = [
            'id', 'course', 'title', 'slug', 'description', 'thumbnail',
            'order', 'is_published', 'created_at',
            'total_topics', 'total_materials',
        ]
        read_only_fields = ['id', 'slug', 'created_at']

    def get_total_topics(self, obj):
        return obj.topics.count()

    def get_total_materials(self, obj):
        return getattr(obj, 'materials_count', obj.total_materials)


# ── Course ─────────────────────────────────────────────────────────────────────

class CourseSerializer(serializers.ModelSerializer):
    subjects = SubjectSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    total_subjects = serializers.SerializerMethodField()
    total_topics = serializers.SerializerMethodField()
    total_materials = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'thumbnail',
            'created_by', 'created_by_username',
            'is_published', 'is_featured', 'created_at', 'updated_at',
            'enrolled_count', 'is_enrolled',
            'category', 'category_name', 'category_icon',
            'level', 'duration', 'language', 'price',
            'has_certification', 'rating', 'popularity_score',
            'total_subjects', 'total_topics', 'total_materials',
            'subjects',
        ]
        read_only_fields = ['id', 'slug', 'created_by', 'created_at', 'updated_at']

    def get_enrolled_count(self, obj):
        return obj.enrollments.count()

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return any(e.student_id == request.user.id for e in obj.enrollments.all())
        return False

    def get_total_subjects(self, obj):
        return obj.subjects.count()

    def get_total_topics(self, obj):
        return getattr(obj, 'topics_count', obj.total_topics)

    def get_total_materials(self, obj):
        return getattr(obj, 'materials_count', obj.total_materials)


class CourseListSerializer(serializers.ModelSerializer):
    """Compact serializer for list view (no nested subjects)."""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    is_enrolled = serializers.SerializerMethodField()
    total_subjects = serializers.SerializerMethodField()
    total_topics = serializers.SerializerMethodField()
    total_materials = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'description', 'thumbnail',
            'created_by_username', 'is_published', 'is_featured',
            'created_at', 'updated_at',
            'enrolled_count', 'is_enrolled',
            'category', 'category_name', 'category_icon',
            'level', 'duration', 'language', 'price',
            'has_certification', 'rating', 'popularity_score',
            'total_subjects', 'total_topics', 'total_materials',
        ]

    def get_enrolled_count(self, obj):
        return obj.enrollments.count()

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return any(e.student_id == request.user.id for e in obj.enrollments.all())
        return False

    def get_total_subjects(self, obj):
        return obj.subjects.count()

    def get_total_topics(self, obj):
        return getattr(obj, 'topics_count', obj.total_topics)

    def get_total_materials(self, obj):
        return getattr(obj, 'materials_count', obj.total_materials)


# ── Reorder ───────────────────────────────────────────────────────────────────

class ReorderSerializer(serializers.Serializer):
    """Used by reorder endpoints — accepts an ordered list of IDs."""
    ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)


# ── Enrollment ────────────────────────────────────────────────────────────────

class EnrollmentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'course_name', 'student_name', 'enrolled_at']
        read_only_fields = ['id', 'student', 'enrolled_at']


# ── Progress ──────────────────────────────────────────────────────────────────

class ProgressSerializer(serializers.ModelSerializer):
    content_title = serializers.CharField(source='content.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Progress
        fields = ['id', 'student', 'student_name', 'content', 'content_title', 'completed_at']
        read_only_fields = ['id', 'student', 'completed_at']
