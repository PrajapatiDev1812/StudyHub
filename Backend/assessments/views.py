from decimal import Decimal

from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdmin
from .models import Test, Question, Option, StudentAttempt, StudentAnswer
from .serializers import (
    TestSerializer,
    TestListSerializer,
    TestStudentSerializer,
    QuestionSerializer,
    OptionSerializer,
    SubmitTestSerializer,
    StudentAttemptSerializer,
    StudentAttemptListSerializer,
)


class IsAdminOrReadOnly(IsAuthenticated):
    """Admin can do everything, students can only read."""

    def has_permission(self, request, view):
        is_authenticated = super().has_permission(request, view)
        if not is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role == 'admin'


# ---------- Test ViewSet ----------
class TestViewSet(viewsets.ModelViewSet):
    """
    CRUD for Tests/Quizzes.
    - Admin: full CRUD + view analytics.
    - Student: list/retrieve (without correct answers) + take test.

    Filter: ?topic=<id>  ?is_active=true
    Search: ?search=python
    """
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at']
    ordering = ['-created_at']
    filterset_fields = ['topic', 'is_active']

    def get_queryset(self):
        qs = Test.objects.all()
        # Students only see active tests
        if self.request.user.role == 'student':
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return TestListSerializer
        # Students get a serializer that hides correct answers
        if self.request.user.role == 'student':
            return TestStudentSerializer
        return TestSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # ---- Student takes a test ----
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def submit(self, request, pk=None):
        """
        POST /api/tests/{id}/submit/
        Student submits their answers and gets auto-graded.

        Request body:
        {
            "answers": [
                {"question_id": 1, "selected_option_id": 3},
                {"question_id": 2, "selected_option_id": 7}
            ]
        }
        """
        test = self.get_object()

        # Only students can take tests
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can submit tests.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate submission data
        serializer = SubmitTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submitted_answers = serializer.validated_data['answers']

        # Create the attempt record
        attempt = StudentAttempt.objects.create(
            student=request.user,
            test=test,
        )

        # ---- AUTO-GRADING ----
        total_marks_possible = 0
        total_marks_obtained = 0

        for answer_data in submitted_answers:
            question_id = answer_data['question_id']
            selected_option_id = answer_data['selected_option_id']

            try:
                question = Question.objects.get(id=question_id, test=test)
            except Question.DoesNotExist:
                continue  # Skip invalid question IDs

            try:
                selected_option = Option.objects.get(id=selected_option_id, question=question)
            except Option.DoesNotExist:
                continue  # Skip invalid option IDs

            is_correct = selected_option.is_correct
            total_marks_possible += question.marks
            if is_correct:
                total_marks_obtained += question.marks

            # Save each answer
            StudentAnswer.objects.create(
                attempt=attempt,
                question=question,
                selected_option=selected_option,
                is_correct=is_correct,
            )

        # Calculate score percentage
        if total_marks_possible > 0:
            score = Decimal(total_marks_obtained) / Decimal(total_marks_possible) * 100
        else:
            score = Decimal('0.00')

        # Update attempt with results
        attempt.total_marks_obtained = total_marks_obtained
        attempt.total_marks_possible = total_marks_possible
        attempt.score = round(score, 2)
        attempt.passed = score >= test.passing_score
        attempt.completed_at = timezone.now()
        attempt.save()

        # Return results
        result_serializer = StudentAttemptSerializer(attempt)
        return Response(
            {
                'message': 'Test submitted successfully!',
                'result': result_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ---- Test Analytics (Admin) ----
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def analytics(self, request, pk=None):
        """
        GET /api/tests/{id}/analytics/
        Admin views test statistics.
        """
        test = self.get_object()

        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can view analytics.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        attempts = StudentAttempt.objects.filter(test=test, completed_at__isnull=False)
        total_attempts = attempts.count()

        if total_attempts == 0:
            return Response({
                'test': test.title,
                'total_attempts': 0,
                'message': 'No students have taken this test yet.',
            })

        stats = attempts.aggregate(
            average_score=Avg('score'),
            passed_count=Count('id', filter=Q(passed=True)),
        )

        return Response({
            'test': test.title,
            'total_attempts': total_attempts,
            'average_score': round(stats['average_score'], 2) if stats['average_score'] else 0,
            'pass_count': stats['passed_count'],
            'fail_count': total_attempts - stats['passed_count'],
            'pass_rate': round(stats['passed_count'] / total_attempts * 100, 2),
        })


# ---------- Question ViewSet ----------
class QuestionViewSet(viewsets.ModelViewSet):
    """
    CRUD for Questions (admin only for write, any user for read).
    Filter: ?test=<id>
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['test']
    ordering_fields = ['order']

    def get_queryset(self):
        qs = super().get_queryset()
        test_id = self.request.query_params.get('test')
        if test_id:
            qs = qs.filter(test_id=test_id)
        return qs


# ---------- Option ViewSet ----------
class OptionViewSet(viewsets.ModelViewSet):
    """
    CRUD for Options (admin only for write).
    Filter: ?question=<id>
    """
    queryset = Option.objects.all()
    serializer_class = OptionSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['question']

    def get_queryset(self):
        qs = super().get_queryset()
        question_id = self.request.query_params.get('question')
        if question_id:
            qs = qs.filter(question_id=question_id)
        return qs


# ---------- My Attempts (Student) ----------
class MyAttemptsView(generics.ListAPIView):
    """
    GET /api/my-attempts/
    List all test attempts for the current student.
    """
    serializer_class = StudentAttemptListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudentAttempt.objects.filter(
            student=self.request.user
        ).order_by('-started_at')


# ---------- Attempt Detail ----------
class AttemptDetailView(generics.RetrieveAPIView):
    """
    GET /api/attempts/{id}/
    View detailed result of a specific attempt (with all answers).
    """
    serializer_class = StudentAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return StudentAttempt.objects.all()
        # Students can only see their own attempts
        return StudentAttempt.objects.filter(student=user)
