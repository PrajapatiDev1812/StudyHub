import uuid
import secrets
import json
# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
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
    Represents a single conversation thread between a student or teacher and the AI.
    Stores the auto-generated title, pin status, sharing, archival, and timestamps.
    """
    SHARING_CHOICES = [
        ('private',     'Private'),
        ('institution', 'Shared within Institution'),
        ('public',      'Public Link'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='chat_sessions',
    )
    title = models.CharField(
        max_length=500, default='New Conversation',
        help_text="Auto-generated from the first question, or user-renamed",
    )
    is_pinned = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    university = models.ForeignKey(
        'ai.University', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='chat_sessions',
        help_text="University ownership for tenant isolation.",
    )
    enable_voice = models.BooleanField(default=False)
    mode = models.CharField(
        max_length=20, default='student_mode',
        choices=[
            ('student_mode', 'Student Mode'),
            ('teacher_mode', 'Teacher Mode'),
            ('exam_mode',    'Exam Mode'),
        ],
    )
    level = models.CharField(
        max_length=20, default='beginner',
        choices=[
            ('beginner', 'Beginner'),
            ('medium',   'Medium'),
            ('advance',  'Advanced'),
        ],
    )

    # ── Teacher Workspace Extension Fields ─────────────────────────────────────
    subject = models.ForeignKey(
        'courses.Subject',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chat_sessions',
        help_text="Subject context for this conversation (teacher workspace).",
    )
    topic = models.ForeignKey(
        'courses.Topic',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chat_sessions',
        help_text="Topic context for this conversation (teacher workspace).",
    )
    is_archived = models.BooleanField(
        default=False,
        help_text="Archived conversations are hidden from the main list but not deleted.",
    )
    is_shared = models.BooleanField(
        default=False,
        help_text="True when the conversation has been shared.",
    )
    sharing_level = models.CharField(
        max_length=20,
        choices=SHARING_CHOICES,
        default='private',
        help_text="Who can see this conversation when shared.",
    )
    share_token = models.CharField(
        max_length=64,
        null=True, blank=True, unique=True,
        help_text="Unique token for public/institution sharing link.",
    )
    last_message_at = models.DateTimeField(
        null=True, blank=True,
        help_text="Timestamp of the most recent message in this session.",
    )
    tags = models.ManyToManyField(
        'ConversationTag',
        blank=True,
        related_name='sessions',
        help_text="User-defined tags for organization.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Conversation Memory ─────────────────────────────────────────────────────
    is_summarized = models.BooleanField(
        default=False,
        help_text="True when older messages in this session have been summarised.",
    )
    summary_text = models.TextField(
        blank=True, default='',
        help_text="Compressed summary of messages older than summary_covers_up_to_message.",
    )
    summarized_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the summary was last generated.",
    )
    summary_covers_up_to_message = models.IntegerField(
        null=True, blank=True,
        help_text="ID of the last ChatMessage included in summary_text.",
    )

    class Meta:
        ordering = ['-is_pinned', '-updated_at']
        verbose_name = 'Chat Session'
        verbose_name_plural = 'Chat Sessions'

    def generate_share_token(self):
        """Generate a unique random token for sharing this session."""
        token = secrets.token_urlsafe(32)
        self.share_token = token
        self.is_shared = True
        self.save(update_fields=['share_token', 'is_shared'])
        return token

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
    # Enhancement 6: confidence score for RAG responses
    retrieval_confidence = models.FloatField(
        null=True, blank=True,
        help_text="Top cosine similarity from RAG retrieval for this AI response (0.0–1.0).",
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

    # ── Multi-Tenant Scoping ──────────────────────────────────────────────────
    university = models.ForeignKey(
        'ai.University',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ai_request_logs',
        help_text="University context for multi-tenant analytics.",
    )

    # ── Enhancement 7: Provider + confidence tracking ─────────────────────────
    provider = models.CharField(
        max_length=50, blank=True, default='google',
        help_text="AI provider used for this request (e.g. 'google').",
    )
    retrieval_score = models.FloatField(
        null=True, blank=True,
        help_text="Top cosine similarity score from RAG retrieval (0.0–1.0).",
    )
    endpoint = models.CharField(
        max_length=100, blank=True, default='',
        help_text="View name / URL pattern that handled this request.",
    )
    concurrent_request_id = models.CharField(
        max_length=64, blank=True, default='',
        help_text="Unique ID for tracking concurrent request slots (for quota enforcement).",
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


# =============================================================================
# TEACHER AI PANEL MODELS
# =============================================================================

# ── Enhancement 12: AI Configuration per teacher ──────────────────────────────

class AIConfiguration(models.Model):
    """
    Per-teacher AI assistant configuration.
    Stores provider preferences, teaching style, feature flags,
    and M2M relationships to Subject/Topic for access control.

    One record per teacher (enforced via unique teacher FK).
    Retrieved on every chat/generation request to personalise behaviour.
    """

    STYLE_CHOICES = [
        ('beginner_friendly', 'Beginner Friendly'),
        ('academic',          'Academic'),
        ('advanced',          'Advanced'),
    ]
    DIFFICULTY_CHOICES = [
        ('easy',   'Easy'),
        ('medium', 'Medium'),
        ('hard',   'Hard'),
    ]
    PROVIDER_CHOICES = [
        ('google', 'Google Gemini'),
        # ('openai', 'OpenAI GPT'),  # future
    ]
    MODEL_CHOICES = [
        ('gemini-2.0-flash',    'Gemini 2.0 Flash (Recommended)'),
        ('gemini-2.5-flash',    'Gemini 2.5 Flash'),
        ('gemini-flash-latest', 'Gemini Flash Latest'),
    ]

    teacher = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_configuration',
        limit_choices_to={'role': 'admin'},
    )

    # ── Identity ──────────────────────────────────────────────────────────────
    assistant_name = models.CharField(
        max_length=100, default='StudyHub AI',
        help_text="Display name for the AI assistant on the teacher panel.",
    )

    # ── Provider (Enhancement 1) ──────────────────────────────────────────────
    provider   = models.CharField(max_length=50, choices=PROVIDER_CHOICES, default='google')
    model_name = models.CharField(max_length=100, choices=MODEL_CHOICES, default='gemini-2.0-flash')

    # ── Teaching Style ────────────────────────────────────────────────────────
    teaching_style   = models.CharField(max_length=30, choices=STYLE_CHOICES, default='academic')
    difficulty_level = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    temperature      = models.FloatField(
        default=0.3,
        help_text="Generation temperature (0.1 = focused, 1.0 = creative).",
    )

    # ── Custom system prompt (optional prefix, injected before base instruction) ─
    custom_system_prompt = models.TextField(
        blank=True, default='',
        help_text="Optional extra system instruction prepended to every AI call for this teacher.",
    )

    # ── Hybrid Knowledge Settings ──
    allow_global_knowledge = models.BooleanField(default=True)
    KNOWLEDGE_PRIORITY_CHOICES = [
        ('material_only', 'Material Only'),
        ('material_first', 'University Material First + Global Knowledge'),
        ('global_first', 'Global Knowledge Enabled'),
    ]
    knowledge_priority = models.CharField(
        max_length=20, choices=KNOWLEDGE_PRIORITY_CHOICES, default='material_first'
    )

    # ── Subject / Topic access control (Enhancement 3 — ManyToMany) ───────────
    allowed_subjects = models.ManyToManyField(
        'courses.Subject',
        blank=True,
        related_name='ai_configs_allowed',
        help_text="AI will only answer questions about these subjects (empty = all subjects allowed).",
    )
    blocked_topics = models.ManyToManyField(
        'courses.Topic',
        blank=True,
        related_name='ai_configs_blocked',
        help_text="AI will refuse to discuss these topics.",
    )

    # ── Feature Flags (Enhancement 12) ───────────────────────────────────────
    enable_chat                = models.BooleanField(default=True)
    enable_question_generation = models.BooleanField(default=True)
    enable_summarization       = models.BooleanField(default=True)
    enable_exam_mode           = models.BooleanField(default=True)
    enable_rag                 = models.BooleanField(default=True)
    enable_external_knowledge  = models.BooleanField(
        default=False,
        help_text="Allow AI to use knowledge outside uploaded documents. Off by default for safety.",
    )

    # ── Multi-tenant stub (Enhancement 14) ────────────────────────────────────
    institution = models.CharField(
        max_length=200, blank=True, default='',
        help_text="Institution name. Will become a FK when multi-tenant Institution model is built.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Configuration'
        verbose_name_plural = 'AI Configurations'

    def __str__(self):
        return f"{self.teacher.username} — {self.provider}/{self.model_name}"


# ── Enhancement 2: Three-tier knowledge storage ───────────────────────────────

class KnowledgeDocument(models.Model):
    """
    A file uploaded by a teacher for inclusion in the RAG knowledge base.
    Supports PDF, DOCX, and TXT.

    Embedding pipeline:
        upload → KnowledgeDocument (pending)
            → text extraction
            → KnowledgeChunk rows created
            → KnowledgeEmbedding rows created
            → status = done
    """
    FILE_TYPE_CHOICES = [
        ('pdf',  'PDF Document'),
        ('docx', 'Word Document (DOCX)'),
        ('txt',  'Plain Text'),
    ]
    EMBEDDING_STATUS_CHOICES = [
        ('pending',    'Pending'),
        ('processing', 'Processing'),
        ('done',       'Done'),
        ('failed',     'Failed'),
    ]

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='knowledge_documents',
        limit_choices_to={'role': 'admin'},
    )
    # ── Multi-tenant stub (Enhancement 14) ────────────────────────────────────
    institution = models.CharField(
        max_length=200, blank=True, default='',
        help_text="Institution name for future multi-tenant isolation.",
    )

    course  = models.ForeignKey('courses.Course',  on_delete=models.SET_NULL, null=True, blank=True, related_name='knowledge_documents')
    subject = models.ForeignKey('courses.Subject', on_delete=models.SET_NULL, null=True, blank=True, related_name='knowledge_documents')

    title     = models.CharField(max_length=300)
    file      = models.FileField(upload_to='knowledge_docs/%Y/%m/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES, default='txt')
    file_size = models.PositiveIntegerField(default=0, help_text="File size in bytes.")

    extracted_text   = models.TextField(blank=True, default='')
    embedding_status = models.CharField(
        max_length=20, choices=EMBEDDING_STATUS_CHOICES, default='pending', db_index=True,
    )
    error_message = models.TextField(
        blank=True, default='',
        help_text="Populated when embedding_status is 'failed'.",
    )

    # Counters updated by the embedding pipeline
    total_chunks    = models.IntegerField(default=0)
    embedded_chunks = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Knowledge Document'
        verbose_name_plural = 'Knowledge Documents'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.embedding_status}] {self.title} ({self.file_type})"


class KnowledgeChunk(models.Model):
    """
    A single text chunk extracted from a KnowledgeDocument.
    Does not store the embedding — that lives in KnowledgeEmbedding.
    This separation allows re-embedding with a different model without
    recreating chunks.
    """
    document    = models.ForeignKey(
        KnowledgeDocument, on_delete=models.CASCADE, related_name='chunks',
    )
    chunk_index = models.IntegerField()
    chunk_text  = models.TextField()
    token_count = models.IntegerField(
        default=0,
        help_text="Approximate token count (len(chunk_text) // 4).",
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Knowledge Chunk'
        verbose_name_plural = 'Knowledge Chunks'
        ordering = ['document', 'chunk_index']
        unique_together = [['document', 'chunk_index']]

    def __str__(self):
        return f"{self.document.title} — chunk {self.chunk_index}"


class KnowledgeEmbedding(models.Model):
    """
    Stores the embedding vector for a KnowledgeChunk.
    One-to-one with KnowledgeChunk. Separated so re-embedding is possible
    without touching the chunk text.
    """
    chunk = models.OneToOneField(
        KnowledgeChunk, on_delete=models.CASCADE, related_name='embedding',
    )
    embedding_vector  = models.TextField(
        help_text="JSON-serialized list of floats.",
    )
    embedding_model   = models.CharField(max_length=100, default='gemini-embedding-001')
    embedding_version = models.CharField(max_length=50, default='v1')
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Knowledge Embedding'
        verbose_name_plural = 'Knowledge Embeddings'

    def __str__(self):
        return f"Embedding for {self.chunk}"


# =============================================================================
# TEACHER AI WORKSPACE MODELS
# =============================================================================


class ConversationTag(models.Model):
    """
    Teacher-defined tags to categorize conversations.
    e.g., "Machine Learning", "Exam", "Research", "Lecture", "Assignment"
    """
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversation_tags',
        limit_choices_to={'role': 'admin'},
    )
    name  = models.CharField(max_length=100)
    color = models.CharField(
        max_length=20, default='#6366f1',
        help_text="Hex color for the tag badge.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        unique_together = [['teacher', 'name']]
        verbose_name = 'Conversation Tag'
        verbose_name_plural = 'Conversation Tags'

    def __str__(self):
        return f"{self.teacher.username} — #{self.name}"


class AIGeneratedContent(models.Model):
    """
    Stores all AI-generated educational content with an approval workflow.
    Content always starts as 'draft' and must be explicitly published.
    Types: notes, quiz, flashcards, assignment, lecture_material
    """
    CONTENT_TYPE_CHOICES = [
        ('notes',            'Study Notes'),
        ('quiz',             'Quiz'),
        ('flashcards',       'Flashcards'),
        ('assignment',       'Assignment'),
        ('lecture_material', 'Lecture Material'),
        ('blooms_questions', "Bloom's Taxonomy Questions"),
    ]
    STATUS_CHOICES = [
        ('draft',     'Draft'),
        ('reviewed',  'Reviewed'),
        ('published', 'Published'),
    ]

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='generated_content',
        limit_choices_to={'role': 'admin'},
    )
    content_type = models.CharField(max_length=30, choices=CONTENT_TYPE_CHOICES)
    title   = models.CharField(max_length=400)
    content = models.TextField(help_text="Raw generated content (JSON or text).")
    source_session = models.ForeignKey(
        ChatSession,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='generated_content',
        help_text="The conversation this content was generated from.",
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ai_generated_content',
    )
    subject = models.ForeignKey(
        'courses.Subject',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ai_generated_content',
    )
    topic = models.ForeignKey(
        'courses.Topic',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ai_generated_content',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text="Never auto-publish. Teacher must explicitly change to 'reviewed' or 'published'.",
    )
    metadata = models.JSONField(
        default=dict, blank=True,
        help_text="Extra parameters (quiz type, difficulty, question count, etc.).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'AI Generated Content'
        verbose_name_plural = 'AI Generated Content'

    def __str__(self):
        return f"[{self.status}] {self.teacher.username} — {self.content_type}: {self.title[:60]}"


class PromptTemplate(models.Model):
    """
    Reusable teacher prompt templates for the AI workspace.
    Teachers can save frequently-used prompts and reuse them.
    """
    CATEGORY_CHOICES = [
        ('notes',       'Generate Notes'),
        ('quiz',        'Create Quiz'),
        ('assignment',  'Create Assignment'),
        ('explain',     'Explain Topic'),
        ('case_study',  'Create Case Study'),
        ('custom',      'Custom'),
    ]

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prompt_templates',
        limit_choices_to={'role': 'admin'},
    )
    title    = models.CharField(max_length=200)
    prompt   = models.TextField(help_text="The reusable prompt text.")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='custom')
    is_global = models.BooleanField(
        default=False,
        help_text="If True, visible to all teachers in the institution.",
    )
    use_count = models.PositiveIntegerField(
        default=0,
        help_text="How many times this template has been used.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-use_count', '-created_at']
        verbose_name = 'Prompt Template'
        verbose_name_plural = 'Prompt Templates'

    def __str__(self):
        return f"{self.teacher.username} — {self.category}: {self.title}"

# Import safety models so Django detects them
from .models_safety import *