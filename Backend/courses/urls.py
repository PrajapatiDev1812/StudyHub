from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CourseViewSet,
    SubjectViewSet,
    TopicViewSet,
    ContentViewSet,
    MyCoursesView,
    DashboardView,
    ProgressHistoryView,
    MyCompletedContentView,
    MyTotalContentView,
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'contents', ContentViewSet, basename='content')

urlpatterns = [
    # Student's enrolled courses
    path('my-courses/', MyCoursesView.as_view(), name='my-courses'),

    # Student's Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('my-completed-content/', MyCompletedContentView.as_view(), name='my-completed-content'),
    path('my-total-content/', MyTotalContentView.as_view(), name='my-total-content'),

    # Progress history for graph
    path('progress-history/', ProgressHistoryView.as_view(), name='progress-history'),

    # All router-generated CRUD + custom actions (enroll, unenroll, students, analytics, mark_complete)
    path('', include(router.urls)),
]
