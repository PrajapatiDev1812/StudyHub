from rest_framework import viewsets, status, generics, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from accounts.permissions import IsAdmin
from .models import Course, Subject, Topic, Content, Enrollment
from .serializers import (
    CourseSerializer,
    CourseListSerializer,
    SubjectSerializer,
    SubjectListSerializer,
    TopicSerializer,
    TopicListSerializer,
    ContentSerializer,
    EnrollmentSerializer,
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
