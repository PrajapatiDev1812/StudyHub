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
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({'Completed' if self.completed else 'Pending'})"
