# pyrefly: ignore [missing-import]
from rest_framework import viewsets, permissions, views, status
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.db.models import Count, Sum
from .models import Badge, UserBadge, UserStats, AchievementRule, LevelConfiguration, XPTransaction, AchievementAuditLog
from .serializers import BadgeSerializer, AchievementRuleSerializer, LevelConfigurationSerializer, XPTransactionSerializer, AchievementAuditLogSerializer

User = get_user_model()

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role == 'admin'

class AdminBadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [IsAdminUser]

class AdminAchievementRuleViewSet(viewsets.ModelViewSet):
    queryset = AchievementRule.objects.all()
    serializer_class = AchievementRuleSerializer
    permission_classes = [IsAdminUser]

class AdminStudentAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role='student')
    permission_classes = [IsAdminUser]
    
    def list(self, request, *args, **kwargs):
        students = self.get_queryset()
        data = []
        for student in students:
            stats, _ = UserStats.objects.get_or_create(user=student)
            total_badges = UserBadge.objects.filter(user=student).count()
            data.append({
                'id': student.id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'email': student.email,
                'level': stats.level,
                'xp': stats.xp,
                'total_badges': total_badges
            })
        return Response(data)

    @action(detail=True, methods=['post'])
    def award_badge(self, request, pk=None):
        student = self.get_object()
        badge_id = request.data.get('badge_id')
        reason = request.data.get('reason', 'Manual Award')
        
        try:
            badge = Badge.objects.get(id=badge_id)
        except Badge.DoesNotExist:
            return Response({'error': 'Badge not found'}, status=status.HTTP_404_NOT_FOUND)
            
        ub, created = UserBadge.objects.get_or_create(user=student, badge=badge)
        if not created and not badge.repeatable:
            return Response({'error': 'Student already has this badge'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not created:
            ub.earned_count += 1
            ub.save()
            
        stats, _ = UserStats.objects.get_or_create(user=student)
        stats.xp += badge.xp_reward
        stats.save()
        
        XPTransaction.objects.create(user=student, amount=badge.xp_reward, reason=f'Awarded Badge: {badge.name}')
        
        AchievementAuditLog.objects.create(
            actor=request.user,
            target_user=student,
            action='manual_award',
            reason=reason,
            metadata={'badge_id': badge.id, 'badge_name': badge.name}
        )
        
        return Response({'message': 'Badge awarded successfully'})

class AdminXPLevelViewSet(viewsets.ModelViewSet):
    queryset = LevelConfiguration.objects.all()
    serializer_class = LevelConfigurationSerializer
    permission_classes = [IsAdminUser]

class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AchievementAuditLog.objects.all()
    serializer_class = AchievementAuditLogSerializer
    permission_classes = [IsAdminUser]

class AdminAchievementAnalyticsView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_badges = Badge.objects.count()
        total_awarded = UserBadge.objects.count()
        students_with_badges = UserBadge.objects.values('user').distinct().count()
        
        category_distribution = list(Badge.objects.values('category').annotate(count=Count('id')))
        
        return Response({
            'total_badges': total_badges,
            'total_awarded': total_awarded,
            'students_with_badges': students_with_badges,
            'category_distribution': category_distribution
        })
