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
        
        # Find the base repeatable badge count for this event if applicable
        event_to_condition = {
            'task_complete': 'tasks_completed',
            'focus_complete': 'focus_time',
            'test_submit': 'test_score',
            'ai_used': 'ai_usage',
            'login': 'streak_days'
        }
        
        repeatable_info = None
        condition_type = event_to_condition.get(event_type)
        if condition_type:
            ub = UserBadge.objects.filter(user=request.user, badge__condition_type=condition_type, badge__repeatable=True).first()
            if ub:
                repeatable_info = {
                    "repeatable": True,
                    "badge": ub.badge.name,
                    "earned_count": ub.earned_count
                }

        response_data = {
            "badge_unlocked": len(unlocked_badges) > 0,
            "repeatable_earned": repeatable_info is not None,
            "new_level": stats.level,
            "total_xp": stats.xp,
            "badges": [],
            "repeatable_info": repeatable_info
        }
        
        for badge in unlocked_badges:
            badge_data = {
                "name": badge.name,
                "description": badge.description,
                "icon": badge.icon.url if badge.icon else None,
                "xp": badge.xp_reward,
                "tier": badge.tier,
                "milestone_unlocked": badge.tier != 'none'
            }
            response_data["badges"].append(badge_data)
            
            # To match the requested prompt format simply, we'll put the first one in "badge"
            if "badge" not in response_data:
                response_data["badge"] = badge_data
                if badge.tier != 'none':
                    response_data["milestone_unlocked"] = True
            
        return Response(response_data)
