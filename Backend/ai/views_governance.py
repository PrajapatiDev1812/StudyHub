"""
ai/views_governance.py
------------------------
Admin-only API views for the AI Governance Module.

All endpoints enforce backend RBAC — frontend restrictions alone are NOT acceptable.

Endpoint Map:
    /api/ai/admin/providers/              GET, POST
    /api/ai/admin/providers/<id>/         GET, PUT, PATCH, DELETE
    /api/ai/admin/models/                 GET, POST
    /api/ai/admin/models/<id>/            GET, PUT, PATCH, DELETE
    /api/ai/admin/quotas/                 GET, POST
    /api/ai/admin/quotas/<id>/            GET, PUT, PATCH, DELETE
    /api/ai/admin/quotas/reset/<user_id>/ POST
    /api/ai/admin/user-quotas/            GET, POST
    /api/ai/admin/user-quotas/<id>/       GET, PUT, DELETE
    /api/ai/admin/feature-flags/          GET, POST
    /api/ai/admin/feature-flags/<id>/     GET, PUT, DELETE
    /api/ai/admin/usage/                  GET
    /api/ai/admin/usage/<user_id>/        GET
    /api/ai/admin/logs/                   GET
    /api/ai/admin/audit-logs/             GET
    /api/ai/admin/analytics/dashboard/    GET
    /api/ai/admin/universities/           GET, POST
    /api/ai/admin/universities/<id>/      GET, PUT, PATCH, DELETE
    /api/ai/admin/reports/export/         GET
"""

import logging
from datetime import date, timedelta

# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from django.db.models import Sum, Count, Avg, Q
# pyrefly: ignore [missing-import]
from django.http import HttpResponse

# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
# pyrefly: ignore [missing-import]
from rest_framework.generics import (
    ListCreateAPIView, RetrieveUpdateDestroyAPIView,
    ListAPIView, RetrieveAPIView,
)
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework import status

from .permissions_governance import (
    IsSuperAdmin, IsAIAdmin, CanManageProviders,
    CanManageModels, CanManageQuotas, CanManageFeatureFlags,
    CanViewAILogs, CanViewAIAnalytics,
)
from .serializers.serializers_governance import (
    UniversitySerializer, AIProviderSerializer, AIModelSerializer,
    AIQuotaPolicySerializer, AIUserQuotaSerializer,
    AIUsageRecordSerializer, AIFeatureFlagSerializer,
    AIAuditLogSerializer, AIRequestLogAdminSerializer,
)
from .models_governance import (
    University, AIProvider, AIModel, AIQuotaPolicy,
    AIUserQuota, AIUsageRecord, AIFeatureFlag, AIAuditLog,
)
from .models import AIRequestLog

logger = logging.getLogger(__name__)


# ── Audit Helper ──────────────────────────────────────────────────────────────

def _audit(request, action, entity_type, entity_id='', prev=None, new=None, desc=''):
    """Create an audit log entry. Fire-and-forget."""
    try:
        ip = request.META.get('REMOTE_ADDR', '')
        ua = request.META.get('HTTP_USER_AGENT', '')[:500]
        AIAuditLog.objects.create(
            admin_user=request.user,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            previous_value=prev,
            new_value=new,
            description=desc,
            ip_address=ip,
            user_agent=ua,
        )
    except Exception as exc:
        logger.warning(f"[Audit] Failed to log: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
# UNIVERSITY CRUD
# ═══════════════════════════════════════════════════════════════════════════════

class UniversityListCreateView(ListCreateAPIView):
    """GET: List universities. POST: Create university."""
    permission_classes = [IsSuperAdmin]
    serializer_class = UniversitySerializer
    queryset = University.objects.all()

    def perform_create(self, serializer):
        instance = serializer.save()
        _audit(self.request, 'global_config_changed', 'university', instance.pk,
               new=serializer.data, desc=f"Created university: {instance.name}")


class UniversityDetailView(RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE for a single university."""
    permission_classes = [IsSuperAdmin]
    serializer_class = UniversitySerializer
    queryset = University.objects.all()

    def perform_update(self, serializer):
        prev = UniversitySerializer(self.get_object()).data
        instance = serializer.save()
        _audit(self.request, 'university_config_changed', 'university', instance.pk,
               prev=prev, new=serializer.data, desc=f"Updated university: {instance.name}")

    def perform_destroy(self, instance):
        _audit(self.request, 'university_config_changed', 'university', instance.pk,
               prev={'name': instance.name}, desc=f"Deleted university: {instance.name}")
        instance.delete()


# ═══════════════════════════════════════════════════════════════════════════════
# AI PROVIDER CRUD
# ═══════════════════════════════════════════════════════════════════════════════

class AIProviderListCreateView(ListCreateAPIView):
    """GET: List providers. POST: Create provider."""
    permission_classes = [CanManageProviders]
    serializer_class = AIProviderSerializer
    queryset = AIProvider.objects.all()

    def perform_create(self, serializer):
        instance = serializer.save()
        _audit(self.request, 'provider_created', 'provider', instance.pk,
               new={'name': instance.name, 'slug': instance.slug},
               desc=f"Created provider: {instance.name}")


class AIProviderDetailView(RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE for a single provider."""
    permission_classes = [CanManageProviders]
    serializer_class = AIProviderSerializer
    queryset = AIProvider.objects.all()

    def perform_update(self, serializer):
        prev = AIProviderSerializer(self.get_object()).data
        # Check if API key was rotated
        api_key_changed = 'api_key' in self.request.data and self.request.data['api_key']
        instance = serializer.save()
        action = 'provider_key_rotated' if api_key_changed else 'provider_updated'
        _audit(self.request, action, 'provider', instance.pk,
               prev=prev, new=AIProviderSerializer(instance).data,
               desc=f"Updated provider: {instance.name}")

    def perform_destroy(self, instance):
        _audit(self.request, 'provider_deleted', 'provider', instance.pk,
               prev={'name': instance.name, 'slug': instance.slug},
               desc=f"Deleted provider: {instance.name}")
        instance.delete()


# ═══════════════════════════════════════════════════════════════════════════════
# AI MODEL CRUD
# ═══════════════════════════════════════════════════════════════════════════════

class AIModelListCreateView(ListCreateAPIView):
    """GET: List models. POST: Create model."""
    permission_classes = [CanManageModels]
    serializer_class = AIModelSerializer
    queryset = AIModel.objects.select_related('provider').all()

    def get_queryset(self):
        qs = super().get_queryset()
        provider_id = self.request.query_params.get('provider')
        if provider_id:
            qs = qs.filter(provider_id=provider_id)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        _audit(self.request, 'model_created', 'model', instance.pk,
               new=serializer.data, desc=f"Created model: {instance.display_name}")


class AIModelDetailView(RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE for a single model."""
    permission_classes = [CanManageModels]
    serializer_class = AIModelSerializer
    queryset = AIModel.objects.select_related('provider').all()

    def perform_update(self, serializer):
        prev = AIModelSerializer(self.get_object()).data
        instance = serializer.save()
        _audit(self.request, 'model_updated', 'model', instance.pk,
               prev=prev, new=serializer.data,
               desc=f"Updated model: {instance.display_name}")

    def perform_destroy(self, instance):
        _audit(self.request, 'model_deleted', 'model', instance.pk,
               prev={'name': instance.name}, desc=f"Deleted model: {instance.display_name}")
        instance.delete()


# ═══════════════════════════════════════════════════════════════════════════════
# AI QUOTA POLICY CRUD
# ═══════════════════════════════════════════════════════════════════════════════

class AIQuotaPolicyListCreateView(ListCreateAPIView):
    """GET: List quota policies. POST: Create policy."""
    permission_classes = [CanManageQuotas]
    serializer_class = AIQuotaPolicySerializer
    queryset = AIQuotaPolicy.objects.select_related('university').all()

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        # Invalidate all cached policies
        from ai.services.quota_service import QuotaService
        QuotaService.invalidate_policy_cache()
        _audit(self.request, 'quota_policy_created', 'quota_policy', instance.pk,
               new=serializer.data, desc=f"Created quota policy: {instance.name}")


class AIQuotaPolicyDetailView(RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE for a single quota policy."""
    permission_classes = [CanManageQuotas]
    serializer_class = AIQuotaPolicySerializer
    queryset = AIQuotaPolicy.objects.select_related('university').all()

    def perform_update(self, serializer):
        prev = AIQuotaPolicySerializer(self.get_object()).data
        instance = serializer.save()
        from ai.services.quota_service import QuotaService
        QuotaService.invalidate_policy_cache()
        _audit(self.request, 'quota_policy_updated', 'quota_policy', instance.pk,
               prev=prev, new=serializer.data,
               desc=f"Updated quota policy: {instance.name}")

    def perform_destroy(self, instance):
        from ai.services.quota_service import QuotaService
        QuotaService.invalidate_policy_cache()
        _audit(self.request, 'quota_policy_deleted', 'quota_policy', instance.pk,
               prev={'name': instance.name}, desc=f"Deleted quota policy: {instance.name}")
        instance.delete()


class AIQuotaResetView(APIView):
    """POST: Reset a user's quota counters."""
    permission_classes = [CanManageQuotas]

    def post(self, request, user_id):
        try:
            # pyrefly: ignore [missing-import]
            from django.contrib.auth import get_user_model
            User = get_user_model()
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        from ai.services.quota_service import QuotaService
        QuotaService.reset_quota(target_user)
        _audit(request, 'user_quota_reset', 'user_quota', user_id,
               desc=f"Reset quota for user: {target_user.username}")

        return Response({'message': f'Quota reset for {target_user.username}.'})


# ═══════════════════════════════════════════════════════════════════════════════
# AI USER QUOTA OVERRIDE CRUD
# ═══════════════════════════════════════════════════════════════════════════════

class AIUserQuotaListCreateView(ListCreateAPIView):
    """GET: List user quota overrides. POST: Create override."""
    permission_classes = [CanManageQuotas]
    serializer_class = AIUserQuotaSerializer
    queryset = AIUserQuota.objects.select_related('user', 'quota_policy').all()

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        from ai.services.quota_service import QuotaService
        QuotaService.invalidate_policy_cache(user=instance.user)
        _audit(self.request, 'user_quota_override', 'user_quota', instance.pk,
               new=AIUserQuotaSerializer(instance).data,
               desc=f"Created quota override for: {instance.user.username}")


class AIUserQuotaDetailView(RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE for a single user quota override."""
    permission_classes = [CanManageQuotas]
    serializer_class = AIUserQuotaSerializer
    queryset = AIUserQuota.objects.select_related('user', 'quota_policy').all()

    def perform_update(self, serializer):
        instance = serializer.save()
        from ai.services.quota_service import QuotaService
        QuotaService.invalidate_policy_cache(user=instance.user)

    def perform_destroy(self, instance):
        from ai.services.quota_service import QuotaService
        QuotaService.invalidate_policy_cache(user=instance.user)
        instance.delete()


# ═══════════════════════════════════════════════════════════════════════════════
# AI FEATURE FLAG CRUD
# ═══════════════════════════════════════════════════════════════════════════════

class AIFeatureFlagListCreateView(ListCreateAPIView):
    """GET: List feature flags. POST: Create flag."""
    permission_classes = [CanManageFeatureFlags]
    serializer_class = AIFeatureFlagSerializer
    queryset = AIFeatureFlag.objects.select_related('university').all()

    def perform_create(self, serializer):
        instance = serializer.save()
        # Invalidate feature flag cache
        # pyrefly: ignore [missing-import]
        from django.core.cache import cache
        cache.delete_pattern(f'{_PREFIX}:feature:*') if hasattr(cache, 'delete_pattern') else None
        _audit(self.request, 'feature_flag_changed', 'feature_flag', instance.pk,
               new=serializer.data,
               desc=f"Created feature flag: {instance.get_feature_display()}")


class AIFeatureFlagDetailView(RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE for a single feature flag."""
    permission_classes = [CanManageFeatureFlags]
    serializer_class = AIFeatureFlagSerializer
    queryset = AIFeatureFlag.objects.select_related('university').all()

    def perform_update(self, serializer):
        prev = AIFeatureFlagSerializer(self.get_object()).data
        instance = serializer.save()
        _audit(self.request, 'feature_flag_changed', 'feature_flag', instance.pk,
               prev=prev, new=serializer.data,
               desc=f"Updated feature flag: {instance.get_feature_display()}")

    def perform_destroy(self, instance):
        _audit(self.request, 'feature_flag_changed', 'feature_flag', instance.pk,
               prev={'feature': instance.feature, 'is_enabled': instance.is_enabled},
               desc=f"Deleted feature flag: {instance.get_feature_display()}")
        instance.delete()


# ═══════════════════════════════════════════════════════════════════════════════
# AI USAGE (Admin View)
# ═══════════════════════════════════════════════════════════════════════════════

_PREFIX = 'studyhub:ai_gov'


class AIUsageOverviewView(ListAPIView):
    """GET: All users usage overview."""
    permission_classes = [CanViewAIAnalytics]
    serializer_class = AIUsageRecordSerializer
    queryset = AIUsageRecord.objects.select_related('user', 'university').all()


class AIUsageUserDetailView(APIView):
    """GET: Detailed usage for a specific user."""
    permission_classes = [CanViewAIAnalytics]

    def get(self, request, user_id):
        try:
            # pyrefly: ignore [missing-import]
            from django.contrib.auth import get_user_model
            User = get_user_model()
            target_user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        from ai.services.quota_service import QuotaService
        summary = QuotaService.get_usage_summary(target_user, role_view='admin')

        # Add lifetime stats from DB
        records = AIUsageRecord.objects.filter(user=target_user)
        lifetime = records.aggregate(
            total_requests=Sum('lifetime_requests'),
            total_tokens=Sum('lifetime_tokens'),
        )

        summary['lifetime_requests'] = lifetime['total_requests'] or 0
        summary['lifetime_tokens'] = lifetime['total_tokens'] or 0
        summary['username'] = target_user.username
        summary['role'] = getattr(target_user, 'role', 'unknown')

        return Response(summary)


# ═══════════════════════════════════════════════════════════════════════════════
# AI REQUEST LOGS (Admin Only)
# ═══════════════════════════════════════════════════════════════════════════════

class AIRequestLogListView(ListAPIView):
    """
    GET: Filterable AI request logs.

    Filters: user, date, provider, model, status
    """
    permission_classes = [CanViewAILogs]
    serializer_class = AIRequestLogAdminSerializer

    def get_queryset(self):
        qs = AIRequestLog.objects.select_related('user').order_by('-timestamp')

        # Apply filters
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(user_id=user_id)

        start_date = self.request.query_params.get('start_date')
        if start_date:
            try:
                qs = qs.filter(timestamp__date__gte=date.fromisoformat(start_date))
            except ValueError:
                pass

        end_date = self.request.query_params.get('end_date')
        if end_date:
            try:
                qs = qs.filter(timestamp__date__lte=date.fromisoformat(end_date))
            except ValueError:
                pass

        provider = self.request.query_params.get('provider')
        if provider:
            qs = qs.filter(provider=provider)

        model_name = self.request.query_params.get('model')
        if model_name:
            qs = qs.filter(model_name=model_name)

        log_status = self.request.query_params.get('status')
        if log_status:
            qs = qs.filter(status=log_status)

        return qs[:500]  # Cap at 500 results


# ═══════════════════════════════════════════════════════════════════════════════
# AI AUDIT LOGS (Admin Only, Read-Only)
# ═══════════════════════════════════════════════════════════════════════════════

class AIAuditLogListView(ListAPIView):
    """GET: Read-only audit trail of admin actions."""
    permission_classes = [CanViewAILogs]
    serializer_class = AIAuditLogSerializer

    def get_queryset(self):
        qs = AIAuditLog.objects.select_related('admin_user').order_by('-timestamp')

        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)

        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            qs = qs.filter(entity_type=entity_type)

        return qs[:500]


# ═══════════════════════════════════════════════════════════════════════════════
# AI ANALYTICS DASHBOARD (Admin Only)
# ═══════════════════════════════════════════════════════════════════════════════

class AIAnalyticsDashboardView(APIView):
    """
    GET: Admin analytics dashboard data.

    Returns widgets: total requests, tokens, active users, most active user,
    avg response time, failed/blocked requests, most used model, estimated cost.
    """
    permission_classes = [CanViewAIAnalytics]

    def get(self, request):
        today = timezone.now().date()
        today_start = timezone.make_aware(
            timezone.datetime(today.year, today.month, today.day),
            timezone.get_current_timezone(),
        )

        logs_today = AIRequestLog.objects.filter(
            timestamp__gte=today_start, is_archived=False,
        )

        agg = logs_today.aggregate(
            total_requests=Count('id'),
            total_tokens=Sum('total_tokens'),
            avg_response=Avg('response_time_ms'),
            failed=Count('id', filter=Q(status='failed')),
            blocked=Count('id', filter=Q(status='blocked')),
            throttled=Count('id', filter=Q(status='throttled')),
        )

        active_users = logs_today.values('user').distinct().count()

        # Most active user
        most_active = (
            logs_today
            .values('user__username')
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
        )

        # Most used model
        most_used_model = (
            logs_today
            .exclude(model_name='')
            .values('model_name')
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
        )

        # Estimated cost (sum of token costs from AIModel config)
        total_tokens = agg['total_tokens'] or 0
        # Simple estimate: use average cost per token if models have cost info
        estimated_cost = 0.0
        try:
            avg_cost = AIModel.objects.filter(status='active').aggregate(
                avg_input=Avg('cost_per_input_token'),
                avg_output=Avg('cost_per_output_token'),
            )
            avg_rate = float(avg_cost['avg_input'] or 0) + float(avg_cost['avg_output'] or 0)
            estimated_cost = total_tokens * avg_rate / 2  # Rough estimate
        except Exception:
            pass

        data = {
            'total_requests_today': agg['total_requests'] or 0,
            'total_tokens_today': total_tokens,
            'active_users_today': active_users,
            'most_active_user': {
                'username': most_active['user__username'],
                'count': most_active['count'],
            } if most_active else None,
            'average_response_time_ms': round(agg['avg_response'] or 0, 1),
            'failed_requests_today': agg['failed'] or 0,
            'blocked_requests_today': (agg['blocked'] or 0) + (agg['throttled'] or 0),
            'most_used_model': most_used_model['model_name'] if most_used_model else '',
            'estimated_cost_today': round(estimated_cost, 6),
        }

        return Response(data)


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTS / EXPORT (CSV)
# ═══════════════════════════════════════════════════════════════════════════════

class AIReportExportView(APIView):
    """
    GET: Export AI usage reports as CSV.

    Query params:
        report_type: daily, monthly, university, role, user, tokens
        start_date: YYYY-MM-DD
        end_date: YYYY-MM-DD
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        import csv
        from io import StringIO

        report_type = request.query_params.get('report_type', 'daily')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        try:
            start = date.fromisoformat(start_date) if start_date else date.today() - timedelta(days=30)
            end = date.fromisoformat(end_date) if end_date else date.today()
        except ValueError:
            return Response({'error': 'Invalid date format.'}, status=status.HTTP_400_BAD_REQUEST)

        logs = AIRequestLog.objects.filter(
            timestamp__date__gte=start,
            timestamp__date__lte=end,
            is_archived=False,
        )

        output = StringIO()
        writer = csv.writer(output)

        if report_type == 'daily':
            writer.writerow(['Date', 'Total Requests', 'Total Tokens', 'Active Users', 'Failed', 'Blocked'])
            daily = (
                logs.values('timestamp__date')
                .annotate(
                    total=Count('id'),
                    tokens=Sum('total_tokens'),
                    users=Count('user', distinct=True),
                    failed=Count('id', filter=Q(status='failed')),
                    blocked=Count('id', filter=Q(status__in=['blocked', 'throttled'])),
                )
                .order_by('timestamp__date')
            )
            for row in daily:
                writer.writerow([
                    row['timestamp__date'], row['total'], row['tokens'] or 0,
                    row['users'], row['failed'], row['blocked'],
                ])

        elif report_type == 'role':
            writer.writerow(['Role', 'Total Requests', 'Total Tokens', 'Active Users'])
            by_role = (
                logs.values('role_snapshot')
                .annotate(
                    total=Count('id'),
                    tokens=Sum('total_tokens'),
                    users=Count('user', distinct=True),
                )
                .order_by('role_snapshot')
            )
            for row in by_role:
                writer.writerow([
                    row['role_snapshot'] or 'unknown', row['total'],
                    row['tokens'] or 0, row['users'],
                ])

        elif report_type == 'user':
            writer.writerow(['User', 'Role', 'Total Requests', 'Total Tokens', 'Avg Response (ms)'])
            by_user = (
                logs.values('user__username', 'role_snapshot')
                .annotate(
                    total=Count('id'),
                    tokens=Sum('total_tokens'),
                    avg_resp=Avg('response_time_ms'),
                )
                .order_by('-total')[:100]
            )
            for row in by_user:
                writer.writerow([
                    row['user__username'] or 'deleted', row['role_snapshot'],
                    row['total'], row['tokens'] or 0, round(row['avg_resp'] or 0, 1),
                ])

        elif report_type == 'tokens':
            writer.writerow(['Date', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Estimated Cost'])
            by_date = (
                logs.values('timestamp__date')
                .annotate(
                    input_tok=Sum('input_tokens'),
                    output_tok=Sum('output_tokens'),
                    total_tok=Sum('total_tokens'),
                )
                .order_by('timestamp__date')
            )
            for row in by_date:
                writer.writerow([
                    row['timestamp__date'],
                    row['input_tok'] or 0, row['output_tok'] or 0,
                    row['total_tok'] or 0, 0.0,  # Cost estimation placeholder
                ])

        else:
            writer.writerow(['Error'])
            writer.writerow([f'Unknown report type: {report_type}'])

        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="ai_report_{report_type}_{start}_{end}.csv"'
        return response
