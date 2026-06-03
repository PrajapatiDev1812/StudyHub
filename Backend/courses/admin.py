from django.contrib import admin
from .models import CourseCategory, Course, Subject, Topic, Material, Content, Enrollment, Progress


@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


class SubjectInline(admin.TabularInline):
    model = Subject
    extra = 0
    fields = ('title', 'order', 'is_published')
    readonly_fields = ('slug',)
    show_change_link = True


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'level', 'is_published', 'is_featured', 'rating', 'created_at')
    list_filter = ('level', 'duration', 'has_certification', 'is_published', 'is_featured', 'category')
    search_fields = ('title', 'description', 'language')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at', 'popularity_score')
    inlines = [SubjectInline]
    list_editable = ('is_published', 'is_featured')


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 0
    fields = ('title', 'order', 'is_published', 'estimated_duration')
    show_change_link = True


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'is_published', 'created_at')
    list_filter = ('course', 'is_published')
    search_fields = ('title', 'description')
    readonly_fields = ('slug', 'created_at', 'updated_at')
    inlines = [TopicInline]
    list_editable = ('order', 'is_published')


class MaterialInline(admin.TabularInline):
    model = Material
    extra = 0
    fields = ('title', 'material_type', 'order', 'is_published')
    show_change_link = True


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'order', 'difficulty', 'is_published', 'estimated_duration')
    list_filter = ('subject__course', 'difficulty', 'is_published')
    search_fields = ('title', 'description')
    readonly_fields = ('slug', 'created_at', 'updated_at')
    inlines = [MaterialInline]
    list_editable = ('order', 'is_published')


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'topic', 'material_type', 'order', 'is_published', 'is_downloadable', 'view_count')
    list_filter = ('material_type', 'is_published', 'is_downloadable', 'topic__subject__course')
    search_fields = ('title', 'description')
    readonly_fields = ('slug', 'created_at', 'updated_at', 'view_count', 'download_count')
    list_editable = ('order', 'is_published')


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'topic', 'content_type', 'created_at')
    list_filter = ('content_type', 'topic__subject__course')
    search_fields = ('title',)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrolled_at')
    list_filter = ('course',)
    search_fields = ('student__username', 'course__title')


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ('student', 'content', 'completed_at')
    list_filter = ('content__topic__subject__course',)
    search_fields = ('student__username',)