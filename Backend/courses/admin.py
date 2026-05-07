from django.contrib import admin
from .models import Course, CourseCategory, Subject, Topic, Content, Enrollment, Progress

# Register your models here.

class SubjectInline(admin.TabularInline):
    model = Subject
    extra = 1


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 1


class ContentInline(admin.TabularInline):
    model = Content
    extra = 1


@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'slug')
    prepopulated_fields = {'slug': ('name',)}


class CourseAdmin(admin.ModelAdmin):
    inlines = [SubjectInline]
    list_display  = ('name', 'category', 'level', 'duration', 'price', 'rating', 'is_public', 'created_at')
    list_filter   = ('level', 'duration', 'has_certification', 'is_public', 'category')
    search_fields = ('name', 'description', 'language')


class SubjectAdmin(admin.ModelAdmin):
    inlines = [TopicInline]


class TopicAdmin(admin.ModelAdmin):
    inlines = [ContentInline]

class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrolled_at')
    list_filter = ('course',)

admin.site.register(Course, CourseAdmin)
admin.site.register(Subject, SubjectAdmin)
admin.site.register(Topic, TopicAdmin)
admin.site.register(Content)
admin.site.register(Enrollment, EnrollmentAdmin)


class ProgressAdmin(admin.ModelAdmin):
    list_display = ('student', 'content', 'completed_at')
    list_filter = ('content__topic__subject__course',)


admin.site.register(Progress, ProgressAdmin)