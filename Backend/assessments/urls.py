from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TestViewSet,
    QuestionViewSet,
    OptionViewSet,
    MyAttemptsView,
    AttemptDetailView,
)

router = DefaultRouter()
router.register(r'tests', TestViewSet, basename='test')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'options', OptionViewSet, basename='option')

urlpatterns = [
    # Student's test attempts
    path('my-attempts/', MyAttemptsView.as_view(), name='my-attempts'),

    # View a specific attempt's detailed result
    path('attempts/<int:pk>/', AttemptDetailView.as_view(), name='attempt-detail'),

    # All router-generated CRUD + custom actions (submit, analytics)
    path('', include(router.urls)),
]
