import uuid
from django.db import models
from django.conf import settings
from courses.models import Course, Subject, Topic, Content


class AdminContentChunk(models.Model):
    """
    Stores chunked admin study material with embeddings.
    Each row = one small piece of text + its embedding vector.
    """
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE,
        related_name='ai_chunks'
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE,
        related_name='ai_chunks', null=True, blank=True
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.CASCADE,
        related_name='ai_chunks', null=True, blank=True
    )
    source_content = models.ForeignKey(
        Content, on_delete=models.CASCADE,
        related_name='ai_chunks', null=True, blank=True
    )
    chunk_text = models.TextField(
        help_text="The actual text chunk (typically 300-500 chars)"
    )
    chunk_index = models.IntegerField(
        default=0,
        help_text="Order of this chunk within the source content"
    )
    # Store embedding as JSON text (list of floats)
    # We use TextField instead of pgvector for simplicity on Windows
    embedding = models.TextField(
        blank=True, null=True,
        help_text="JSON-serialized embedding vector (768 floats)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['course', 'topic', 'chunk_index']
        verbose_name = 'Admin Content Chunk'
        verbose_name_plural = 'Admin Content Chunks'

    def __str__(self):
        return f"[Admin] {self.course.name} — chunk {self.chunk_index}"


class StudentNote(models.Model):
    """
    Students can save personal study notes.
    These notes get chunked and embedded for personalized RAG.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='student_notes',
        limit_choices_to={'role': 'student'}
    )
    title = models.CharField(max_length=300)
    content = models.TextField()
    subject = models.ForeignKey(
        Subject, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='student_notes'
    )
    topic = models.ForeignKey(
        Topic, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='student_notes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Moderation Fields ──
    MODERATION_STATUS_CHOICES = [
        ('pending', 'Pending Scan'),
        ('approved_academic', 'Approved (Academic)'),
        ('approved_medical', 'Approved (Medical)'),
        ('rejected_explicit', 'Rejected (Explicit/Unsafe)'),
        ('rejected_malware', 'Rejected (Malware)'),
        ('manual_review', 'Manual Review Required'),
    ]
    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_STATUS_CHOICES,
        default='pending'
    )
    moderation_category = models.CharField(max_length=100, blank=True, null=True)
    is_approved_for_ai = models.BooleanField(
        default=False,
        help_text="Only true if moderation_status is approved"
    )
    flagged_reason = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.user.username}] {self.title}"


class StudentContentChunk(models.Model):
    """
    Stores chunked student notes with embeddings.
    Each row = one small piece of a student's note + embedding.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='ai_note_chunks',
        limit_choices_to={'role': 'student'}
    )
    source_note = models.ForeignKey(
        StudentNote, on_delete=models.CASCADE,
        related_name='chunks', null=True, blank=True
    )
    title = models.CharField(max_length=300, blank=True)
    chunk_text = models.TextField()
    chunk_index = models.IntegerField(default=0)
    embedding = models.TextField(
        blank=True, null=True,
        help_text="JSON-serialized embedding vector (768 floats)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['user', 'source_note', 'chunk_index']
        verbose_name = 'Student Content Chunk'
        verbose_name_plural = 'Student Content Chunks'

    def __str__(self):
        return f"[{self.user.username}] {self.title} — chunk {self.chunk_index}"


# ─────────────────────────────────────────────
# Chat History Models
# ─────────────────────────────────────────────

class ChatSession(models.Model):
    """
    Represents a single conversation thread between a student and the AI.
    Stores the auto-generated title, pin status, and timestamps.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='chat_sessions',
    )
    title = models.CharField(
        max_length=500, default='New Chat',
        help_text="Auto-generated from the first question, or user-renamed",
    )
    is_pinned = models.BooleanField(default=False)
    mode = models.CharField(
        max_length=20, default='student_mode',
        choices=[
            ('student_mode', 'Student Mode'),
            ('teacher_mode', 'Teacher Mode'),
            ('exam_mode', 'Exam Mode'),
        ],
    )
    level = models.CharField(
        max_length=20, default='beginner',
        choices=[
            ('beginner', 'Beginner'),
            ('medium', 'Medium'),
            ('advance', 'Advanced'),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_pinned', '-updated_at']
        verbose_name = 'Chat Session'
        verbose_name_plural = 'Chat Sessions'

    def __str__(self):
        return f"[{self.user.username}] {self.title}"


class ChatMessage(models.Model):
    """
    A single message within a chat session.
    Role is either 'user' or 'ai'.
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    FEEDBACK_CHOICES = [
        ('good', 'Good Response'),
        ('bad', 'Bad Response'),
    ]

    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE,
        related_name='messages',
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    feedback = models.CharField(
        max_length=10, choices=FEEDBACK_CHOICES,
        blank=True, null=True,
        help_text="Student feedback on AI response (thumbs up/down)",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}..."


class ChatAttachment(models.Model):
    """
    Files uploaded by the student in a chat message.
    Supports images, PDFs, Word docs, PPTs, and videos.
    """
    FILE_TYPE_CHOICES = [
        ('image', 'Image'),
        ('pdf', 'PDF'),
        ('doc', 'Word Document'),
        ('ppt', 'Presentation'),
        ('video', 'Video'),
        ('other', 'Other'),
    ]

    message = models.ForeignKey(
        ChatMessage, on_delete=models.CASCADE,
        related_name='attachments',
    )
    file = models.FileField(upload_to='chat_attachments/%Y/%m/')
    file_name = models.CharField(max_length=500)
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES, default='other')
    file_size = models.PositiveIntegerField(
        default=0, help_text="File size in bytes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # ── Moderation Fields ──
    MODERATION_STATUS_CHOICES = [
        ('pending', 'Pending Scan'),
        ('approved_academic', 'Approved (Academic)'),
        ('approved_medical', 'Approved (Medical)'),
        ('rejected_explicit', 'Rejected (Explicit/Unsafe)'),
        ('rejected_malware', 'Rejected (Malware)'),
        ('manual_review', 'Manual Review Required'),
    ]
    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_STATUS_CHOICES,
        default='pending'
    )
    moderation_category = models.CharField(max_length=100, blank=True, null=True)
    is_approved_for_ai = models.BooleanField(
        default=False,
        help_text="Only true if moderation_status is approved"
    )
    flagged_reason = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'Chat Attachment'
        verbose_name_plural = 'Chat Attachments'

    def __str__(self):
        return f"{self.file_name} ({self.file_type})"


# ─────────────────────────────────────────────
# AI Usage Insights Logging
# ─────────────────────────────────────────────

class AIRequestLog(models.Model):
    """
    Immutable audit log for every AI assistant interaction.

    Privacy Rules:
    - query_text is optional and always truncated to 300 chars.
    - This field is NEVER exposed to professors or students via the API.
    - Only the main admin (is_superuser) can access raw log entries.
    - Analytics endpoints expose only aggregated, privacy-safe summaries.

    Design Notes:
    - course / subject / related_topic are nullable snapshot FKs so that
      logs remain intact even if course data is later deleted (SET_NULL).
    - metadata JSONField allows extending the log without new migrations.
    - Retention: use the `archive_ai_logs` management command to purge/archive
      entries older than a configured number of days.
    """

    # ── Request Type Choices ──────────────────────────────────────────────────
    REQUEST_TYPE_CHAT       = 'chat'
    REQUEST_TYPE_SUMMARY    = 'summary'
    REQUEST_TYPE_QUIZ       = 'quiz'
    REQUEST_TYPE_EXPLAIN    = 'explain'
    REQUEST_TYPE_OTHER      = 'other'

    REQUEST_TYPE_CHOICES = [
        (REQUEST_TYPE_CHAT,    'Chat'),
        (REQUEST_TYPE_SUMMARY, 'Summarisation'),
        (REQUEST_TYPE_QUIZ,    'Quiz Help'),
        (REQUEST_TYPE_EXPLAIN, 'Explanation'),
        (REQUEST_TYPE_OTHER,   'Other'),
    ]

    # ── Response Status Choices ───────────────────────────────────────────────
    STATUS_SUCCESS   = 'success'
    STATUS_FAILED    = 'failed'
    STATUS_THROTTLED = 'throttled'
    STATUS_BLOCKED   = 'blocked'

    STATUS_CHOICES = [
        (STATUS_SUCCESS,   'Success'),
        (STATUS_FAILED,    'Failed'),
        (STATUS_THROTTLED, 'Throttled'),
        (STATUS_BLOCKED,   'Blocked by Moderation'),
    ]

    # ── Core Identifiers ──────────────────────────────────────────────────────
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ai_request_logs',
        help_text="The user who made the request (nullable to preserve stats after deletion).",
    )
    # Snapshot of user role at the time of the request (admin / student)
    role_snapshot = models.CharField(
        max_length=20, blank=True, default='',
        help_text="Role of user at request time. Preserved even if user record changes.",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    timestamp = models.DateTimeField(
        auto_now_add=True, db_index=True,
        help_text="UTC timestamp of when the request was received.",
    )

    # ── Request Classification ────────────────────────────────────────────────
    request_type = models.CharField(
        max_length=20, choices=REQUEST_TYPE_CHOICES, default=REQUEST_TYPE_CHAT,
    )

    # ── Privacy-safe Query Snapshot ───────────────────────────────────────────
    # Stored only for main-admin debugging. Never exposed to professors/students.
    # IMPORTANT: always pass through sanitize_query() before saving.
    query_text = models.CharField(
        max_length=300, blank=True, default='',
        help_text="First 300 chars of the user query. Stored for admin diagnostics only.",
    )

    # ── Educational Context (nullable) ────────────────────────────────────────
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='ai_request_logs',
    )
    subject = models.ForeignKey(
        'courses.Subject',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='ai_request_logs',
    )
    related_topic = models.ForeignKey(
        'courses.Topic',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='ai_request_logs',
    )
    # Free-text topic name snapshot for cases where FK is not available
    detected_topic = models.CharField(
        max_length=200, blank=True, default='',
        help_text="Topic string passed in the request (subject/topic field from chat).",
    )

    # ── Response Outcome ──────────────────────────────────────────────────────
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_SUCCESS, db_index=True,
    )
    response_time_ms = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Total round-trip time in milliseconds from request to response.",
    )
    error_code = models.CharField(
        max_length=50, blank=True, default='',
        help_text="Short error code if status is failed (e.g. 'gemini_timeout').",
    )

    # ── Token Usage (optional – filled if Gemini returns usage metadata) ──────
    input_tokens  = models.PositiveIntegerField(null=True, blank=True)
    output_tokens = models.PositiveIntegerField(null=True, blank=True)
    total_tokens  = models.PositiveIntegerField(null=True, blank=True)
    model_name    = models.CharField(max_length=100, blank=True, default='')

    # ── Retention / Archival Flag ─────────────────────────────────────────────
    is_archived = models.BooleanField(
        default=False,
        help_text="Set to True by the archive_ai_logs management command. Archived entries are excluded from live dashboards.",
    )

    # ── Future Extensibility ──────────────────────────────────────────────────
    metadata = models.JSONField(
        default=dict, blank=True,
        help_text="Flexible JSON store for future fields (e.g. RAG chunk count, focus session id).",
    )

    class Meta:
        verbose_name     = 'AI Request Log'
        verbose_name_plural = 'AI Request Logs'
        ordering         = ['-timestamp']
        indexes = [
            # Fast per-user time-series queries (student dashboard)
            models.Index(fields=['user', 'timestamp'], name='ai_log_user_ts_idx'),
            # Fast course/topic aggregation (professor dashboard)
            models.Index(fields=['course', 'subject', 'related_topic'], name='ai_log_course_idx'),
            # Fast global time-series queries (admin dashboard)
            models.Index(fields=['timestamp', 'status'], name='ai_log_ts_status_idx'),
            # Archival filter
            models.Index(fields=['is_archived', 'timestamp'], name='ai_log_archive_idx'),
        ]

    def __str__(self):
        user_str = self.user.username if self.user else 'deleted_user'
        return f"[{self.status}] {user_str} — {self.request_type} @ {self.timestamp:%Y-%m-%d %H:%M}"

