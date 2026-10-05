from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class AcademicSession(models.Model):
    name = models.CharField(max_length=50, unique=True, help_text="e.g. 2025-26, 2026-27")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return self.name


class AcademicProgram(models.Model):
    name = models.CharField(max_length=150, unique=True, help_text="e.g. M.Sc Data Science, B.Sc Data Science")
    code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    department = models.CharField(max_length=100, default="School of Computer Science & Data Analytics")
    degree_level = models.CharField(max_length=50, default="Postgraduate")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class AcademicYear(models.Model):
    program = models.ForeignKey(AcademicProgram, on_delete=models.CASCADE, related_name='years')
    year_number = models.PositiveSmallIntegerField(help_text="1, 2, 3, 4")
    name = models.CharField(max_length=50, help_text="e.g. Year 1, Year 2")

    class Meta:
        unique_together = ('program', 'year_number')
        ordering = ['program', 'year_number']

    def __str__(self):
        return f"{self.program.name} - Year {self.year_number}"


class AcademicSemester(models.Model):
    program_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='semesters')
    semester_number = models.PositiveSmallIntegerField(help_text="1, 2, 3... 8")
    name = models.CharField(max_length=50, help_text="e.g. Semester 3")

    class Meta:
        unique_together = ('program_year', 'semester_number')
        ordering = ['program_year', 'semester_number']

    def __str__(self):
        return f"{self.program_year} - {self.name}"


class TeacherSubjectAssignment(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teacher_assignments')
    subject = models.ForeignKey('courses.Subject', on_delete=models.CASCADE, related_name='teacher_assignments')
    program = models.ForeignKey(AcademicProgram, on_delete=models.CASCADE, related_name='teacher_assignments')
    year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='teacher_assignments')
    semester = models.ForeignKey(AcademicSemester, on_delete=models.CASCADE, related_name='teacher_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('teacher', 'subject', 'program', 'year', 'semester')

    def __str__(self):
        return f"Prof. {self.teacher.username} → {self.subject.title} ({self.program.name} Y{self.year.year_number})"


class StudentAcademicEnrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='academic_enrollments')
    academic_session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name='enrollments')
    program = models.ForeignKey(AcademicProgram, on_delete=models.CASCADE, related_name='enrollments')
    year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='enrollments')
    division = models.CharField(max_length=10, default="A")
    batch = models.CharField(max_length=20, default="B1")
    roll_number = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ('student', 'academic_session', 'program', 'year')

    def __str__(self):
        return f"{self.student.username} ({self.roll_number}) → {self.program.name} Y{self.year.year_number}"


class AttendanceRecord(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('medical_leave', 'Medical Leave'),
        ('excused', 'Excused'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    subject = models.ForeignKey('courses.Subject', on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    remarks = models.TextField(blank=True)
    marked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='marked_attendances')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'subject', 'date')
        ordering = ['-date', 'student']

    def __str__(self):
        return f"{self.date} | {self.student.username} - {self.subject.title}: {self.status}"


class AcademicAssignment(models.Model):
    subject = models.ForeignKey('courses.Subject', on_delete=models.CASCADE, related_name='academic_assignments')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField()
    max_marks = models.PositiveIntegerField(default=100)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_academic_assignments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-deadline']

    def __str__(self):
        return f"{self.subject.title} - {self.title}"


class AssignmentSubmission(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('pending', 'Pending'),
        ('late', 'Late'),
        ('evaluated', 'Evaluated'),
        ('missing', 'Missing'),
    )

    assignment = models.ForeignKey(AcademicAssignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignment_submissions')
    submitted_at = models.DateTimeField(null=True, blank=True)
    file_attachment = models.FileField(upload_to='assignment_submissions/', null=True, blank=True)
    marks = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.student.username} → {self.assignment.title} ({self.status})"


class StudentAcademicMetrics(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='academic_metrics')
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    assignment_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    test_average = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    topic_progress = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    lms_activity_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    risk_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    risk_level = models.CharField(max_length=20, default='Low') # Low, Medium, High, Critical
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Metrics for {self.student.username} (Risk: {self.risk_level})"


class RiskConfiguration(models.Model):
    name = models.CharField(max_length=50, default="Default University Config")
    attendance_weight = models.DecimalField(max_digits=5, decimal_places=2, default=30.0, help_text="Weight in %")
    assignment_weight = models.DecimalField(max_digits=5, decimal_places=2, default=25.0, help_text="Weight in %")
    test_weight = models.DecimalField(max_digits=5, decimal_places=2, default=25.0, help_text="Weight in %")
    topic_weight = models.DecimalField(max_digits=5, decimal_places=2, default=10.0, help_text="Weight in %")
    activity_weight = models.DecimalField(max_digits=5, decimal_places=2, default=10.0, help_text="Weight in %")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Att: {self.attendance_weight}%, Assg: {self.assignment_weight}%, Test: {self.test_weight}%)"


class AcademicNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='academic_notifications')
    notification_type = models.CharField(max_length=50) # attendance_low, missing_assignment, risk_alert, test_decline
    message = models.TextField()
    read_status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.notification_type}"


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='academic_audit_logs')
    action_type = models.CharField(max_length=50) # attendance_update, marks_update, assignment_create, permission_change
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.action_type}] by {self.actor} at {self.timestamp}"
