from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from accounts.permissions import IsAdmin
from .models import Course, Subject, Topic, Content, Enrollment, Progress
from .serializers import (
    CourseSerializer,
    CourseListSerializer,
    SubjectSerializer,
    SubjectListSerializer,
    TopicSerializer,
    TopicListSerializer,
    ContentSerializer,
    EnrollmentSerializer,
    ProgressSerializer,
)


class IsAdminOrReadOnly(IsAuthenticated):
    """
    Admin users can do anything.
    Authenticated students can only read (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        # First check that the user is authenticated
        is_authenticated = super().has_permission(request, view)
        if not is_authenticated:
            return False

        # Read-only methods are allowed for any authenticated user
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True

        # Write methods are only allowed for admins
        return request.user.role == 'admin'


# ---------- Course ----------
class CourseViewSet(viewsets.ModelViewSet):
    """
    CRUD for Courses.
    - Any authenticated user can list / retrieve.
    - Only admins can create / update / delete.
    - Students see only public courses + courses they are enrolled in.
    - Admins see all courses.

    Search:  ?search=python  (searches name and description)
    Filter:  ?is_public=true
    Order:   ?ordering=-created_at  or  ?ordering=name
    """
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']
    filterset_fields = ['is_public']

    def get_queryset(self):
        user = self.request.user
        qs = Course.objects.all()

        # Students only see public courses + their enrolled courses
        if user.role == 'student':
            qs = qs.filter(
                Q(is_public=True) | Q(enrollments__student=user)
            ).distinct()

        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        # Automatically set the course creator to the logged-in admin
        serializer.save(created_by=self.request.user)

    # ---- Enrollment Actions ----

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        """
        POST /api/courses/{id}/enroll/
        Enroll the current student in this course.
        """
        course = self.get_object()

        # Only students can enroll
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can enroll in courses.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if already enrolled
        if Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response(
                {'error': 'You are already enrolled in this course.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment = Enrollment.objects.create(
            student=request.user,
            course=course,
        )
        serializer = EnrollmentSerializer(enrollment)
        return Response(
            {'message': f'Successfully enrolled in {course.name}.', 'enrollment': serializer.data},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unenroll(self, request, pk=None):
        """
        POST /api/courses/{id}/unenroll/
        Remove the current student from this course.
        """
        course = self.get_object()

        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can unenroll from courses.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        enrollment = Enrollment.objects.filter(
            student=request.user, course=course
        ).first()

        if not enrollment:
            return Response(
                {'error': 'You are not enrolled in this course.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment.delete()
        return Response(
            {'message': f'Successfully unenrolled from {course.name}.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def students(self, request, pk=None):
        """
        GET /api/courses/{id}/students/
        List all students enrolled in this course (admin only).
        """
        course = self.get_object()

        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can view enrolled students.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        enrollments = Enrollment.objects.filter(course=course)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def analytics(self, request, pk=None):
        """
        GET /api/courses/{id}/analytics/
        Admin view for course engagement analytics.
        """
        course = self.get_object()

        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can view course analytics.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        total_enrollments = course.enrollments.count()
        total_content = Content.objects.filter(topic__subject__course=course).count()
        total_completions = Progress.objects.filter(content__topic__subject__course=course).count()

        return Response({
            'course': course.name,
            'total_enrollments': total_enrollments,
            'total_content_items': total_content,
            'total_content_completions': total_completions,
        })


# ---------- My Courses (Student's enrolled courses) ----------
class MyCoursesView(generics.ListAPIView):
    """
    GET /api/my-courses/
    Lists all courses the current student is enrolled in.
    """
    serializer_class = CourseListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Course.objects.filter(
            enrollments__student=self.request.user
        ).order_by('-enrollments__enrolled_at')


# ---------- Subject ----------
class SubjectViewSet(viewsets.ModelViewSet):
    """
    CRUD for Subjects.
    Filter: ?course=<id>
    Order:  ?ordering=name
    """
    queryset = Subject.objects.all().order_by('id')
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'id']
    filterset_fields = ['course']

    def get_serializer_class(self):
        if self.action == 'list':
            return SubjectListSerializer
        return SubjectSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs


# ---------- Topic ----------
class TopicViewSet(viewsets.ModelViewSet):
    """
    CRUD for Topics.
    Filter: ?subject=<id>
    Order:  ?ordering=name
    """
    queryset = Topic.objects.all().order_by('id')
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'id']
    filterset_fields = ['subject']

    def get_serializer_class(self):
        if self.action == 'list':
            return TopicListSerializer
        return TopicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        return qs


# ---------- Content ----------
class ContentViewSet(viewsets.ModelViewSet):
    """
    CRUD for Content.
    Filter: ?topic=<id>  ?content_type=video
    Order:  ?ordering=-created_at
    """
    queryset = Content.objects.all().order_by('-created_at')
    serializer_class = ContentSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['title']
    ordering_fields = ['title', 'created_at']
    filterset_fields = ['topic', 'content_type']

    def get_queryset(self):
        qs = super().get_queryset()
        topic_id = self.request.query_params.get('topic')
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_complete(self, request, pk=None):
        """
        POST /api/contents/{id}/mark_complete/
        Mark a content item as completed by the student.
        """
        content = self.get_object()

        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can mark content as complete.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        progress, created = Progress.objects.get_or_create(
            student=request.user,
            content=content,
        )

        if created:
            return Response(
                {'message': f'Marked "{content.title}" as complete.'},
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {'message': 'Content was already marked as complete.'},
            status=status.HTTP_200_OK,
        )


# ---------- Dashboard (Student) ----------
class DashboardView(generics.RetrieveAPIView):
    """
    GET /api/dashboard/
    Student dashboard with progress % and recent activity.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students have a dashboard.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        enrolled_courses = Course.objects.filter(enrollments__student=request.user)
        total_content_in_enrolled = Content.objects.filter(topic__subject__course__in=enrolled_courses).count()
        completed_content = Progress.objects.filter(student=request.user).count()

        progress_percentage = 0
        if total_content_in_enrolled > 0:
            progress_percentage = round((completed_content / total_content_in_enrolled) * 100, 2)

        recent_activity = Progress.objects.filter(student=request.user).order_by('-completed_at')[:5]
        serializer = ProgressSerializer(recent_activity, many=True)

        return Response({
            'enrolled_courses_count': enrolled_courses.count(),
            'total_content_to_complete': total_content_in_enrolled,
            'completed_content_count': completed_content,
            'overall_progress_percentage': progress_percentage,
            'recent_activity': serializer.data,
        })


class MyCompletedContentView(generics.ListAPIView):
    """
    GET /api/my-completed-content/
    Lists all progress/completed content records for the student.
    """
    serializer_class = ProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Progress.objects.filter(
            student=self.request.user
        ).order_by('-completed_at')


class MyTotalContentView(generics.ListAPIView):
    """
    GET /api/my-total-content/
    Lists all content items inside the courses the student is enrolled in.
    """
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        enrolled_courses = Course.objects.filter(enrollments__student=self.request.user)
        return Content.objects.filter(
            topic__subject__course__in=enrolled_courses
        ).order_by('topic__subject__course__name', 'topic__name', 'title')


# ---------- Progress History (time-series for graph) ----------
class ProgressHistoryView(generics.GenericAPIView):
    """
    GET /api/progress-history/?days=7
    Returns daily cumulative progress % for the authenticated student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        now = timezone.now()
        
        all_progress = Progress.objects.filter(student=request.user)
        
        if days == 0:
            # "All" time tab selected — find earliest progress record
            first_progress = all_progress.order_by('completed_at').first()
            if first_progress:
                start_date = first_progress.completed_at.date()
                days = (now.date() - start_date).days
                # Ensure we show at least a 7-day window even if they just started
                if days < 7:
                    days = 7
                    start_date = (now - timedelta(days=7)).date()
            else:
                # Default to 30 days if no progress yet
                days = 30
                start_date = (now - timedelta(days=30)).date()
        else:
            start_date = (now - timedelta(days=days)).date()

        enrolled_courses = Course.objects.filter(enrollments__student=request.user)
        total_content = Content.objects.filter(
            topic__subject__course__in=enrolled_courses
        ).count()

        if total_content == 0:
            result = []
            for i in range(days + 1):
                d = start_date + timedelta(days=i)
                if d <= now.date():
                    result.append({'date': d.isoformat(), 'progress': 0})
            return Response({
                "history": result,
                "period_completed": 0,
                "total_content": 0,
                "period_progress_gained": 0
            })

        result = []
        for i in range(days + 1):
            d = start_date + timedelta(days=i)
            if d > now.date():
                break
            completed_by_day = all_progress.filter(completed_at__date__lte=d).count()
            pct = round((completed_by_day / total_content) * 100, 1)
            result.append({'date': d.isoformat(), 'progress': pct})

        start_completions = all_progress.filter(completed_at__date__lt=start_date).count()
        end_completions = all_progress.filter(completed_at__date__lte=now.date()).count()
        period_completed = end_completions - start_completions
        period_gained = round((period_completed / total_content) * 100, 1)

        return Response({
            "history": result,
            "period_completed": period_completed,
            "total_content": total_content,
            "period_progress_gained": period_gained
        })
