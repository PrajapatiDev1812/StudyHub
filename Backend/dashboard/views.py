from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsStudent
from .services import DashboardService

class BaseDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get_service(self, request):
        return DashboardService(request.user)

class DashboardSummaryView(BaseDashboardView):
    def get(self, request):
        return Response(self.get_service(request).get_summary())

class DashboardWeeklyActivityView(BaseDashboardView):
    def get(self, request):
        return Response(self.get_service(request).get_weekly_activity())

class DashboardRecentActivityView(BaseDashboardView):
    def get(self, request):
        return Response(self.get_service(request).get_recent_activity())

class DashboardContinueLearningView(BaseDashboardView):
    def get(self, request):
        return Response(self.get_service(request).get_continue_learning())

class DashboardInsightsView(BaseDashboardView):
    def get(self, request):
        return Response(self.get_service(request).get_smart_insights())

class DashboardAISummaryView(BaseDashboardView):
    def get(self, request):
        return Response(self.get_service(request).get_ai_summary())
