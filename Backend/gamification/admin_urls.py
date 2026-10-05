# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminBadgeViewSet,
    AdminAchievementRuleViewSet,
    AdminStudentAchievementViewSet,
    AdminXPLevelViewSet,
    AdminAuditLogViewSet,
    AdminAchievementAnalyticsView
)

router = DefaultRouter()
router.register(r'badges', AdminBadgeViewSet, basename='admin-badges')
router.register(r'rules', AdminAchievementRuleViewSet, basename='admin-rules')
router.register(r'students', AdminStudentAchievementViewSet, basename='admin-students')
router.register(r'xp-levels', AdminXPLevelViewSet, basename='admin-xp-levels')
router.register(r'audit-logs', AdminAuditLogViewSet, basename='admin-audit-logs')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/', AdminAchievementAnalyticsView.as_view(), name='admin-achievement-analytics'),
]
