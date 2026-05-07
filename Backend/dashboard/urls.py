from django.urls import path
from . import views

urlpatterns = [
    path('summary/', views.DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('weekly-activity/', views.DashboardWeeklyActivityView.as_view(), name='dashboard-weekly-activity'),
    path('recent-activity/', views.DashboardRecentActivityView.as_view(), name='dashboard-recent-activity'),
    path('continue-learning/', views.DashboardContinueLearningView.as_view(), name='dashboard-continue-learning'),
    path('insights/', views.DashboardInsightsView.as_view(), name='dashboard-insights'),
    path('ai-summary/', views.DashboardAISummaryView.as_view(), name='dashboard-ai-summary'),
]
