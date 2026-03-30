from django.contrib import admin
from .models import AdminContentChunk, StudentContentChunk, StudentNote


@admin.register(AdminContentChunk)
class AdminContentChunkAdmin(admin.ModelAdmin):
    list_display = ['id', 'course', 'topic', 'chunk_index', 'created_at']
    list_filter = ['course', 'topic']
    search_fields = ['chunk_text']
    readonly_fields = ['embedding']


@admin.register(StudentNote)
class StudentNoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'created_at']
    list_filter = ['user']
    search_fields = ['title', 'content']


@admin.register(StudentContentChunk)
class StudentContentChunkAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'chunk_index', 'created_at']
    list_filter = ['user']
    search_fields = ['chunk_text']
    readonly_fields = ['embedding']
