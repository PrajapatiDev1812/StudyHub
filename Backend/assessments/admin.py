# pyrefly: ignore [missing-import]
from django.contrib import admin
from django.utils.html import format_html
from .models import Test, Question, Option, StudentAttempt, StudentAnswer

from courses.admin import SoftDeleteAdminMixin


class OptionInline(admin.TabularInline):
    model = Option
    extra = 4  # Show 4 option fields by default (A, B, C, D)
    readonly_fields = ('deleted_at',)


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    readonly_fields = ('deleted_at',)


@admin.register(Question)
class QuestionAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ('text', 'test', 'question_type', 'marks', 'order', 'is_active')
    list_filter = ('test', 'question_type', 'is_deleted')
    inlines = [OptionInline]
    readonly_fields = ('deleted_at', 'deleted_by')

    def is_active(self, obj):
        if obj.is_deleted:
            return format_html('<span style="color:red;">🗑 Deleted</span>')
        return format_html('<span style="color:green;">✅ Active</span>')
    is_active.short_description = 'Status'

    def get_queryset(self, request):
        return Question.all_objects.all().select_related('test')


@admin.register(Test)
class TestAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ('title', 'topic', 'created_by', 'time_limit_minutes', 'passing_score', 'is_active_flag', 'is_deleted')
    list_filter = ('is_active', 'is_deleted', 'topic__subject__course')
    inlines = [QuestionInline]
    list_select_related = ('topic', 'created_by')
    readonly_fields = ('created_at', 'updated_at', 'deleted_at', 'deleted_by')

    def is_active_flag(self, obj):
        return obj.is_active
    is_active_flag.boolean = True
    is_active_flag.short_description = 'Active'

    def get_queryset(self, request):
        return Test.all_objects.all().select_related('topic__subject__course', 'created_by')


class StudentAnswerInline(admin.TabularInline):
    """Inline for viewing student answers inside an attempt. Read-only."""
    model = StudentAnswer
    extra = 0
    readonly_fields = ('question', 'selected_option', 'is_correct')

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(StudentAttempt)
class StudentAttemptAdmin(admin.ModelAdmin):
    """
    StudentAttempt admin is READ-ONLY.
    These records are immutable audit trails and must never be deleted.
    """
    list_display = ('student', 'test', 'score', 'passed', 'started_at', 'completed_at')
    list_filter = ('passed', 'test')
    inlines = [StudentAnswerInline]
    readonly_fields = ('student', 'test', 'score', 'total_marks_obtained', 'total_marks_possible',
                       'passed', 'started_at', 'completed_at')

    def has_add_permission(self, request):
        """Disallow manual creation of attempts."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Disallow all deletion of student attempts."""
        return False

    def has_change_permission(self, request, obj=None):
        """Disallow editing attempt records."""
        return False
