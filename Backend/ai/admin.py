from django.contrib import admin
from .models import (
    AdminContentChunk, StudentContentChunk, StudentNote,
    ChatSession, ChatMessage, ChatAttachment,
    AIRequestLog,
)


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


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ['role', 'content', 'feedback', 'created_at']


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'is_pinned', 'mode', 'level', 'created_at', 'updated_at']
    list_filter = ['is_pinned', 'mode', 'level', 'user']
    search_fields = ['title']
    inlines = [ChatMessageInline]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'feedback', 'created_at']
    list_filter = ['role', 'feedback']
    search_fields = ['content']


@admin.register(ChatAttachment)
class ChatAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'file_name', 'file_type', 'file_size', 'created_at']
    list_filter = ['file_type']


# ── AI Request Log Admin ───────────────────────────────────────────────────────

def mark_as_archived(modeladmin, request, queryset):
    queryset.update(is_archived=True)
mark_as_archived.short_description = 'Archive selected logs (exclude from live dashboards)'


@admin.register(AIRequestLog)
class AIRequestLogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'role_snapshot', 'request_type',
        'status', 'response_time_ms', 'detected_topic',
        'course', 'is_archived', 'timestamp',
    ]
    list_filter  = ['status', 'request_type', 'role_snapshot', 'is_archived', 'course']
    search_fields = ['user__username', 'detected_topic', 'error_code']
    readonly_fields = [
        'user', 'role_snapshot', 'timestamp', 'request_type',
        'query_text', 'detected_topic', 'course', 'subject', 'related_topic',
        'status', 'response_time_ms', 'error_code',
        'input_tokens', 'output_tokens', 'total_tokens', 'model_name',
        'metadata',
    ]
    actions = [mark_as_archived]
    date_hierarchy = 'timestamp'

    def has_add_permission(self, request):
        # Logs are created only by the system, not manually
        return False


