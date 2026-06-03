from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CourseViewSet,
    CourseCategoryViewSet,
    SubjectViewSet,
    TopicViewSet,
    MaterialViewSet,
    ContentViewSet,
    MyCoursesView,
    DashboardView,
    ProgressHistoryView,
    MyCompletedContentView,
    MyTotalContentView,
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'categories', CourseCategoryViewSet, basename='category')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'materials', MaterialViewSet, basename='material')
router.register(r'contents', ContentViewSet, basename='content')  # Legacy

urlpatterns = [
    path('my-courses/', MyCoursesView.as_view(), name='my-courses'),
    path('my-completed-content/', MyCompletedContentView.as_view(), name='my-completed-content'),
    path('my-total-content/', MyTotalContentView.as_view(), name='my-total-content'),
    path('progress-history/', ProgressHistoryView.as_view(), name='progress-history'),
    path('', include(router.urls)),
]
