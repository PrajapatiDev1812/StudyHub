"""
tasks/views.py
--------------
Task Manager API views.

Endpoints:
  Student:
    GET/POST  /api/tasks/                 → Personal task CRUD
    GET/PATCH/DELETE /api/tasks/{id}/
    PATCH /api/tasks/{id}/status/         → Status change with validation

    GET /api/student/tasks/               → All tasks (personal + assigned)
    GET /api/student/tasks/stats/         → Aggregated stats for dashboard widget

    POST /api/task-assignments/{id}/start/
    POST /api/task-assignments/{id}/submit/
    POST /api/task-assignments/{id}/resubmit/

  Admin:
    GET/POST  /api/admin/tasks/           → Manage all tasks
    GET/PATCH/DELETE /api/admin/tasks/{id}/
    PATCH /api/admin/tasks/{id}/due-date/ → Change deadline only
    GET /api/admin/tasks/{id}/assignments/→ All student assignments for a task
    GET /api/task-assignments/            → All assignments (admin view)
    POST /api/task-assignments/{id}/verify/
    POST /api/task-assignments/{id}/request-revision/
"""
# pyrefly: ignore [missing-import]
from rest_framework import viewsets, status
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated
# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.db.models import Q
# pyrefly: ignore [missing-import]
from django.shortcuts import get_object_or_404

from .models import Task, TaskAssignment
from .serializers import (
    TaskListSerializer, TaskDetailSerializer,
    StudentTaskCreateSerializer, StudentTaskUpdateSerializer,
    AdminTaskCreateSerializer, AdminTaskUpdateSerializer, TaskDueDateSerializer,
    TaskAssignmentListSerializer, TaskAssignmentDetailSerializer,
    SubmitTaskSerializer, RevisionRequestSerializer,
    TaskStatsSerializer,
)
from .permissions import IsAdminUser, IsStudentUser, IsAdminOrStudent, IsTaskOwnerOrAdmin, IsAssignedStudentOrAdmin
from accounts.models import User


# ─── Student Personal Task ViewSet ────────────────────────────────────────────

class StudentTaskViewSet(viewsets.ModelViewSet):
    """
    CRUD for a student's own STUDENT_CREATED tasks.
    Admins are blocked from this endpoint (they use AdminTaskViewSet).
    """
    permission_classes = [IsStudentUser]

    def get_queryset(self):
        return Task.objects.filter(
            user=self.request.user,
            source='STUDENT_CREATED'
        ).select_related('creator', 'course', 'subject', 'topic')

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentTaskCreateSerializer
        if self.action in ('update', 'partial_update'):
            return StudentTaskUpdateSerializer
        if self.action == 'list':
            return TaskListSerializer
        return TaskDetailSerializer

    def perform_create(self, serializer):
        # source, creator, user all set inside the serializer
        serializer.save()

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """Explicit status change endpoint with validation."""
        task = self.get_object()
        new_status = request.data.get('status')
        allowed = {'TODO', 'IN_PROGRESS', 'COMPLETED'}
        if new_status not in allowed:
            return Response(
                {'error': f"Status must be one of: {', '.join(allowed)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        task.status = new_status
        if new_status == 'COMPLETED':
            task.completed = True
            task.completed_at = timezone.now()
        else:
            task.completed = False
            task.completed_at = None
        task.save()

        # Fire gamification event for personal task completion
        if new_status == 'COMPLETED':
            try:
                from gamification.services import track_event
                track_event(request.user, 'task_complete')
            except Exception:
                pass  # Never let gamification errors break core workflow

        return Response(TaskDetailSerializer(task, context={'request': request}).data)


# ─── Admin Task ViewSet ───────────────────────────────────────────────────────

class AdminTaskViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for task definitions.
    Admins can create ADMIN_ASSIGNED tasks and assign to multiple students.
    """
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Task.objects.select_related('creator', 'course', 'subject', 'topic')

        # Filters
        source = self.request.query_params.get('source')
        if source:
            qs = qs.filter(source=source)

        priority = self.request.query_params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)

        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminTaskCreateSerializer
        if self.action in ('update', 'partial_update'):
            return AdminTaskUpdateSerializer
        if self.action == 'list':
            return TaskListSerializer
        return TaskDetailSerializer

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['patch'], url_path='due-date')
    def update_due_date(self, request, pk=None):
        """
        Admin-only: explicitly change the due date of any task.
        Changing the due date NEVER resets status, submission, or verification.
        The new due date is immediately authoritative for overdue calculations.
        """
        task = self.get_object()
        serializer = TaskDueDateSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TaskDetailSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='assignments')
    def assignments(self, request, pk=None):
        """List all student assignments for this task."""
        task = self.get_object()
        assignments = task.assignments.select_related('student', 'verified_by').all()
        serializer = TaskAssignmentListSerializer(assignments, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='assign')
    def assign_students(self, request, pk=None):
        """Assign additional students to an existing ADMIN_ASSIGNED task."""
        task = self.get_object()
        if task.source != 'ADMIN_ASSIGNED':
            return Response(
                {'error': 'Only ADMIN_ASSIGNED tasks can have student assignments.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        student_ids = request.data.get('student_ids', [])
        if not student_ids:
            return Response({'error': 'student_ids is required.'}, status=status.HTTP_400_BAD_REQUEST)

        students = User.objects.filter(id__in=student_ids, role='student')
        created_count = 0
        for student in students:
            _, created = TaskAssignment.objects.get_or_create(task=task, student=student)
            if created:
                created_count += 1

        return Response({'assigned': created_count, 'student_ids': list(students.values_list('id', flat=True))})


# ─── Task Assignment ViewSet ──────────────────────────────────────────────────

class TaskAssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read access + workflow action endpoints for TaskAssignments.
    Students: see only their own. Admins: see all.
    """
    permission_classes = [IsAuthenticated, IsAssignedStudentOrAdmin]

    def get_queryset(self):
        user = self.request.user
        qs = TaskAssignment.objects.select_related(
            'task', 'task__creator', 'task__course', 'task__subject', 'task__topic',
            'student', 'verified_by'
        )
        if user.role == 'admin':
            # Admin: optionally filter by student
            student_id = self.request.query_params.get('student')
            if student_id:
                qs = qs.filter(student_id=student_id)
            # Filter by status
            status_filter = self.request.query_params.get('status')
            if status_filter:
                qs = qs.filter(status=status_filter)
            search = self.request.query_params.get('search')
            if search:
                qs = qs.filter(Q(task__title__icontains=search) | Q(student__username__icontains=search))
        else:
            # Student: own assignments only
            qs = qs.filter(student=user)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskAssignmentListSerializer
        return TaskAssignmentDetailSerializer

    # ── Student Workflow Actions ──────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='start', permission_classes=[IsStudentUser, IsAssignedStudentOrAdmin])
    def start(self, request, pk=None):
        """Student: TODO → IN_PROGRESS"""
        assignment = self.get_object()
        if assignment.status != 'TODO':
            return Response(
                {'error': f"Cannot start from status '{assignment.status}'. Expected 'TODO'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        assignment.status = 'IN_PROGRESS'
        assignment.save()
        return Response(TaskAssignmentDetailSerializer(assignment, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='submit', permission_classes=[IsStudentUser, IsAssignedStudentOrAdmin])
    def submit(self, request, pk=None):
        """Student: IN_PROGRESS → SUBMITTED (or NEEDS_REVISION → IN_PROGRESS → SUBMITTED via resubmit)"""
        assignment = self.get_object()
        if assignment.status not in ('IN_PROGRESS', 'NEEDS_REVISION'):
            return Response(
                {'error': f"Cannot submit from status '{assignment.status}'. Must be IN_PROGRESS or NEEDS_REVISION."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = SubmitTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        assignment.submission_note = d.get('submission_note', '')
        assignment.submission_link = d.get('submission_link', '')
        if 'attachment' in request.FILES:
            assignment.attachment = request.FILES['attachment']
        assignment.submitted_at = timezone.now()
        assignment.status = 'SUBMITTED'
        assignment.save()
        return Response(TaskAssignmentDetailSerializer(assignment, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='resubmit', permission_classes=[IsStudentUser, IsAssignedStudentOrAdmin])
    def resubmit(self, request, pk=None):
        """Student: NEEDS_REVISION → SUBMITTED (short-circuit, no need to go through IN_PROGRESS)"""
        assignment = self.get_object()
        if assignment.status != 'NEEDS_REVISION':
            return Response(
                {'error': f"Cannot resubmit from status '{assignment.status}'. Expected 'NEEDS_REVISION'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = SubmitTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        assignment.submission_note = d.get('submission_note', '')
        assignment.submission_link = d.get('submission_link', '')
        if 'attachment' in request.FILES:
            assignment.attachment = request.FILES['attachment']
        assignment.submitted_at = timezone.now()
        assignment.status = 'SUBMITTED'
        assignment.save()
        return Response(TaskAssignmentDetailSerializer(assignment, context={'request': request}).data)

    # ── Admin Verification Actions ────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='verify', permission_classes=[IsAdminUser])
    def verify(self, request, pk=None):
        """
        Admin: SUBMITTED → VERIFIED.
        verified_by and verified_at are set SERVER-SIDE. Never trusted from client.
        """
        assignment = self.get_object()
        if assignment.status != 'SUBMITTED':
            return Response(
                {'error': f"Cannot verify from status '{assignment.status}'. Expected 'SUBMITTED'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        assignment.status = 'VERIFIED'
        assignment.verified_by = request.user   # ← server-set
        assignment.verified_at = timezone.now()  # ← server-set
        assignment.save()

        # Fire gamification event for academic task verification
        try:
            from gamification.services import track_event
            track_event(assignment.student, 'task_complete')
        except Exception:
            pass

        return Response(TaskAssignmentDetailSerializer(assignment, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='request-revision', permission_classes=[IsAdminUser])
    def request_revision(self, request, pk=None):
        """Admin: SUBMITTED → NEEDS_REVISION with feedback."""
        assignment = self.get_object()
        if assignment.status != 'SUBMITTED':
            return Response(
                {'error': f"Cannot request revision from status '{assignment.status}'. Expected 'SUBMITTED'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = RevisionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        assignment.status = 'NEEDS_REVISION'
        assignment.revision_feedback = serializer.validated_data['revision_feedback']
        assignment.save()
        return Response(TaskAssignmentDetailSerializer(assignment, context={'request': request}).data)


# ─── Unified Student View (personal + assigned) ───────────────────────────────

class StudentUnifiedTaskView(APIView):
    """
    GET /api/student/tasks/
    Returns both STUDENT_CREATED tasks and TaskAssignments for the current student.
    """
    permission_classes = [IsStudentUser]

    def get(self, request):
        user = request.user
        now = timezone.now()

        # ── Filters ───────────────────────────────────────────────────────────
        source_filter = request.query_params.get('source')  # 'STUDENT_CREATED' | 'ADMIN_ASSIGNED'
        status_filter = request.query_params.get('status')
        priority_filter = request.query_params.get('priority')
        course_filter = request.query_params.get('course')
        subject_filter = request.query_params.get('subject')
        search = request.query_params.get('search', '')
        due_filter = request.query_params.get('due')  # 'today' | 'upcoming' | 'overdue'

        personal_tasks = []
        assigned_tasks = []

        # ── Personal tasks ────────────────────────────────────────────────────
        if not source_filter or source_filter == 'STUDENT_CREATED':
            pqs = Task.objects.filter(
                user=user, source='STUDENT_CREATED'
            ).select_related('course', 'subject', 'topic', 'creator')

            if status_filter and source_filter == 'STUDENT_CREATED':
                pqs = pqs.filter(status=status_filter)
            if priority_filter:
                pqs = pqs.filter(priority=priority_filter)
            if course_filter:
                pqs = pqs.filter(course_id=course_filter)
            if subject_filter:
                pqs = pqs.filter(subject_id=subject_filter)
            if search:
                pqs = pqs.filter(Q(title__icontains=search) | Q(description__icontains=search))
            if due_filter == 'today':
                today = now.date()
                pqs = pqs.filter(due_date__date=today)
            elif due_filter == 'overdue':
                pqs = pqs.filter(due_date__lt=now).exclude(status='COMPLETED')
            elif due_filter == 'upcoming':
                pqs = pqs.filter(due_date__gte=now)

            for t in pqs:
                personal_tasks.append({
                    'type': 'personal',
                    'id': t.id,
                    'title': t.title,
                    'description': t.description,
                    'source': t.source,
                    'status': t.status,
                    'priority': t.priority,
                    'due_date': t.due_date.isoformat() if t.due_date else None,
                    'is_overdue': t.is_overdue,
                    'course_name': t.course.name if t.course else None,
                    'subject_name': t.subject.name if t.subject else None,
                    'topic_name': t.topic.name if t.topic else None,
                    'created_at': t.created_at.isoformat(),
                    'updated_at': t.updated_at.isoformat(),
                })

        # ── Assigned tasks ────────────────────────────────────────────────────
        if not source_filter or source_filter == 'ADMIN_ASSIGNED':
            aqs = TaskAssignment.objects.filter(
                student=user
            ).select_related(
                'task', 'task__creator', 'task__course', 'task__subject', 'task__topic',
                'verified_by'
            )

            if status_filter and source_filter == 'ADMIN_ASSIGNED':
                aqs = aqs.filter(status=status_filter)
            if priority_filter:
                aqs = aqs.filter(task__priority=priority_filter)
            if course_filter:
                aqs = aqs.filter(task__course_id=course_filter)
            if subject_filter:
                aqs = aqs.filter(task__subject_id=subject_filter)
            if search:
                aqs = aqs.filter(
                    Q(task__title__icontains=search) | Q(task__description__icontains=search)
                )
            if due_filter == 'today':
                today = now.date()
                aqs = aqs.filter(task__due_date__date=today)
            elif due_filter == 'overdue':
                aqs = aqs.filter(task__due_date__lt=now).exclude(status='VERIFIED')
            elif due_filter == 'upcoming':
                aqs = aqs.filter(task__due_date__gte=now)

            for a in aqs:
                creator_name = None
                if a.task.creator:
                    c = a.task.creator
                    creator_name = f"{c.first_name} {c.last_name}".strip() or c.username
                verified_by_name = None
                if a.verified_by:
                    v = a.verified_by
                    verified_by_name = f"{v.first_name} {v.last_name}".strip() or v.username

                assigned_tasks.append({
                    'type': 'assigned',
                    'assignment_id': a.id,
                    'id': a.task.id,
                    'title': a.task.title,
                    'description': a.task.description,
                    'source': 'ADMIN_ASSIGNED',
                    'status': a.status,
                    'priority': a.task.priority,
                    'due_date': a.task.due_date.isoformat() if a.task.due_date else None,
                    'is_overdue': a.is_overdue,
                    'course_name': a.task.course.name if a.task.course else None,
                    'subject_name': a.task.subject.name if a.task.subject else None,
                    'topic_name': a.task.topic.name if a.task.topic else None,
                    'creator_name': creator_name,
                    'submission_note': a.submission_note,
                    'submission_link': a.submission_link,
                    'submitted_at': a.submitted_at.isoformat() if a.submitted_at else None,
                    'verified_by_name': verified_by_name,
                    'verified_at': a.verified_at.isoformat() if a.verified_at else None,
                    'revision_feedback': a.revision_feedback,
                    'created_at': a.created_at.isoformat(),
                    'updated_at': a.updated_at.isoformat(),
                })

        all_tasks = personal_tasks + assigned_tasks
        all_tasks.sort(key=lambda x: x.get('due_date') or '9999', reverse=False)

        return Response({
            'personal': personal_tasks,
            'assigned': assigned_tasks,
            'all': all_tasks,
            'counts': {
                'personal': len(personal_tasks),
                'assigned': len(assigned_tasks),
                'total': len(all_tasks),
            }
        })


class StudentTaskStatsView(APIView):
    """
    GET /api/student/tasks/stats/
    Aggregated counts for dashboard widget.
    """
    permission_classes = [IsStudentUser]

    def get(self, request):
        user = request.user
        now = timezone.now()

        # Personal task counts
        personal_qs = Task.objects.filter(user=user, source='STUDENT_CREATED')
        personal_todo = personal_qs.filter(status='TODO').count()
        personal_in_progress = personal_qs.filter(status='IN_PROGRESS').count()
        personal_completed = personal_qs.filter(status='COMPLETED').count()
        personal_overdue = personal_qs.filter(due_date__lt=now).exclude(status='COMPLETED').count()

        # Assigned task counts
        assigned_qs = TaskAssignment.objects.filter(student=user)
        assigned_todo = assigned_qs.filter(status='TODO').count()
        assigned_in_progress = assigned_qs.filter(status='IN_PROGRESS').count()
        assigned_submitted = assigned_qs.filter(status='SUBMITTED').count()
        assigned_verified = assigned_qs.filter(status='VERIFIED').count()
        assigned_needs_revision = assigned_qs.filter(status='NEEDS_REVISION').count()
        assigned_overdue = assigned_qs.filter(task__due_date__lt=now).exclude(status='VERIFIED').count()

        total_overdue = personal_overdue + assigned_overdue

        return Response({
            'total': personal_qs.count() + assigned_qs.count(),
            'personal_todo': personal_todo,
            'personal_in_progress': personal_in_progress,
            'personal_completed': personal_completed,
            'assigned_todo': assigned_todo,
            'assigned_in_progress': assigned_in_progress,
            'assigned_submitted': assigned_submitted,
            'assigned_verified': assigned_verified,
            'assigned_needs_revision': assigned_needs_revision,
            'overdue': total_overdue,
        })


class AdminVerificationQueueView(APIView):
    """
    GET /api/admin/tasks/verification-queue/
    All SUBMITTED assignments awaiting admin verification.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = TaskAssignment.objects.filter(
            status='SUBMITTED'
        ).select_related(
            'task', 'task__creator', 'task__course', 'task__subject', 'task__topic',
            'student', 'verified_by'
        ).order_by('submitted_at')

        search = request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(task__title__icontains=search) |
                Q(student__username__icontains=search) |
                Q(student__first_name__icontains=search)
            )
        course_id = request.query_params.get('course')
        if course_id:
            qs = qs.filter(task__course_id=course_id)

        serializer = TaskAssignmentDetailSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class AdminStudentListView(APIView):
    """
    GET /api/admin/task-students/
    Returns a minimal list of all students for the task assignment picker.
    Admin-only.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        students = User.objects.filter(role='student').only(
            'id', 'username', 'first_name', 'last_name', 'email'
        ).order_by('first_name', 'last_name')
        from .serializers import UserMinimalSerializer
        serializer = UserMinimalSerializer(students, many=True)
        return Response(serializer.data)

