from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.core.exceptions import ValidationError
import os


# ── Validators ────────────────────────────────────────────────────────────────

def validate_file_extension(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.pdf', '.mp4', '.txt', '.doc', '.docx']
    if not ext.lower() in valid_extensions:
        raise ValidationError('Unsupported file extension. Allowed: pdf, mp4, txt, doc, docx.')


def validate_file_size(value):
    if value.size > 50 * 1024 * 1024:
        raise ValidationError("Maximum allowed file size is 50MB.")


def unique_slug(model, title, parent_field=None, parent_value=None):
    """Generate a unique slug within the scope of a parent object."""
    base = slugify(title) or 'item'
    slug = base
    qs = model.objects.all()
    if parent_field and parent_value:
        qs = qs.filter(**{parent_field: parent_value})
    counter = 1
    while qs.filter(slug=slug).exists():
        slug = f"{base}-{counter}"
        counter += 1
    return slug


User = settings.AUTH_USER_MODEL


# ── CourseCategory ─────────────────────────────────────────────────────────────

class CourseCategory(models.Model):
    """Predefined course categories (AI, Web Dev, Data Science, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=10, default='📚', help_text='Emoji icon for the category')
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = 'Course Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


# ── Course ─────────────────────────────────────────────────────────────────────

class Course(models.Model):
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    DURATION_CHOICES = [
        ('short', 'Short (< 5 hrs)'),
        ('medium', 'Medium (5–20 hrs)'),
        ('long', 'Long (> 20 hrs)'),
    ]

    title = models.CharField(max_length=200, default='')
    slug = models.SlugField(max_length=220, unique=True, blank=True, default='')
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'admin'},
        related_name='courses_created',
    )
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Discovery & Filtering Fields ───────────────────────────────────────────
    category = models.ForeignKey(
        'CourseCategory',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='courses'
    )
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner', blank=True)
    duration = models.CharField(max_length=20, choices=DURATION_CHOICES, default='medium', blank=True)
    language = models.CharField(max_length=50, default='English', blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    has_certification = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    popularity_score = models.PositiveIntegerField(default=0)

    # Backward compat alias
    @property
    def name(self):
        return self.title

    @property
    def is_public(self):
        return self.is_published

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Course, self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    # Statistics helpers
    @property
    def total_subjects(self):
        return self.subjects.count()

    @property
    def total_topics(self):
        from django.db.models import Count
        return Topic.objects.filter(subject__course=self).count()

    @property
    def total_materials(self):
        return Material.objects.filter(topic__subject__course=self).count()


# ── Subject ─────────────────────────────────────────────────────────────────────

class Subject(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='subjects')
    title = models.CharField(max_length=200, default='')
    slug = models.SlugField(max_length=220, blank=True, default='')
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='subject_thumbnails/', null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Backward compat
    @property
    def name(self):
        return self.title

    class Meta:
        ordering = ['order', 'created_at']
        unique_together = [['course', 'slug']]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Subject, self.title, 'course', self.course_id)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.course.title} › {self.title}"

    @property
    def total_topics(self):
        return self.topics.count()

    @property
    def total_materials(self):
        return Material.objects.filter(topic__subject=self).count()


# ── Topic ─────────────────────────────────────────────────────────────────────

class Topic(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    title = models.CharField(max_length=200, default='')
    slug = models.SlugField(max_length=220, blank=True, default='')
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='topic_thumbnails/', null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    estimated_duration = models.CharField(max_length=50, blank=True, help_text='e.g. "2h 30m"')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Backward compat
    @property
    def name(self):
        return self.title

    class Meta:
        ordering = ['order', 'created_at']
        unique_together = [['subject', 'slug']]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Topic, self.title, 'subject', self.subject_id)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.subject.title} › {self.title}"

    @property
    def total_materials(self):
        return self.materials.count()

    # Backward compat for serializers referencing 'contents'
    @property
    def contents(self):
        return self.materials.all()


# ── Material (formerly Content) ───────────────────────────────────────────────

class Material(models.Model):
    MATERIAL_TYPE_CHOICES = [
        ('video', 'Video'),
        ('pdf', 'PDF'),
        ('notes', 'Notes'),
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
        ('link', 'External Link'),
    ]

    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=200, default='')
    slug = models.SlugField(max_length=220, blank=True, default='')
    description = models.TextField(blank=True)

    material_type = models.CharField(max_length=20, choices=MATERIAL_TYPE_CHOICES, default='pdf')

    # Files
    file = models.FileField(
        upload_to='course_files/',
        blank=True, null=True,
        validators=[validate_file_extension, validate_file_size]
    )
    thumbnail = models.ImageField(upload_to='material_thumbnails/', null=True, blank=True)

    # Typed content fields
    video_url = models.URLField(blank=True, help_text='YouTube / direct video URL')
    external_url = models.URLField(blank=True, help_text='External resource URL')
    text_content = models.TextField(blank=True, help_text='Rich text / notes content')

    # Metadata
    duration = models.CharField(max_length=50, blank=True, help_text='e.g. "45 min"')
    order = models.PositiveIntegerField(default=0)
    is_downloadable = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)

    # Analytics
    view_count = models.PositiveIntegerField(default=0)
    download_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Backward compat aliases
    @property
    def content_type(self):
        return self.material_type

    @property
    def external_link(self):
        return self.external_url

    class Meta:
        ordering = ['order', 'created_at']
        unique_together = [['topic', 'slug']]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug(Material, self.title, 'topic', self.topic_id)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


# ── Content alias (backward compat for Progress, ContentViewer, etc.) ─────────

class Content(models.Model):
    """Legacy proxy-style model kept for backward compatibility with Progress model.
    New code should use Material directly."""
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='contents')
    title = models.CharField(max_length=200)
    content_type = models.CharField(
        max_length=20,
        choices=[
            ('video', 'Video'), ('pdf', 'PDF'),
            ('text', 'Text'), ('link', 'External Link')
        ]
    )
    file = models.FileField(
        upload_to='course_files/', blank=True, null=True,
        validators=[validate_file_extension, validate_file_size]
    )
    text_content = models.TextField(blank=True)
    external_link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# ── Enrollment ────────────────────────────────────────────────────────────────

class Enrollment(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'student'},
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'course'],
                name='unique_enrollment_per_user_course'
            )
        ]
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.student.username} → {self.course.title}"


# ── Progress ──────────────────────────────────────────────────────────────────

class Progress(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='progress',
        limit_choices_to={'role': 'student'},
    )
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name='completions')
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'content')
        ordering = ['-completed_at']
        verbose_name_plural = 'Progress'

    def __str__(self):
        return f"{self.student.username} ✓ {self.content.title}"