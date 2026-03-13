from django.db import models
from django.conf import settings
from courses.models import Topic

User = settings.AUTH_USER_MODEL


class Test(models.Model):
    """A quiz/test linked to a specific topic."""

    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='tests',
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_tests',
        limit_choices_to={'role': 'admin'},
    )
    time_limit_minutes = models.PositiveIntegerField(
        default=30,
        help_text="Time limit for the test in minutes.",
    )
    passing_score = models.PositiveIntegerField(
        default=50,
        help_text="Minimum percentage to pass (0-100).",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.topic.name} — {self.title}"

    @property
    def total_questions(self):
        return self.questions.count()


class Question(models.Model):
    """A single question in a test."""

    QUESTION_TYPES = [
        ('mcq', 'Multiple Choice'),
        ('true_false', 'True / False'),
    ]

    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='questions',
    )
    text = models.TextField(help_text="The question text.")
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPES,
        default='mcq',
    )
    marks = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(
        default=0,
        help_text="Order in which the question appears.",
    )

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order}: {self.text[:50]}"


class Option(models.Model):
    """An answer option for a question."""

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options',
    )
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        marker = "✓" if self.is_correct else "✗"
        return f"{marker} {self.text[:50]}"


class StudentAttempt(models.Model):
    """Records each time a student takes a test."""

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='test_attempts',
        limit_choices_to={'role': 'student'},
    )
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='attempts',
    )
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Score as a percentage (0-100).",
    )
    total_marks_obtained = models.PositiveIntegerField(default=0)
    total_marks_possible = models.PositiveIntegerField(default=0)
    passed = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.student.username} — {self.test.title} ({self.score}%)"


class StudentAnswer(models.Model):
    """Records a student's answer to a specific question."""

    attempt = models.ForeignKey(
        StudentAttempt,
        on_delete=models.CASCADE,
        related_name='answers',
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='student_answers',
    )
    selected_option = models.ForeignKey(
        Option,
        on_delete=models.CASCADE,
        related_name='selected_by',
        null=True,
        blank=True,
    )
    is_correct = models.BooleanField(default=False)

    class Meta:
        unique_together = ('attempt', 'question')

    def __str__(self):
        status = "✓" if self.is_correct else "✗"
        return f"{status} {self.question.text[:30]}"
