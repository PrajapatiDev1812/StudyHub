# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.utils.html import format_html
# pyrefly: ignore [missing-import]
from .models import CourseCategory, Course, Subject, Topic, Material, Content, Enrollment, Progress


# ── Admin Actions ──────────────────────────────────────────────────────────────

@admin.action(description='🗑️ Soft Delete selected items')
def soft_delete_selected(modeladmin, request, queryset):
    """Soft-delete selected records (sets is_deleted=True, preserves data)."""
    count = queryset.count()
    queryset.delete(soft=True, user=request.user)
    modeladmin.message_user(request, f'{count} item(s) soft-deleted. They can be restored from the trash.')


@admin.action(description='♻️ Restore selected items')
def restore_selected(modeladmin, request, queryset):
    """Restore soft-deleted records by resetting is_deleted=False."""
    # Use all_objects manager to find soft-deleted records
    model = queryset.model
    ids = list(queryset.values_list('pk', flat=True))
    count = model.all_objects.filter(pk__in=ids, is_deleted=True).count()
    model.all_objects.filter(pk__in=ids).update(is_deleted=False, deleted_at=None, deleted_by=None)
    modeladmin.message_user(request, f'{count} item(s) restored successfully.')


# ── Mixins ─────────────────────────────────────────────────────────────────────

class SoftDeleteAdminMixin:
    """
    Mixin that:
    1. Replaces the default Django 'delete_selected' action with soft_delete_selected.
    2. Adds a 'restore_selected' action.
    3. Overrides delete_model() and delete_queryset() to always soft-delete.
    4. Adds an 'is_active' display column in list view.
    """
    actions = [soft_delete_selected, restore_selected]

    def is_active(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color:red;">🗑 Deleted</span>')
        return format_html('<span style="color:green;">✅ Active</span>')
    is_active.short_description = 'Status'

    def delete_model(self, request, obj):
        """Override single-object deletion in admin to use soft delete."""
        obj.delete(soft=True, user=request.user)

    def delete_queryset(self, request, queryset):
        """Override bulk deletion in admin to use soft delete."""
        queryset.delete(soft=True, user=request.user)

    def get_actions(self, request):
        """Remove the built-in 'delete_selected' and replace with soft_delete_selected."""
        actions = super().get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions


# ── CourseCategory ─────────────────────────────────────────────────────────────

@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


# ── Course ─────────────────────────────────────────────────────────────────────

class SubjectInline(admin.TabularInline):
    model = Subject
    extra = 0
    fields = ('title', 'order', 'is_published')
    readonly_fields = ('slug',)
    show_change_link = True


@admin.register(Course)
class CourseAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'category', 'level', 'is_published', 'is_featured', 'rating', 'is_active', 'created_at')
    list_filter = ('level', 'duration', 'has_certification', 'is_published', 'is_featured', 'category', 'is_deleted')
    search_fields = ('title', 'description', 'language')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at', 'popularity_score', 'deleted_at', 'deleted_by')
    inlines = [SubjectInline]
    list_editable = ('is_published', 'is_featured')

    def get_queryset(self, request):
        """Show all records (active + deleted) in admin."""
        return Course.all_objects.all().select_related('category', 'created_by')


# ── Subject ─────────────────────────────────────────────────────────────────────

class TopicInline(admin.TabularInline):
    model = Topic
    extra = 0
    fields = ('title', 'order', 'is_published', 'estimated_duration')
    show_change_link = True


@admin.register(Subject)
class SubjectAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'is_published', 'is_active', 'created_at')
    list_filter = ('course', 'is_published', 'is_deleted')
    search_fields = ('title', 'description')
    readonly_fields = ('slug', 'created_at', 'updated_at', 'deleted_at', 'deleted_by')
    inlines = [TopicInline]
    list_editable = ('order', 'is_published')
    list_select_related = ('course',)

    def get_queryset(self, request):
        return Subject.all_objects.all().select_related('course')


# ── Topic ─────────────────────────────────────────────────────────────────────

class MaterialInline(admin.TabularInline):
    model = Material
    extra = 0
    fields = ('title', 'material_type', 'order', 'is_published')
    show_change_link = True


@admin.register(Topic)
class TopicAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'subject', 'order', 'difficulty', 'is_published', 'is_active', 'estimated_duration')
    list_filter = ('subject__course', 'difficulty', 'is_published', 'is_deleted')
    search_fields = ('title', 'description')
    readonly_fields = ('slug', 'created_at', 'updated_at', 'deleted_at', 'deleted_by')
    inlines = [MaterialInline]
    list_editable = ('order', 'is_published')
    list_select_related = ('subject__course',)

    def get_queryset(self, request):
        return Topic.all_objects.all().select_related('subject__course')


# ── Material ──────────────────────────────────────────────────────────────────

@admin.register(Material)
class MaterialAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'topic', 'material_type', 'order', 'is_published', 'is_active', 'is_downloadable', 'view_count')
    list_filter = ('material_type', 'is_published', 'is_downloadable', 'topic__subject__course', 'is_deleted')
    search_fields = ('title', 'description')
    readonly_fields = ('slug', 'created_at', 'updated_at', 'view_count', 'download_count', 'deleted_at', 'deleted_by')
    list_editable = ('order', 'is_published')
    list_select_related = ('topic__subject__course',)

    def get_queryset(self, request):
        return Material.all_objects.all().select_related('topic__subject__course')


# ── Content ───────────────────────────────────────────────────────────────────

@admin.register(Content)
class ContentAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'topic', 'content_type', 'is_active', 'created_at')
    list_filter = ('content_type', 'topic__subject__course', 'is_deleted')
    search_fields = ('title',)
    readonly_fields = ('created_at', 'deleted_at', 'deleted_by')

    def get_queryset(self, request):
        return Content.all_objects.all().select_related('topic__subject__course')


# ── Enrollment ────────────────────────────────────────────────────────────────

@admin.register(Enrollment)
class EnrollmentAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ('student', 'course', 'is_active', 'enrolled_at')
    list_filter = ('course', 'is_deleted')
    search_fields = ('student__username', 'course__title')
    list_select_related = ('student', 'course')
    readonly_fields = ('enrolled_at', 'deleted_at', 'deleted_by')

    def get_queryset(self, request):
        return Enrollment.all_objects.all().select_related('student', 'course')


# ── Progress ──────────────────────────────────────────────────────────────────

@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    """Progress records are immutable — no soft-delete action exposed here."""
    list_display = ('student', 'content', 'completed_at')
    list_filter = ('content__topic__subject__course',)
    search_fields = ('student__username',)
    list_select_related = ('student', 'content')
    readonly_fields = ('student', 'content', 'completed_at')

    def has_delete_permission(self, request, obj=None):
        """Disable all deletion of progress records from admin."""
        return False