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
