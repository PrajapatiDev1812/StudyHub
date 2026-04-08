from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from .models import Badge, UserBadge, UserStats
from .serializers import BadgeSerializer, UserBadgeSerializer, UserStatsSerializer
from .services import track_event

class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'student':
            return Badge.objects.filter(is_hidden=False)
        return super().get_queryset()

class UserBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user)

class UserStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        stats, _ = UserStats.objects.get_or_create(user=request.user)
        serializer = UserStatsSerializer(stats)
        return Response(serializer.data)

class TrackEventView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, event_type):
        """
        Generic endpoint to track gamification events manually.
        Events might include 'login', 'task_complete', etc.
        """
        valid_events = ['task_complete', 'focus_complete', 'test_submit', 'ai_used', 'login']
        if event_type not in valid_events:
            return Response({"error": "Invalid event type"}, status=status.HTTP_400_BAD_REQUEST)
            
        value = request.data.get('value')
        if value:
            try:
                value = float(value) if '.' in str(value) else int(value)
            except ValueError:
                value = None

        unlocked_badges = track_event(request.user, event_type, value)
        stats = UserStats.objects.get(user=request.user)
        
        response_data = {
            "badge_unlocked": len(unlocked_badges) > 0,
            "new_level": stats.level,
            "total_xp": stats.xp,
            "badges": []
        }
        
        for badge in unlocked_badges:
            response_data["badges"].append({
                "name": badge.name,
                "description": badge.description,
                "icon": badge.icon.url if badge.icon else None,
                "xp": badge.xp_reward
            })
            
            # To match the requested prompt format simply, we'll put the first one in "badge"
            if "badge" not in response_data and len(unlocked_badges) > 0:
                response_data["badge"] = response_data["badges"][0]
            
        return Response(response_data)
