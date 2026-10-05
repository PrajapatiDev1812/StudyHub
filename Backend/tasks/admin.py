# pyrefly: ignore [missing-import]
from django.contrib import admin
from .models import Task, TaskAssignment


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'source', 'status', 'priority', 'creator', 'user', 'due_date', 'created_at']
    list_filter = ['source', 'status', 'priority', 'course']
    search_fields = ['title', 'description', 'creator__username', 'user__username']
    date_hierarchy = 'created_at'
    raw_id_fields = ['creator', 'user', 'course', 'subject', 'topic']


@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'task', 'student', 'status', 'submitted_at', 'verified_by', 'verified_at']
    list_filter = ['status']
    search_fields = ['task__title', 'student__username']
    raw_id_fields = ['task', 'student', 'verified_by']
