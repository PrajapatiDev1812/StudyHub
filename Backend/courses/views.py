# pyrefly: ignore [missing-import]
from rest_framework import viewsets, status, generics, filters
# pyrefly: ignore [missing-import]
from rest_framework.decorators import action
# pyrefly: ignore [missing-import]
from rest_framework.permissions import IsAuthenticated
# pyrefly: ignore [missing-import]
from rest_framework.response import Response
# pyrefly: ignore [missing-import]
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# pyrefly: ignore [missing-import]
from django.db.models import Q
# pyrefly: ignore [missing-import]
from django.utils import timezone
from datetime import timedelta
import django_filters
from django.db.models import Count, Q

# pyrefly: ignore [missing-import]
from accounts.permissions import IsAdmin, IsStudent, IsAdminOrReadOnly
# pyrefly: ignore [missing-import]
from .models import Course, CourseCategory, Subject, Topic, Material, Content, Enrollment, Progress
# pyrefly: ignore [import-import]
from .serializers import (
    CourseSerializer, CourseListSerializer, CourseCategorySerializer,
    SubjectSerializer, SubjectListSerializer,
    TopicSerializer, TopicListSerializer,
    MaterialSerializer, MaterialListSerializer,
    ContentSerializer, EnrollmentSerializer, ProgressSerializer,
    ReorderSerializer,
)


# ── Course Filter ─────────────────────────────────────────────────────────────

class CourseFilter(django_filters.FilterSet):
    level = django_filters.ChoiceFilter(choices=Course.LEVEL_CHOICES)
    duration = django_filters.ChoiceFilter(choices=Course.DURATION_CHOICES)
    has_certification = django_filters.BooleanFilter()
    is_published = django_filters.BooleanFilter()
    category = django_filters.NumberFilter(field_name='category__id')
    min_rating = django_filters.NumberFilter(field_name='rating', lookup_expr='gte')
    language = django_filters.CharFilter(field_name='language', lookup_expr='iexact')
    is_free = django_filters.BooleanFilter(method='filter_free')
    recently_added = django_filters.NumberFilter(method='filter_recently_added')

    class Meta:
        model = Course
        fields = ['level', 'duration', 'has_certification', 'is_published', 'category', 'language']

    def filter_free(self, queryset, name, value):
        return queryset.filter(price=0) if value else queryset.filter(price__gt=0)

    def filter_recently_added(self, queryset, name, value):
        cutoff = timezone.now() - timedelta(days=int(value))
        return queryset.filter(created_at__gte=cutoff)


# ── CourseCategory ─────────────────────────────────────────────────────────────

class CourseCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CourseCategory.objects.annotate(
        course_count=Count('courses', filter=Q(courses__is_published=True), distinct=True)
    )
    serializer_class = CourseCategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


# ── Course ─────────────────────────────────────────────────────────────────────

class CourseViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for Courses with statistics, enrollment, and publish actions.
    Search:    ?search=python
    Filters:   ?level=beginner ?category=1 ?is_published=true
    Ordering:  ?ordering=-rating ?ordering=-popularity_score
    """
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['title', 'description', 'language']
    ordering_fields = ['title', 'created_at', 'rating', 'popularity_score', 'price']
    ordering = ['-created_at']
    filterset_class = CourseFilter
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = Course.objects.select_related('category', 'created_by').prefetch_related('subjects', 'enrollments').annotate(
            topics_count=Count('subjects__topics', distinct=True),
            materials_count=Count('subjects__topics__materials', distinct=True),
        )

        if user.role == 'student':
            qs = qs.filter(
                Q(is_published=True) | Q(enrollments__student=user)
            ).distinct()

        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def publish(self, request, pk=None):
        course = self.get_object()
        course.is_published = True
        course.save()
        return Response({'message': f'"{course.title}" is now published.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def unpublish(self, request, pk=None):
        course = self.get_object()
        course.is_published = False
        course.save()
        return Response({'message': f'"{course.title}" has been unpublished.'})

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def enroll(self, request, pk=None):
        course = self.get_object()
        if Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'error': 'You are already enrolled in this course.'}, status=status.HTTP_400_BAD_REQUEST)
        enrollment = Enrollment.objects.create(student=request.user, course=course)
        serializer = EnrollmentSerializer(enrollment)
        return Response({'message': f'Successfully enrolled in {course.title}.', 'enrollment': serializer.data}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def unenroll(self, request, pk=None):
        course = self.get_object()
        enrollment = Enrollment.objects.filter(student=request.user, course=course).first()
        if not enrollment:
            return Response({'error': 'You are not enrolled in this course.'}, status=status.HTTP_400_BAD_REQUEST)
        enrollment.delete()
        return Response({'message': f'Successfully unenrolled from {course.title}.'})

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
    def students(self, request, pk=None):
        course = self.get_object()
        enrollments = Enrollment.objects.filter(course=course).select_related('student')
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)


# ── Subject ───────────────────────────────────────────────────────────────────

class SubjectViewSet(viewsets.ModelViewSet):
    """
    CRUD for Subjects.
    Filter: ?course=<id>
    Ordering: ?ordering=order
    """
    queryset = Subject.objects.select_related('course').prefetch_related('topics').annotate(
        materials_count=Count('topics__materials', distinct=True)
    ).order_by('order', 'created_at')
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'order', 'created_at']
    filterset_fields = ['course', 'is_published']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        return SubjectListSerializer if self.action == 'list' else SubjectSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'student':
            qs = qs.filter(
                Q(course__is_published=True) | Q(course__enrollments__student=user)
            ).distinct()
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def reorder(self, request):
        """POST /api/subjects/reorder/ — accepts {ids: [1,2,3]} to set order."""
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        ids = list(set(serializer.validated_data['ids']))
        owned_count = Subject.objects.filter(id__in=ids, course__created_by=request.user).count()
        if owned_count != len(ids):
            return Response({'error': 'Unauthorized to reorder one or more items.'}, status=status.HTTP_403_FORBIDDEN)
            
        for index, subject_id in enumerate(serializer.validated_data['ids']):
            Subject.objects.filter(pk=subject_id).update(order=index)
        return Response({'message': 'Subjects reordered successfully.'})


# ── Topic ─────────────────────────────────────────────────────────────────────

class TopicViewSet(viewsets.ModelViewSet):
    """
    CRUD for Topics.
    Filter: ?subject=<id>  ?course=<id> (cross-filter)
    """
    queryset = Topic.objects.select_related('subject__course').prefetch_related('materials', 'contents').annotate(
        materials_count=Count('materials', distinct=True)
    ).order_by('order', 'created_at')
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'order', 'created_at']
    filterset_fields = ['subject', 'is_published', 'difficulty']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        return TopicListSerializer if self.action == 'list' else TopicSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'student':
            qs = qs.filter(
                Q(subject__course__is_published=True) | Q(subject__course__enrollments__student=user)
            ).distinct()
        subject_id = self.request.query_params.get('subject')
        course_id = self.request.query_params.get('course')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if course_id:
            qs = qs.filter(subject__course_id=course_id)
        return qs

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def reorder(self, request):
        """POST /api/topics/reorder/ — accepts {ids: [1,2,3]} to set order."""
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        ids = list(set(serializer.validated_data['ids']))
        owned_count = Topic.objects.filter(id__in=ids, subject__course__created_by=request.user).count()
        if owned_count != len(ids):
            return Response({'error': 'Unauthorized to reorder one or more items.'}, status=status.HTTP_403_FORBIDDEN)
            
        for index, topic_id in enumerate(serializer.validated_data['ids']):
            Topic.objects.filter(pk=topic_id).update(order=index)
        return Response({'message': 'Topics reordered successfully.'})


# ── Material ──────────────────────────────────────────────────────────────────

class MaterialViewSet(viewsets.ModelViewSet):
    """
    CRUD for Materials (upgraded Content).
    Filter: ?topic=<id>  ?material_type=video  ?subject=<id>  ?course=<id>
    """
    queryset = Material.objects.select_related('topic__subject__course').order_by('order', 'created_at')
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'order', 'created_at']
    filterset_fields = ['topic', 'material_type', 'is_published', 'is_downloadable']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        return MaterialListSerializer if self.action == 'list' else MaterialSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'student':
            qs = qs.filter(
                Q(topic__subject__course__is_published=True) | Q(topic__subject__course__enrollments__student=user)
            ).distinct()
        topic_id = self.request.query_params.get('topic')
        subject_id = self.request.query_params.get('subject')
        course_id = self.request.query_params.get('course')
        material_type = self.request.query_params.get('material_type')
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        if subject_id:
            qs = qs.filter(topic__subject_id=subject_id)
        if course_id:
            qs = qs.filter(topic__subject__course_id=course_id)
        if material_type:
            qs = qs.filter(material_type=material_type)
        return qs

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def reorder(self, request):
        """POST /api/materials/reorder/ — accepts {ids: [1,2,3]} to set order."""
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        ids = list(set(serializer.validated_data['ids']))
        owned_count = Material.objects.filter(id__in=ids, topic__subject__course__created_by=request.user).count()
        if owned_count != len(ids):
            return Response({'error': 'Unauthorized to reorder one or more items.'}, status=status.HTTP_403_FORBIDDEN)
            
        for index, mat_id in enumerate(serializer.validated_data['ids']):
            Material.objects.filter(pk=mat_id).update(order=index)
        return Response({'message': 'Materials reordered successfully.'})

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def track_view(self, request, pk=None):
        material = self.get_object()
        material.view_count += 1
        material.save(update_fields=['view_count'])
        return Response({'view_count': material.view_count})


# ── Content (Legacy) ──────────────────────────────────────────────────────────

class ContentViewSet(viewsets.ModelViewSet):
    """Legacy endpoint kept for backward compatibility."""
    queryset = Content.objects.select_related('topic__subject__course').order_by('-created_at')
    serializer_class = ContentSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['title']
    ordering_fields = ['title', 'created_at']
    filterset_fields = ['topic', 'content_type']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'student':
            qs = qs.filter(
                Q(topic__subject__course__is_published=True) | Q(topic__subject__course__enrollments__student=user)
            ).distinct()
        topic_id = self.request.query_params.get('topic')
        if topic_id:
            qs = qs.filter(topic_id=topic_id)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def mark_complete(self, request, pk=None):
        content = self.get_object()
        progress, created = Progress.objects.get_or_create(student=request.user, content=content)
        if created:
            try:
                from gamification.services import track_event
                unlocked_badges = track_event(request.user, 'task_complete')
                response_data = {'message': f'Marked "{content.title}" as complete.'}
                if unlocked_badges:
                    response_data['badge_unlocked'] = True
                    response_data['badge'] = {
                        "name": unlocked_badges[0].name,
                        "description": unlocked_badges[0].description,
                        "icon": unlocked_badges[0].icon.url if unlocked_badges[0].icon else None,
                        "xp": unlocked_badges[0].xp_reward,
                    }
                return Response(response_data, status=status.HTTP_201_CREATED)
            except Exception:
                return Response({'message': f'Marked "{content.title}" as complete.'}, status=status.HTTP_201_CREATED)
        return Response({'message': 'Already complete.', 'badge_unlocked': False})


# ── Dashboard ─────────────────────────────────────────────────────────────────

class MyCoursesView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Count, Q
        user = self.request.user
        return (
            Course.objects
            .filter(enrollments__student=user)
            .select_related('category', 'created_by')
            .prefetch_related('subjects', 'enrollments')
            .annotate(
                topics_count=Count('subjects__topics', distinct=True),
                materials_count=Count('subjects__topics__materials', distinct=True),
            )
            .order_by('-enrollments__enrolled_at')
        )


class DashboardView(generics.RetrieveAPIView):
    permission_classes = [IsStudent]

    def get(self, request, *args, **kwargs):
        enrolled_courses = Course.objects.filter(enrollments__student=request.user)
        total_content = Content.objects.filter(topic__subject__course__in=enrolled_courses).count()
        completed_content = Progress.objects.filter(student=request.user).count()
        progress_percentage = round((completed_content / total_content) * 100, 2) if total_content > 0 else 0
        recent_activity = Progress.objects.filter(student=request.user).order_by('-completed_at')[:5]
        serializer = ProgressSerializer(recent_activity, many=True)
        return Response({
            'enrolled_courses_count': enrolled_courses.count(),
            'total_content_to_complete': total_content,
            'completed_content_count': completed_content,
            'overall_progress_percentage': progress_percentage,
            'recent_activity': serializer.data,
        })


class MyCompletedContentView(generics.ListAPIView):
    serializer_class = ProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Progress.objects.filter(student=self.request.user).order_by('-completed_at')


class MyTotalContentView(generics.ListAPIView):
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        enrolled_courses = Course.objects.filter(enrollments__student=self.request.user)
        return Content.objects.filter(
            topic__subject__course__in=enrolled_courses
        ).order_by('topic__subject__course__title', 'topic__title', 'title')


class ProgressHistoryView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            days = int(request.query_params.get('days', 7))
            if days < 0 or days > 365:
                raise ValueError
        except ValueError:
            return Response({"error": "Invalid days parameter. Must be an integer between 0 and 365."}, status=status.HTTP_400_BAD_REQUEST)
        now = timezone.now()
        all_progress = Progress.objects.filter(student=request.user)

        course_id = request.query_params.get('course')
        if course_id:
            try:
                course_id = int(course_id)
                if not Course.objects.filter(enrollments__student=request.user, id=course_id).exists():
                    return Response({"error": "You are not enrolled in this course."}, status=status.HTTP_403_FORBIDDEN)
                enrolled_courses = Course.objects.filter(id=course_id)
                all_progress = all_progress.filter(content__topic__subject__course_id=course_id)
            except ValueError:
                return Response({"error": "Invalid course ID parameter."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            enrolled_courses = Course.objects.filter(enrollments__student=request.user)

        if days == 0:
            first_progress = all_progress.order_by('completed_at').first()
            if first_progress:
                start_date = first_progress.completed_at.date()
                days = max((now.date() - start_date).days, 7)
            else:
                days = 30
            start_date = (now - timedelta(days=days)).date()
        else:
            start_date = (now - timedelta(days=days)).date()

        total_content = Content.objects.filter(topic__subject__course__in=enrolled_courses).count()

        result = []
        for i in range(days + 1):
            d = start_date + timedelta(days=i)
            if d > now.date():
                break
            completed_by_day = all_progress.filter(completed_at__date__lte=d).count()
            pct = round((completed_by_day / total_content) * 100, 1) if total_content > 0 else 0
            result.append({'date': d.isoformat(), 'progress': pct})

        start_completions = all_progress.filter(completed_at__date__lt=start_date).count()
        end_completions = all_progress.count()
        period_completed = end_completions - start_completions
        period_gained = round((period_completed / total_content) * 100, 1) if total_content > 0 else 0

        return Response({
            "history": result,
            "period_completed": period_completed,
            "total_content": total_content,
            "period_progress_gained": period_gained,
        })
