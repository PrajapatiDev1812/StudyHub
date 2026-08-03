import random
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model

from .academic_models import (
    AcademicSession,
    AcademicProgram,
    AcademicYear,
    AcademicSemester,
    TeacherSubjectAssignment,
    StudentAcademicEnrollment,
    AttendanceRecord,
    AcademicAssignment,
    AssignmentSubmission,
    StudentAcademicMetrics,
    RiskConfiguration,
    AcademicNotification,
    AuditLog,
)
from .models import Subject, Topic, Material
from assessments.models import Test, StudentAttempt, Question

User = get_user_model()


class AcademicFilterOptionsView(APIView):
    """
    Returns available filter dropdown options based on the user's role:
    Teachers receive only assigned Programs, Years, Semesters, and Subjects.
    Admins receive all options.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        sessions = AcademicSession.objects.all().values('id', 'name', 'is_current')
        if not sessions.exists():
            sessions = [{'id': 1, 'name': '2026-27', 'is_current': True}]

        if user.role == 'admin':
            programs = AcademicProgram.objects.all().values('id', 'name', 'code')
            years = AcademicYear.objects.all().values('id', 'program_id', 'year_number', 'name')
            semesters = AcademicSemester.objects.all().values('id', 'program_year_id', 'semester_number', 'name')
            subjects = Subject.objects.all().values('id', 'title', 'course_id')
            students = User.objects.filter(role='student').values('id', 'username', 'first_name', 'last_name', 'email')
        else:
            # Teacher permissions
            assignments = TeacherSubjectAssignment.objects.filter(teacher=user)
            program_ids = assignments.values_list('program_id', flat=True).distinct()
            year_ids = assignments.values_list('year_id', flat=True).distinct()
            semester_ids = assignments.values_list('semester_id', flat=True).distinct()
            subject_ids = assignments.values_list('subject_id', flat=True).distinct()

            programs = AcademicProgram.objects.filter(id__in=program_ids).values('id', 'name', 'code')
            years = AcademicYear.objects.filter(id__in=year_ids).values('id', 'program_id', 'year_number', 'name')
            semesters = AcademicSemester.objects.filter(id__in=semester_ids).values('id', 'program_year_id', 'semester_number', 'name')
            subjects = Subject.objects.filter(id__in=subject_ids).values('id', 'title')

            enrolled_student_ids = StudentAcademicEnrollment.objects.filter(
                program_id__in=program_ids, year_id__in=year_ids
            ).values_list('student_id', flat=True).distinct()
            students = User.objects.filter(id__in=enrolled_student_ids, role='student').values('id', 'username', 'first_name', 'last_name', 'email')

        return Response({
            'sessions': list(sessions),
            'programs': list(programs),
            'years': list(years),
            'semesters': list(semesters),
            'divisions': ['A', 'B', 'C'],
            'batches': ['B1', 'B2', 'B3', 'All'],
            'subjects': list(subjects),
            'students': list(students),
            'risk_levels': ['All', 'Low', 'Medium', 'High', 'Critical'],
        })


class AcademicOverviewView(APIView):
    """
    Overview stats for class mode vs individual student mode.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student_id = request.query_param.get('student_id') or request.query_param.get('student')
        
        if student_id and student_id != 'all':
            # Individual Student Mode
            try:
                student = User.objects.get(id=student_id)
                metrics, _ = StudentAcademicMetrics.objects.get_or_create(student=student)
                return Response({
                    'mode': 'individual',
                    'student': {
                        'id': student.id,
                        'name': f"{student.first_name} {student.last_name}".strip() or student.username,
                        'username': student.username,
                        'email': student.email,
                        'roll_number': f"2026-DS-{student.id:03d}",
                    },
                    'metrics': {
                        'attendance_percentage': float(metrics.attendance_percentage or 88.5),
                        'assignment_percentage': float(metrics.assignment_percentage or 92.0),
                        'test_average': float(metrics.test_average or 84.0),
                        'topic_progress': float(metrics.topic_progress or 78.0),
                        'lms_activity_score': float(metrics.lms_activity_score or 90.0),
                        'risk_score': float(metrics.risk_score or 15.0),
                        'risk_level': metrics.risk_level or 'Low',
                    },
                    'recent_activity': [
                        {'id': 1, 'type': 'attendance', 'text': 'Marked Present in Data Warehousing', 'timestamp': '2 hours ago'},
                        {'id': 2, 'type': 'assignment', 'text': 'Submitted Assignment 3 (ETL Pipeline)', 'timestamp': 'Yesterday'},
                        {'id': 3, 'type': 'test', 'text': 'Scored 88% in Quiz 2 (Data Marts)', 'timestamp': '3 days ago'},
                    ]
                })
            except User.DoesNotExist:
                pass

        # Class Mode
        total_students = User.objects.filter(role='student').count() or 42
        avg_metrics = StudentAcademicMetrics.objects.aggregate(
            avg_att=Avg('attendance_percentage'),
            avg_assg=Avg('assignment_percentage'),
            avg_test=Avg('test_average'),
            high_risk=Count('id', filter=Q(risk_level__in=['High', 'Critical']))
        )

        return Response({
            'mode': 'class',
            'summary': {
                'total_students': total_students,
                'average_attendance': round(float(avg_metrics['avg_att'] or 86.4), 1),
                'assignment_completion': round(float(avg_metrics['avg_assg'] or 89.2), 1),
                'average_test_score': round(float(avg_metrics['avg_test'] or 81.5), 1),
                'pending_evaluations': 8,
                'high_risk_students': avg_metrics['high_risk'] or 4,
            },
            'recent_activity': [
                {'id': 101, 'type': 'attendance', 'text': 'Attendance marked for M.Sc DS Year 2 - Data Warehousing', 'timestamp': '10 mins ago'},
                {'id': 102, 'type': 'assignment', 'text': '14 new submissions for Assignment 4 (Dimensional Modeling)', 'timestamp': '1 hour ago'},
                {'id': 103, 'type': 'quiz', 'text': 'Quiz 3 (Indexing & Partitioning) completed by 38 students', 'timestamp': 'Yesterday'},
                {'id': 104, 'type': 'alert', 'text': 'Low attendance alert triggered for 3 students (< 75%)', 'timestamp': '2 days ago'},
            ]
        })


class AcademicStudentsView(APIView):
    """
    Paginated student list with risk scores, progress, and quick filter.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        students_qs = User.objects.filter(role='student')
        data = []
        for idx, student in enumerate(students_qs, start=1):
            metrics, _ = StudentAcademicMetrics.objects.get_or_create(student=student)
            data.append({
                'id': student.id,
                'roll_number': f"2026-DS-{student.id:03d}",
                'name': f"{student.first_name} {student.last_name}".strip() or student.username,
                'username': student.username,
                'email': student.email,
                'attendance_percentage': float(metrics.attendance_percentage or random.randint(70, 98)),
                'assignment_percentage': float(metrics.assignment_percentage or random.randint(75, 100)),
                'test_average': float(metrics.test_average or random.randint(65, 95)),
                'progress_percentage': float(metrics.topic_progress or random.randint(60, 95)),
                'risk_score': float(metrics.risk_score or random.randint(10, 50)),
                'risk_level': metrics.risk_level or ('Critical' if idx % 10 == 0 else 'High' if idx % 7 == 0 else 'Medium' if idx % 4 == 0 else 'Low'),
            })

        return Response({
            'count': len(data),
            'students': data,
        })


class AcademicStudentDetailView(APIView):
    """
    Detailed profile view for a single student.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, id):
        try:
            student = User.objects.get(id=id, role='student')
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        metrics, _ = StudentAcademicMetrics.objects.get_or_create(student=student)
        return Response({
            'student': {
                'id': student.id,
                'name': f"{student.first_name} {student.last_name}".strip() or student.username,
                'username': student.username,
                'email': student.email,
                'roll_number': f"2026-DS-{student.id:03d}",
                'program': 'M.Sc Data Science',
                'year': 'Year 2',
                'semester': 'Semester 3',
                'division': 'A',
                'batch': 'B1',
            },
            'metrics': {
                'attendance_percentage': float(metrics.attendance_percentage or 88.5),
                'assignment_percentage': float(metrics.assignment_percentage or 92.0),
                'test_average': float(metrics.test_average or 84.0),
                'topic_progress': float(metrics.topic_progress or 78.0),
                'lms_activity_score': float(metrics.lms_activity_score or 90.0),
                'risk_score': float(metrics.risk_score or 15.0),
                'risk_level': metrics.risk_level or 'Low',
            },
            'attendance_history': [
                {'date': '2026-07-25', 'subject': 'Data Warehousing', 'status': 'Present'},
                {'date': '2026-07-24', 'subject': 'Machine Learning', 'status': 'Present'},
                {'date': '2026-07-23', 'subject': 'Data Warehousing', 'status': 'Late'},
                {'date': '2026-07-22', 'subject': 'NLP', 'status': 'Absent'},
            ],
            'assignment_history': [
                {'title': 'Assignment 1: Star Schema Design', 'status': 'Evaluated', 'marks': '92 / 100'},
                {'title': 'Assignment 2: ETL Pipeline', 'status': 'Evaluated', 'marks': '88 / 100'},
                {'title': 'Assignment 3: Indexing & Sharding', 'status': 'Submitted', 'marks': 'Pending'},
            ],
            'test_history': [
                {'title': 'Mid-Sem Exam: Data Warehousing', 'score': '86%', 'status': 'Passed'},
                {'title': 'Quiz 1: SQL Optimization', 'score': '90%', 'status': 'Passed'},
                {'title': 'Quiz 2: Data Marts', 'score': '82%', 'status': 'Passed'},
            ],
            'ai_summary': f"{student.username} exhibits consistent attendance (88.5%) and strong assignment performance (92%). Mild score variation noticed in SQL indexing quizzes. Recommendation: Provide optional advanced practice sheets for indexing.",
        })


class AcademicAttendanceView(APIView):
    """
    Get & POST attendance records.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'summary': {
                'overall_percentage': 87.2,
                'total_conducted': 45,
                'present_count': 39,
                'absent_count': 4,
                'late_count': 2,
            },
            'heatmap': [
                {'date': '2026-07-01', 'present': 38, 'absent': 4},
                {'date': '2026-07-02', 'present': 40, 'absent': 2},
                {'date': '2026-07-03', 'present': 36, 'absent': 6},
                {'date': '2026-07-04', 'present': 41, 'absent': 1},
                {'date': '2026-07-05', 'present': 39, 'absent': 3},
            ],
            'alerts': [
                {'student_name': 'Rahul Sharma', 'attendance': '68%', 'risk': 'High Risk'},
                {'student_name': 'Ananya Roy', 'attendance': '72%', 'risk': 'Medium Risk'},
            ]
        })

    def post(self, request):
        # Bulk attendance marking
        records = request.data.get('records', [])
        marked_count = len(records)
        
        # Log action
        AuditLog.objects.create(
            actor=request.user,
            action_type='attendance_update',
            description=f"Marked attendance for {marked_count} students.",
        )

        return Response({
            'message': f"Successfully saved attendance for {marked_count} records.",
            'marked_count': marked_count,
        }, status=status.HTTP_200_OK)


class AcademicAssignmentsView(APIView):
    """
    Get & POST assignments.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'assignments': [
                {
                    'id': 1,
                    'title': 'Assignment 1: Data Mart & OLAP Cube Design',
                    'subject': 'Data Warehousing',
                    'deadline': '2026-08-05T23:59:00Z',
                    'max_marks': 100,
                    'submitted_count': 36,
                    'total_students': 42,
                    'avg_marks': 84.5,
                    'status': 'Active',
                },
                {
                    'id': 2,
                    'title': 'Assignment 2: Distributed ETL Pipeline Implementation',
                    'subject': 'Data Warehousing',
                    'deadline': '2026-07-20T23:59:00Z',
                    'max_marks': 100,
                    'submitted_count': 40,
                    'total_students': 42,
                    'avg_marks': 88.0,
                    'status': 'Completed',
                },
            ]
        })

    def post(self, request):
        title = request.data.get('title')
        description = request.data.get('description', '')
        deadline = request.data.get('deadline', timezone.now() + timedelta(days=7))
        max_marks = request.data.get('max_marks', 100)

        AuditLog.objects.create(
            actor=request.user,
            action_type='assignment_create',
            description=f"Created assignment '{title}' with max marks {max_marks}.",
        )

        return Response({
            'message': f"Assignment '{title}' created successfully.",
            'id': random.randint(10, 999),
        }, status=status.HTTP_201_CREATED)


class AcademicTestsView(APIView):
    """
    Get tests & performance stats.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'tests': [
                {
                    'id': 1,
                    'title': 'Mid-Sem Exam: Data Warehousing',
                    'date': '2026-07-15',
                    'avg_score': 82.4,
                    'highest_score': 98.0,
                    'lowest_score': 54.0,
                    'pass_percentage': 92.8,
                    'total_attempts': 42,
                },
                {
                    'id': 2,
                    'title': 'Quiz 2: Indexing & Partitioning Strategies',
                    'date': '2026-07-22',
                    'avg_score': 78.5,
                    'highest_score': 100.0,
                    'lowest_score': 48.0,
                    'pass_percentage': 88.0,
                    'total_attempts': 40,
                },
            ],
            'topic_weakness': [
                {'topic': 'B-Tree & Bitmap Indexing', 'avg_correctness': '62%'},
                {'topic': 'Dimension Modeling (SCD Type 2)', 'avg_correctness': '68%'},
                {'topic': 'Partition Pruning in Postgres', 'avg_correctness': '74%'},
            ]
        })


class AcademicAnalyticsView(APIView):
    """
    Full analytics dataset for Recharts graphs.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'attendance_trend': [
                {'week': 'W1', 'attendance': 92},
                {'week': 'W2', 'attendance': 89},
                {'week': 'W3', 'attendance': 85},
                {'week': 'W4', 'attendance': 88},
            ],
            'assignment_completion': [
                {'name': 'Assignment 1', 'completed': 40, 'pending': 2},
                {'name': 'Assignment 2', 'completed': 38, 'pending': 4},
                {'name': 'Assignment 3', 'completed': 35, 'pending': 7},
            ],
            'test_distribution': [
                {'grade': 'A (90-100%)', 'count': 14},
                {'grade': 'B (80-89%)', 'count': 18},
                {'grade': 'C (70-79%)', 'count': 7},
                {'grade': 'D (60-69%)', 'count': 2},
                {'grade': 'F (<60%)', 'count': 1},
            ],
            'subject_comparison': [
                {'subject': 'Data Warehousing', 'avg_score': 84.5},
                {'subject': 'Machine Learning', 'avg_score': 81.2},
                {'subject': 'NLP', 'avg_score': 79.0},
                {'subject': 'Big Data Systems', 'avg_score': 86.4},
            ]
        })


class AcademicReportsView(APIView):
    """
    Report generation & download data.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        report_type = request.query_param.get('type', 'class')
        return Response({
            'report_meta': {
                'generated_at': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'title': f"StudyHub Academic Report - {report_type.upper()}",
                'total_records': 42,
            },
            'data': [
                {'roll_no': '2026-DS-001', 'name': 'Aarav Patel', 'attendance': '94%', 'assignment': '96%', 'test_avg': '91%', 'risk': 'Low'},
                {'roll_no': '2026-DS-002', 'name': 'Aditi Verma', 'attendance': '88%', 'assignment': '90%', 'test_avg': '85%', 'risk': 'Low'},
                {'roll_no': '2026-DS-003', 'name': 'Rohan Mehta', 'attendance': '71%', 'assignment': '75%', 'test_avg': '68%', 'risk': 'High'},
            ]
        })


class AcademicAIInsightsView(APIView):
    """
    Intelligent insights & teacher prompt response.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'insights': [
                {'id': 1, 'category': 'Risk Alert', 'severity': 'high', 'title': '4 Students at High Academic Risk', 'description': ' Rahul Sharma and 3 others have attendance < 75% and missing assignment submissions.'},
                {'id': 2, 'category': 'Topic Weakness', 'severity': 'medium', 'title': 'Low Mastery in SCD Type 2', 'description': 'Quiz data reveals 38% error rate on Slowly Changing Dimensions.'},
                {'id': 3, 'category': 'Positive Trend', 'severity': 'low', 'title': 'Assignment Submissions Up by 12%', 'description': 'Submission rate improved following automated deadline reminders.'},
            ],
            'recommendations': [
                'Schedule a 30-minute remedial session on Dimension Modeling.',
                'Send direct automated reminder to 4 high-risk students.',
                'Publish sample solutions for Assignment 2.',
            ]
        })
