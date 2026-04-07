from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FocusSessionViewSet, TimerSuggestionView

router = DefaultRouter()
router.register(r'sessions', FocusSessionViewSet, basename='focus-session')

# NOTE: The router already generates /sessions/start/ from the @action decorator.
# We only add routes that the router does NOT generate.
urlpatterns = [
    path('', include(router.urls)),
    # Timer suggestions
    path('suggestions/', TimerSuggestionView.as_view(), name='focus-suggestions'),
]
