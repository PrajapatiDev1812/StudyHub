# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.utils import timezone
from .models import Task, TaskAssignment
from accounts.models import User


class UserMinimalSerializer(serializers.ModelSerializer):
    """Tiny user representation for embedding in task responses."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email']
        read_only_fields = fields

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class TaskListSerializer(serializers.ModelSerializer):
    """Compact serializer for list views."""
    creator_name = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'source', 'status', 'priority', 'due_date',
            'course_name', 'subject_name', 'creator_name', 'is_overdue',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_creator_name(self, obj):
        if not obj.creator:
            return None
        return f"{obj.creator.first_name} {obj.creator.last_name}".strip() or obj.creator.username

    def get_course_name(self, obj):
        return obj.course.name if obj.course else None

    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None


class TaskDetailSerializer(serializers.ModelSerializer):
    """Full detail for a single task."""
    creator = UserMinimalSerializer(read_only=True)
    user = UserMinimalSerializer(read_only=True)
    course_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    topic_name = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    assignments_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'source', 'status', 'priority',
            'due_date', 'course', 'course_name', 'subject', 'subject_name',
            'topic', 'topic_name', 'creator', 'user', 'is_overdue',
            'assignments_count', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'source', 'creator', 'user', 'is_overdue',
            'assignments_count', 'created_at', 'updated_at',
        ]

    def get_course_name(self, obj):
        return obj.course.name if obj.course else None

    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None

    def get_topic_name(self, obj):
        return obj.topic.name if obj.topic else None

    def get_assignments_count(self, obj):
        if obj.source != 'ADMIN_ASSIGNED':
            return None
        return obj.assignments.count()


class StudentTaskCreateSerializer(serializers.ModelSerializer):
    """Student creates a personal (STUDENT_CREATED) task."""

    class Meta:
        model = Task
        fields = ['title', 'description', 'priority', 'due_date', 'course', 'subject', 'topic', 'status']

    def validate_status(self, value):
        allowed = {'TODO', 'IN_PROGRESS', 'COMPLETED'}
        if value not in allowed:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(allowed)}")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['creator'] = user
        validated_data['user'] = user
        validated_data['source'] = 'STUDENT_CREATED'
        return super().create(validated_data)


class StudentTaskUpdateSerializer(serializers.ModelSerializer):
    """Student updates their own STUDENT_CREATED task."""

    class Meta:
        model = Task
        fields = ['title', 'description', 'priority', 'due_date', 'course', 'subject', 'topic', 'status']

    def validate_status(self, value):
        allowed = {'TODO', 'IN_PROGRESS', 'COMPLETED'}
        if value not in allowed:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(allowed)}")
        return value

    def update(self, instance, validated_data):
        # If completing, set completed_at for legacy compat
        if validated_data.get('status') == 'COMPLETED' and instance.status != 'COMPLETED':
            instance.completed = True
            instance.completed_at = timezone.now()
        elif validated_data.get('status') != 'COMPLETED':
            instance.completed = False
            instance.completed_at = None
        return super().update(instance, validated_data)


class AdminTaskCreateSerializer(serializers.ModelSerializer):
    """Admin creates an ADMIN_ASSIGNED task and optionally assigns students."""
    assigned_student_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, default=list
    )

    class Meta:
        model = Task
        fields = [
            'title', 'description', 'priority', 'due_date',
            'course', 'subject', 'topic', 'assigned_student_ids',
        ]

    def create(self, validated_data):
        student_ids = validated_data.pop('assigned_student_ids', [])
        admin = self.context['request'].user
        validated_data['creator'] = admin
        validated_data['source'] = 'ADMIN_ASSIGNED'
        validated_data['status'] = 'TODO'  # Not used for admin tasks, but set a default
        task = super().create(validated_data)

        # Create TaskAssignment for each student
        if student_ids:
            students = User.objects.filter(id__in=student_ids, role='student')
            assignments = [
                TaskAssignment(task=task, student=student)
                for student in students
            ]
            TaskAssignment.objects.bulk_create(assignments, ignore_conflicts=True)

        return task


class AdminTaskUpdateSerializer(serializers.ModelSerializer):
    """Admin updates an existing task definition."""

    class Meta:
        model = Task
        fields = ['title', 'description', 'priority', 'due_date', 'course', 'subject', 'topic']


class TaskDueDateSerializer(serializers.ModelSerializer):
    """Admin-only: update only the due date (explicit, auditable endpoint)."""

    class Meta:
        model = Task
        fields = ['due_date']


# ─── TaskAssignment Serializers ───────────────────────────────────────────────

class TaskAssignmentListSerializer(serializers.ModelSerializer):
    """Compact assignment for list views."""
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_priority = serializers.CharField(source='task.priority', read_only=True)
    due_date = serializers.DateTimeField(source='task.due_date', read_only=True)
    course_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    creator_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = TaskAssignment
        fields = [
            'id', 'task_id', 'task_title', 'task_priority', 'due_date',
            'course_name', 'subject_name', 'creator_name', 'student_name',
            'status', 'submitted_at', 'verified_at', 'is_overdue',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_course_name(self, obj):
        return obj.task.course.name if obj.task.course else None

    def get_subject_name(self, obj):
        return obj.task.subject.name if obj.task.subject else None

    def get_creator_name(self, obj):
        if not obj.task.creator:
            return None
        c = obj.task.creator
        return f"{c.first_name} {c.last_name}".strip() or c.username

    def get_student_name(self, obj):
        s = obj.student
        return f"{s.first_name} {s.last_name}".strip() or s.username


class TaskAssignmentDetailSerializer(serializers.ModelSerializer):
    """Full assignment detail for a student or admin."""
    task = TaskDetailSerializer(read_only=True)
    student = UserMinimalSerializer(read_only=True)
    verified_by = UserMinimalSerializer(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAssignment
        fields = [
            'id', 'task', 'student', 'status', 'is_overdue',
            'submission_note', 'attachment', 'attachment_url', 'submission_link', 'submitted_at',
            'verified_by', 'verified_at', 'revision_feedback',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'task', 'student', 'status', 'is_overdue',
            'submitted_at', 'verified_by', 'verified_at',
            'created_at', 'updated_at',
        ]

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None


class SubmitTaskSerializer(serializers.Serializer):
    """Student submits an assignment."""
    submission_note = serializers.CharField(required=False, allow_blank=True, default='')
    attachment = serializers.FileField(required=False, allow_null=True)
    submission_link = serializers.URLField(required=False, allow_blank=True, default='')


class RevisionRequestSerializer(serializers.Serializer):
    """Admin requests revision with feedback."""
    revision_feedback = serializers.CharField(required=True, min_length=1)


# ─── Student Dashboard Stats ──────────────────────────────────────────────────

class TaskStatsSerializer(serializers.Serializer):
    """Aggregated counts for the student task dashboard widget."""
    total = serializers.IntegerField()
    personal_todo = serializers.IntegerField()
    personal_in_progress = serializers.IntegerField()
    personal_completed = serializers.IntegerField()
    assigned_todo = serializers.IntegerField()
    assigned_in_progress = serializers.IntegerField()
    assigned_submitted = serializers.IntegerField()
    assigned_verified = serializers.IntegerField()
    assigned_needs_revision = serializers.IntegerField()
    overdue = serializers.IntegerField()
