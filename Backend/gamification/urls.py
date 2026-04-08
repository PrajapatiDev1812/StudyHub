from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BadgeViewSet, UserBadgeViewSet, UserStatsView, TrackEventView

router = DefaultRouter()
router.register(r'badges', BadgeViewSet, basename='badges')
router.register(r'user-badges', UserBadgeViewSet, basename='user-badges')

urlpatterns = [
    path('', include(router.urls)),
    path('user-stats/', UserStatsView.as_view(), name='user-stats'),
    path('event/<str:event_type>/', TrackEventView.as_view(), name='track-event'),
]
