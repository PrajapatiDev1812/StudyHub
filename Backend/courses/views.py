from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import django_filters

from accounts.permissions import IsAdmin, IsStudent, IsAdminOrReadOnly
from .models import Course, CourseCategory, Subject, Topic, Content, Enrollment, Progress
from .serializers import (
    CourseSerializer,
    CourseListSerializer,
    CourseCategorySerializer,
    SubjectSerializer,
    SubjectListSerializer,
    TopicSerializer,
    TopicListSerializer,
    ContentSerializer,
    EnrollmentSerializer,
    ProgressSerializer,
)


# ── Course Filter ─────────────────────────────────────────────────────────────

class CourseFilter(django_filters.FilterSet):
    # Exact filters
    level = django_filters.ChoiceFilter(choices=Course.LEVEL_CHOICES)
    duration = django_filters.ChoiceFilter(choices=Course.DURATION_CHOICES)
    has_certification = django_filters.BooleanFilter()
    is_public = django_filters.BooleanFilter()
    category = django_filters.NumberFilter(field_name='category__id')

    # Range filters
    min_rating = django_filters.NumberFilter(field_name='rating', lookup_expr='gte')
    language = django_filters.CharFilter(field_name='language', lookup_expr='iexact')

    # Price filters
    is_free = django_filters.BooleanFilter(method='filter_free')

    # Recently added (last N days)
    recently_added = django_filters.NumberFilter(method='filter_recently_added')

    class Meta:
        model = Course
        fields = ['level', 'duration', 'has_certification', 'is_public', 'category', 'language']

    def filter_free(self, queryset, name, value):
        if value:
            return queryset.filter(price=0)
        return queryset.filter(price__gt=0)

    def filter_recently_added(self, queryset, name, value):
        cutoff = timezone.now() - timedelta(days=int(value))
        return queryset.filter(created_at__gte=cutoff)



# ---------- Course Category ----------
class CourseCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/categories/  — list all categories with course counts.
    """
    queryset = CourseCategory.objects.all()
    serializer_class = CourseCategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Return all categories (small list)


# ---------- Course ----------
class CourseViewSet(viewsets.ModelViewSet):
    """
    CRUD for Courses.
    - Any authenticated user can list / retrieve.
    - Only admins can create / update / delete.
    - Students see only public courses + courses they are enrolled in.
    - Admins see all courses.

    Search:    ?search=python
    Filters:   ?level=beginner  ?category=1  ?duration=short
               ?min_rating=4  ?is_free=true  ?language=English
               ?has_certification=true  ?recently_added=7
    Ordering:  ?ordering=name  ?ordering=-rating  ?ordering=-popularity_score
    """
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'description', 'language']
    ordering_fields = ['name', 'created_at', 'rating', 'popularity_score', 'price']
    ordering = ['-created_at']
    filterset_class = CourseFilter

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

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def enroll(self, request, pk=None):
        """
        POST /api/courses/{id}/enroll/
        Enroll the current student in this course.
        """
        course = self.get_object()

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

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def unenroll(self, request, pk=None):
        """
        POST /api/courses/{id}/unenroll/
        Remove the current student from this course.
        """
        course = self.get_object()

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

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
    def students(self, request, pk=None):
        """
        GET /api/courses/{id}/students/
        List all students enrolled in this course (admin only).
        """
        course = self.get_object()

        enrollments = Enrollment.objects.filter(course=course)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
    def analytics(self, request, pk=None):
        """
        GET /api/courses/{id}/analytics/
        Admin view for course engagement analytics.
        """
        course = self.get_object()

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

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def mark_complete(self, request, pk=None):
        """
        POST /api/contents/{id}/mark_complete/
        Mark a content item as completed by the student.
        """
        content = self.get_object()

        progress, created = Progress.objects.get_or_create(
            student=request.user,
            content=content,
        )

        if created:
            # Gamification hook
            from gamification.services import track_event
            unlocked_badges = track_event(request.user, 'task_complete')
            
            response_data = {'message': f'Marked "{content.title}" as complete.'}
            if unlocked_badges:
                response_data['badge_unlocked'] = True
                response_data['badge'] = {
                    "name": unlocked_badges[0].name,
                    "description": unlocked_badges[0].description,
                    "icon": unlocked_badges[0].icon.url if unlocked_badges[0].icon else None,
                    "xp": unlocked_badges[0].xp_reward
                }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        return Response(
            {'message': 'Content was already marked as complete.', 'badge_unlocked': False},
            status=status.HTTP_200_OK,
        )


# ---------- Dashboard (Student) ----------
class DashboardView(generics.RetrieveAPIView):
    """
    GET /api/dashboard/
    Student dashboard with progress % and recent activity.
    """
    permission_classes = [IsStudent]

    def get(self, request, *args, **kwargs):
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
