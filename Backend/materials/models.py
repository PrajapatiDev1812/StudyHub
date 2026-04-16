from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class StudentMaterial(models.Model):
    VISIBILITY_CHOICES = [
        ('private', 'Private'),
        ('shared', 'Shared'),
    ]

    MATERIAL_TYPE_CHOICES = [
        ('pdf', 'PDF'),
        ('doc', 'Document'),
        ('ppt', 'Presentation'),
        ('image', 'Image'),
        ('text', 'Text Note'),
        ('link', 'External Link'),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='materials')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    material_type = models.CharField(max_length=20, choices=MATERIAL_TYPE_CHOICES)

    file = models.FileField(upload_to='student_materials/', blank=True, null=True)
    external_url = models.URLField(blank=True, null=True)
    note_text = models.TextField(blank=True, null=True)

    subject = models.CharField(max_length=255, blank=True)
    topic = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(default=list, blank=True)

    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private')

    folder_name = models.CharField(max_length=255, blank=True)
    favorite = models.BooleanField(default=False)

    # AI integration flags
    ai_indexed = models.BooleanField(default=False)
    source = models.CharField(max_length=50, default='student_upload')

    # Soft delete
    is_deleted = models.BooleanField(default=False)

    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['student', 'is_deleted']),
            models.Index(fields=['student', 'favorite']),
            models.Index(fields=['student', 'folder_name']),
        ]

    def __str__(self):
        return f"{self.student.username} — {self.title}"

    @property
    def file_size(self):
        if self.file:
            try:
                return self.file.size
            except Exception:
                return None
        return None


class MaterialAccess(models.Model):
    """Tracks which users have been granted access to a shared material."""
    material = models.ForeignKey(StudentMaterial, on_delete=models.CASCADE, related_name='access_grants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='material_access')

    can_view = models.BooleanField(default=True)
    can_edit = models.BooleanField(default=False)
    can_comment = models.BooleanField(default=True)

    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('material', 'user')
        ordering = ['-granted_at']

    def __str__(self):
        return f"{self.user.username} → {self.material.title}"


class MaterialUserNote(models.Model):
    """Private per-user notes on a material — visible ONLY to the note author."""
    material = models.ForeignKey(StudentMaterial, on_delete=models.CASCADE, related_name='user_notes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='material_notes')

    note_content = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('material', 'user')

    def __str__(self):
        return f"Note by {self.user.username} on '{self.material.title}'"
