from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'completed', 'completed_at', 'priority', 'due_date']
    list_filter = ['completed', 'priority', 'course']
    search_fields = ['title', 'description', 'user__username']
