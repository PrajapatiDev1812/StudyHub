# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from courses.models import Course, Subject, Topic
# pyrefly: ignore [missing-import]
from config.soft_delete import SoftDeleteModel

User = settings.AUTH_USER_MODEL


class Task(SoftDeleteModel):
    """
    A task definition.

    source=ADMIN_ASSIGNED → Created by an admin, assigned to students via TaskAssignment.
                             Per-student state (status) lives on TaskAssignment.
    source=STUDENT_CREATED → Created by a student for themselves.
                              Status lives directly on this model.
    """

    SOURCE_CHOICES = [
        ('ADMIN_ASSIGNED', 'Admin Assigned'),
        ('STUDENT_CREATED', 'Student Created'),
    ]

    STATUS_CHOICES = [
        # Used for STUDENT_CREATED tasks only
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    # ── Core Fields ──────────────────────────────────────────────────────────
    creator = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_tasks',
        help_text='Admin (for ADMIN_ASSIGNED) or Student (for STUDENT_CREATED)',
    )

    # For STUDENT_CREATED tasks, this is the owner/assigned student.
    # For ADMIN_ASSIGNED tasks, use TaskAssignment for per-student state.
    # Kept as 'user' to preserve backward compat with existing queries.
    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='tasks',
        null=True, blank=True,
        help_text='For STUDENT_CREATED: the student who owns this task. Null for ADMIN_ASSIGNED.',
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    source = models.CharField(
        max_length=20, choices=SOURCE_CHOICES, default='STUDENT_CREATED', db_index=True,
    )

    # Status for STUDENT_CREATED tasks only.
    # ADMIN_ASSIGNED tasks use TaskAssignment.status instead.
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='TODO', db_index=True,
    )

    # ── Academic Context ─────────────────────────────────────────────────────
    course = models.ForeignKey(
        Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks',
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks',
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks',
    )

    # ── Scheduling ───────────────────────────────────────────────────────────
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default='medium',
    )
    due_date = models.DateTimeField(null=True, blank=True, db_index=True)

    # ── Legacy Fields (kept for backward compatibility) ───────────────────────
    # Previously the only completion mechanism. Now superseded by `status`.
    # Kept to avoid breaking any lingering references while we transition.
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    # ── Timestamps ───────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'

    def __str__(self):
        return f"[{self.source}] {self.title} ({self.status})"

    @property
    def is_overdue(self):
        """Dynamic overdue check. Always uses the latest due_date."""
        # pyrefly: ignore [missing-import]
        from django.utils import timezone
        if not self.due_date:
            return False
        if self.source == 'STUDENT_CREATED':
            return timezone.now() > self.due_date and self.status != 'COMPLETED'
        # ADMIN_ASSIGNED: overdue is per-assignment, not per-task definition.
        # The task-level due_date is the deadline; each assignment checks against it.
        return False


class TaskAssignment(SoftDeleteModel):
    """
    Per-student state for an ADMIN_ASSIGNED task.

    One Task can have many TaskAssignments (one per student).
    Each assignment is fully independent — verifying one student
    has zero effect on any other student's assignment.
    """

    STATUS_CHOICES = [
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('SUBMITTED', 'Submitted'),
        ('VERIFIED', 'Verified'),
        ('NEEDS_REVISION', 'Needs Revision'),
    ]

    # ── Core Relationship ─────────────────────────────────────────────────────
    task = models.ForeignKey(
        Task, on_delete=models.CASCADE,
        related_name='assignments',
    )
    student = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='task_assignments',
        limit_choices_to={'role': 'student'},
    )

    # ── Workflow State ────────────────────────────────────────────────────────
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='TODO', db_index=True,
    )

    # ── Submission ────────────────────────────────────────────────────────────
    submission_note = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to='task_submissions/', null=True, blank=True,
    )
    submission_link = models.URLField(max_length=500, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    # ── Verification (server-set only — never trust client values) ────────────
    verified_by = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='verified_assignments',
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    revision_feedback = models.TextField(blank=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [('task', 'student')]  # One assignment per student per task
        verbose_name = 'Task Assignment'
        verbose_name_plural = 'Task Assignments'

    def __str__(self):
        return f"[{self.student.username}] {self.task.title} — {self.status}"

    @property
    def is_overdue(self):
        """
        Dynamic overdue: uses the task's CURRENT due_date (latest authoritative value).
        If admin changes due_date, this immediately reflects the new deadline.
        """
        # pyrefly: ignore [missing-import]
        from django.utils import timezone
        if not self.task.due_date:
            return False
        return (
            timezone.now() > self.task.due_date
            and self.status != 'VERIFIED'
        )
