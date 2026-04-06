"""
focus/models.py
---------------
FocusSession — tracks each student study session with timer data,
mode (normal/strict), status transitions, and context (subject/topic).
"""
from django.db import models
from django.conf import settings
from courses.models import Subject, Topic, Content

User = settings.AUTH_USER_MODEL


class FocusSession(models.Model):
    MODE_CHOICES = [
        ('normal', 'Normal Mode'),
        ('strict', 'Strict Mode'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('break', 'On Break'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    SUGGESTION_SOURCE_CHOICES = [
        ('difficulty', 'Topic Difficulty'),
        ('usage', 'Usage History'),
        ('hybrid', 'Hybrid'),
        ('manual', 'Manual Override'),
    ]

    student = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='focus_sessions',
        limit_choices_to={'role': 'student'},
    )

    # ─── Study Context ───
    subject = models.ForeignKey(
        Subject, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='focus_sessions',
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='focus_sessions',
    )
    content_item = models.ForeignKey(
        Content, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='focus_sessions',
    )

    # ─── Session Config ───
    session_goal = models.CharField(max_length=500)
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='normal')
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='active')

    # ─── Timer Settings ───
    suggested_focus_minutes = models.PositiveIntegerField(default=25)
    selected_focus_minutes = models.PositiveIntegerField(default=25)
    suggested_break_minutes = models.PositiveIntegerField(default=5)
    selected_break_minutes = models.PositiveIntegerField(default=5)
    suggestion_source = models.CharField(
        max_length=12, choices=SUGGESTION_SOURCE_CHOICES, default='difficulty',
    )

    # ─── Accumulated Time ───
    total_focus_seconds = models.PositiveIntegerField(default=0)
    total_break_seconds = models.PositiveIntegerField(default=0)
    break_count = models.PositiveIntegerField(default=0)
    interruption_count = models.PositiveIntegerField(default=0)

    # ─── Timestamps ───
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    # ─── Break Tracking  ───
    # Stores ISO timestamp when the current break/pause started
    break_started_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-start_time']
        verbose_name = 'Focus Session'
        verbose_name_plural = 'Focus Sessions'

    def __str__(self):
        subj = self.subject.name if self.subject else 'No Subject'
        return f"[{self.student.username}] {subj} — {self.mode} ({self.status})"
