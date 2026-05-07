from django.urls import path
from . import views

urlpatterns = [
    path('summary/', views.StudentAnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('study-distribution/', views.StudentStudyDistributionView.as_view(), name='analytics-study-distribution'),
    path('course-distribution/', views.StudentCourseDistributionView.as_view(), name='analytics-course-distribution'),
    path('time-of-day/', views.StudentTimeOfDayView.as_view(), name='analytics-time-of-day'),
    path('focus-mode/', views.StudentFocusModeAnalyticsView.as_view(), name='analytics-focus-mode'),
    path('ai-assisted-learning/', views.StudentAILearningInsightsView.as_view(), name='analytics-ai-insights'),
    path('insights/', views.StudentSmartInsightsView.as_view(), name='analytics-smart-insights'),
    path('all/', views.StudentAllAnalyticsView.as_view(), name='analytics-all'),
]
