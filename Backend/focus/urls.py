from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FocusSessionViewSet, TimerSuggestionView

router = DefaultRouter()
router.register(r'sessions', FocusSessionViewSet, basename='focus-session')

urlpatterns = [
    path('', include(router.urls)),
    # Custom non-router start action
    path('sessions/start/', FocusSessionViewSet.as_view({'post': 'start_session'}), name='focus-start'),
    # Timer suggestions
    path('suggestions/', TimerSuggestionView.as_view(), name='focus-suggestions'),
]
