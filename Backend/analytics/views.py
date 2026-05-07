from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsStudent
from .services import StudentAnalyticsService

class BaseStudentAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get_service(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        return StudentAnalyticsService(request.user, start_date, end_date)

class StudentAnalyticsSummaryView(BaseStudentAnalyticsView):
    def get(self, request):
        service = self.get_service(request)
        return Response(service.get_summary_stats())

class StudentStudyDistributionView(BaseStudentAnalyticsView):
    def get(self, request):
        service = self.get_service(request)
        return Response(service.get_study_distribution())

class StudentCourseDistributionView(BaseStudentAnalyticsView):
    def get(self, request):
        service = self.get_service(request)
        return Response(service.get_course_distribution())

class StudentTimeOfDayView(BaseStudentAnalyticsView):
    def get(self, request):
        service = self.get_service(request)
        return Response(service.get_time_of_day_analysis())

class StudentFocusModeAnalyticsView(BaseStudentAnalyticsView):
    def get(self, request):
        service = self.get_service(request)
        return Response(service.get_focus_mode_analytics())

class StudentAILearningInsightsView(BaseStudentAnalyticsView):
    def get(self, request):
        service = self.get_service(request)
        return Response(service.get_ai_learning_insights())

class StudentSmartInsightsView(BaseStudentAnalyticsView):
    def get(self, request):
        service = self.get_service(request)
        return Response(service.get_smart_insights())

class StudentAllAnalyticsView(BaseStudentAnalyticsView):
    def get(self, request):
        service = self.get_service(request)
        return Response(service.get_all_analytics())
