from django.db import models
from django.conf import settings
import os
from django.core.exceptions import ValidationError


def validate_file_extension(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.pdf', '.mp4', '.txt', '.doc', '.docx']
    if not ext.lower() in valid_extensions:
        raise ValidationError('Unsupported file extension. Allowed: pdf, mp4, txt, doc, docx.')


def validate_file_size(value):
    filesize = value.size
    if filesize > 50 * 1024 * 1024:
        raise ValidationError("Maximum allowed file size is 50MB.")

# Create your models here.

User = settings.AUTH_USER_MODEL


class Course(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'admin'}
    )
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Subject(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="subjects"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.course.name} - {self.name}"

class Topic(models.Model):
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="topics"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.subject.name} - {self.name}"

class Content(models.Model):

    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="contents"
    )

    title = models.CharField(max_length=200)

    content_type = models.CharField(
        max_length=20,
        choices=[
            ('video','Video'),
            ('pdf','PDF'),
            ('text','Text'),
            ('link','External Link')
        ]
    )

    file = models.FileField(
        upload_to='course_files/', 
        blank=True, 
        null=True,
        validators=[validate_file_extension, validate_file_size]
    )

    text_content = models.TextField(blank=True)

    external_link = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Enrollment(models.Model):
    """Tracks which students are enrolled in which courses."""

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'student'},
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.student.username} → {self.course.name}"


class Progress(models.Model):
    """Tracks which content items a student has completed."""

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='progress',
        limit_choices_to={'role': 'student'},
    )
    content = models.ForeignKey(
        Content,
        on_delete=models.CASCADE,
        related_name='completions',
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'content')
        ordering = ['-completed_at']
        verbose_name_plural = 'Progress'

    def __str__(self):
        return f"{self.student.username} ✓ {self.content.title}"