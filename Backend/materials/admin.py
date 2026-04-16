from django.contrib import admin
from .models import StudentMaterial, MaterialAccess, MaterialUserNote


@admin.register(StudentMaterial)
class StudentMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'student', 'material_type', 'visibility', 'favorite', 'is_deleted', 'uploaded_at']
    list_filter = ['material_type', 'visibility', 'favorite', 'is_deleted']
    search_fields = ['title', 'student__username', 'subject', 'topic']
    readonly_fields = ['uploaded_at', 'updated_at', 'ai_indexed', 'source']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('student')


@admin.register(MaterialAccess)
class MaterialAccessAdmin(admin.ModelAdmin):
    list_display = ['material', 'user', 'can_view', 'can_edit', 'can_comment', 'granted_at']
    list_filter = ['can_edit', 'can_comment']
    search_fields = ['material__title', 'user__username']


@admin.register(MaterialUserNote)
class MaterialUserNoteAdmin(admin.ModelAdmin):
    list_display = ['material', 'user', 'updated_at']
    search_fields = ['material__title', 'user__username']
