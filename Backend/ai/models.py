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

