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

from .academic_views import (
    AcademicFilterOptionsView,
    AcademicOverviewView,
    AcademicStudentsView,
    AcademicStudentDetailView,
    AcademicAttendanceView,
    AcademicAssignmentsView,
    AcademicTestsView,
    AcademicAnalyticsView,
    AcademicReportsView,
    AcademicAIInsightsView,
)

urlpatterns = [
    path('academic/filter-options/', AcademicFilterOptionsView.as_view(), name='academic-filter-options'),
    path('academic/overview/', AcademicOverviewView.as_view(), name='academic-overview'),
    path('academic/students/', AcademicStudentsView.as_view(), name='academic-students'),
    path('academic/student/<int:id>/', AcademicStudentDetailView.as_view(), name='academic-student-detail'),
    path('academic/attendance/', AcademicAttendanceView.as_view(), name='academic-attendance'),
    path('academic/assignments/', AcademicAssignmentsView.as_view(), name='academic-assignments'),
    path('academic/tests/', AcademicTestsView.as_view(), name='academic-tests'),
    path('academic/analytics/', AcademicAnalyticsView.as_view(), name='academic-analytics'),
    path('academic/reports/', AcademicReportsView.as_view(), name='academic-reports'),
    path('academic/ai-insights/', AcademicAIInsightsView.as_view(), name='academic-ai-insights'),
    path('my-courses/', MyCoursesView.as_view(), name='my-courses'),
    path('my-completed-content/', MyCompletedContentView.as_view(), name='my-completed-content'),
    path('my-total-content/', MyTotalContentView.as_view(), name='my-total-content'),
    path('progress-history/', ProgressHistoryView.as_view(), name='progress-history'),
    path('', include(router.urls)),
]

