from django.contrib import admin
from .models import Test, Question, Option, StudentAttempt, StudentAnswer


class OptionInline(admin.TabularInline):
    model = Option
    extra = 4  # Show 4 option fields by default (A, B, C, D)


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1


class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'test', 'question_type', 'marks', 'order')
    list_filter = ('test', 'question_type')
    inlines = [OptionInline]


class TestAdmin(admin.ModelAdmin):
    list_display = ('title', 'topic', 'created_by', 'time_limit_minutes', 'passing_score', 'is_active')
    list_filter = ('is_active', 'topic__subject__course')
    inlines = [QuestionInline]


class StudentAnswerInline(admin.TabularInline):
    model = StudentAnswer
    extra = 0
    readonly_fields = ('question', 'selected_option', 'is_correct')


class StudentAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'test', 'score', 'passed', 'started_at', 'completed_at')
    list_filter = ('passed', 'test')
    inlines = [StudentAnswerInline]


admin.site.register(Test, TestAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(StudentAttempt, StudentAttemptAdmin)
