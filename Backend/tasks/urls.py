# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from rest_framework.routers import DefaultRouter
from .views import (
    StudentTaskViewSet,
    AdminTaskViewSet,
    TaskAssignmentViewSet,
    StudentUnifiedTaskView,
    StudentTaskStatsView,
    AdminVerificationQueueView,
    AdminStudentListView,
)

router = DefaultRouter()

# Student personal task CRUD
router.register(r'student/my-tasks', StudentTaskViewSet, basename='student-task')

# Admin task management
router.register(r'admin/tasks', AdminTaskViewSet, basename='admin-task')

# Task assignments (student: own; admin: all)
router.register(r'task-assignments', TaskAssignmentViewSet, basename='task-assignment')

urlpatterns = [
    path('', include(router.urls)),

    # ── Student unified view (personal + assigned) ───────────────────────────
    path('student/tasks/', StudentUnifiedTaskView.as_view(), name='student-tasks-unified'),
    path('student/tasks/stats/', StudentTaskStatsView.as_view(), name='student-tasks-stats'),

    # ── Admin verification queue ─────────────────────────────────────────────
    path('admin/tasks/verification-queue/', AdminVerificationQueueView.as_view(), name='admin-verification-queue'),

    # ── Admin student list (for task assignment picker) ───────────────────────
    path('admin/task-students/', AdminStudentListView.as_view(), name='admin-task-students'),
]
