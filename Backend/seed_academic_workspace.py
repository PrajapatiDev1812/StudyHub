import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import (
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
    Course,
    Subject,
)

User = get_user_model()

def seed_academic():
    print("[INFO] Seeding Academic Workspace Data...")


    # 1. Academic Sessions
    session_25, _ = AcademicSession.objects.get_or_create(
        name='2025-26',
        defaults={'start_date': '2025-08-01', 'end_date': '2026-05-30', 'is_current': False}
    )
    session_26, _ = AcademicSession.objects.get_or_create(
        name='2026-27',
        defaults={'start_date': '2026-08-01', 'end_date': '2027-05-30', 'is_current': True}
    )

    # 2. Risk Configuration
    RiskConfiguration.objects.get_or_create(
        name="Default University Config",
        defaults={
            'attendance_weight': 30.0,
            'assignment_weight': 25.0,
            'test_weight': 25.0,
            'topic_weight': 10.0,
            'activity_weight': 10.0,
        }
    )

    # 3. Programs
    msc_ds, _ = AcademicProgram.objects.get_or_create(
        name='M.Sc Data Science',
        defaults={'code': 'MSC-DS', 'department': 'Department of Data Science', 'degree_level': 'Postgraduate'}
    )
    bsc_ds, _ = AcademicProgram.objects.get_or_create(
        name='B.Sc Data Science',
        defaults={'code': 'BSC-DS', 'department': 'Department of Data Science', 'degree_level': 'Undergraduate'}
    )
    biotech, _ = AcademicProgram.objects.get_or_create(
        name='Biotechnology',
        defaults={'code': 'BIOTECH', 'department': 'Department of Life Sciences', 'degree_level': 'Undergraduate'}
    )
    btech_cs, _ = AcademicProgram.objects.get_or_create(
        name='B.Tech Computer Science',
        defaults={'code': 'BTECH-CS', 'department': 'Department of Computer Science', 'degree_level': 'Undergraduate'}
    )

    # 4. Years & Semesters for M.Sc Data Science
    y1_msc, _ = AcademicYear.objects.get_or_create(program=msc_ds, year_number=1, defaults={'name': 'Year 1'})
    y2_msc, _ = AcademicYear.objects.get_or_create(program=msc_ds, year_number=2, defaults={'name': 'Year 2'})

    sem1_msc, _ = AcademicSemester.objects.get_or_create(program_year=y1_msc, semester_number=1, defaults={'name': 'Semester 1'})
    sem2_msc, _ = AcademicSemester.objects.get_or_create(program_year=y1_msc, semester_number=2, defaults={'name': 'Semester 2'})
    sem3_msc, _ = AcademicSemester.objects.get_or_create(program_year=y2_msc, semester_number=3, defaults={'name': 'Semester 3'})
    sem4_msc, _ = AcademicSemester.objects.get_or_create(program_year=y2_msc, semester_number=4, defaults={'name': 'Semester 4'})

    # 5. Course & Subject mapping
    course_ds, _ = Course.objects.get_or_create(
        title='Data Science & Analytics Curriculum',
        defaults={'description': 'University Core Data Science Program', 'created_by': User.objects.filter(role='admin').first() or User.objects.first()}
    )
    subj_dw, _ = Subject.objects.get_or_create(
        title='Data Warehousing',
        course=course_ds,
        defaults={'description': 'Dimensional Modeling, ETL Pipelines, OLAP Cubes'}
    )
    subj_ml, _ = Subject.objects.get_or_create(
        title='Machine Learning Systems',
        course=course_ds,
        defaults={'description': 'Supervised, Unsupervised, Model Deployment'}
    )
    subj_nlp, _ = Subject.objects.get_or_create(
        title='Natural Language Processing',
        course=course_ds,
        defaults={'description': 'Transformers, LLMs, Text Processing'}
    )

    # 6. Teachers & Assignments
    admin_teacher = User.objects.filter(role='admin').first()
    if admin_teacher:
        TeacherSubjectAssignment.objects.get_or_create(
            teacher=admin_teacher,
            subject=subj_dw,
            program=msc_ds,
            year=y2_msc,
            semester=sem3_msc,
        )

    # 7. Students & Enrollments
    students = User.objects.filter(role='student')
    if not students.exists():
        # Create 5 sample students
        for i in range(1, 15):
            student_user, _ = User.objects.get_or_create(
                username=f"student{i}",
                defaults={
                    'email': f"student{i}@university.edu",
                    'role': 'student',
                    'first_name': f"Student{i}",
                    'last_name': "Patel" if i % 2 == 0 else "Sharma",
                }
            )
            student_user.set_password("Student123!")
            student_user.save()

    students = User.objects.filter(role='student')
    for idx, student in enumerate(students, start=1):
        StudentAcademicEnrollment.objects.get_or_create(
            student=student,
            academic_session=session_26,
            program=msc_ds if idx % 2 == 0 else bsc_ds,
            year=y2_msc if idx % 2 == 0 else y1_msc,
            defaults={'division': 'A', 'batch': f"B{((idx-1)%2)+1}", 'roll_number': f"2026-DS-{idx:03d}"}
        )

        # Student Metrics
        att = random.uniform(68.0, 98.0)
        assg = random.uniform(70.0, 100.0)
        test = random.uniform(60.0, 95.0)
        top = random.uniform(65.0, 95.0)
        act = random.uniform(70.0, 98.0)
        risk_calc = 100 - (att*0.30 + assg*0.25 + test*0.25 + top*0.10 + act*0.10)
        
        risk_lvl = 'Low'
        if risk_calc > 40:
            risk_lvl = 'Critical' if risk_calc > 60 else 'High'
        elif risk_calc > 20:
            risk_lvl = 'Medium'

        StudentAcademicMetrics.objects.update_or_create(
            student=student,
            defaults={
                'attendance_percentage': round(att, 1),
                'assignment_percentage': round(assg, 1),
                'test_average': round(test, 1),
                'topic_progress': round(top, 1),
                'lms_activity_score': round(act, 1),
                'risk_score': round(risk_calc, 1),
                'risk_level': risk_lvl,
            }
        )

    # 8. Sample Assignments
    assg1, _ = AcademicAssignment.objects.get_or_create(
        subject=subj_dw,
        title='Assignment 1: Star Schema & Data Warehousing Architecture',
        defaults={
            'description': 'Design a star schema for an enterprise e-commerce dataset.',
            'deadline': timezone.now() + timedelta(days=5),
            'max_marks': 100,
            'created_by': admin_teacher or User.objects.first(),
        }
    )

    print("[SUCCESS] Academic Workspace Data Seeded Successfully!")

if __name__ == '__main__':
    seed_academic()

