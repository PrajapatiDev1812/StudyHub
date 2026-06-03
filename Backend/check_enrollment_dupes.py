"""
Pre-flight duplicate enrollment check.
Run: python check_enrollment_dupes.py
"""
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db.models import Count
from courses.models import Enrollment

print('=' * 50)
print('Pre-flight Duplicate Enrollment Check')
print('=' * 50)

total = Enrollment.objects.count()
print(f'Total enrollment records in DB: {total}')
print()

dupes = (
    Enrollment.objects
    .values('student', 'course')
    .annotate(count=Count('id'))
    .filter(count__gt=1)
)

if dupes.exists():
    print('DUPLICATES FOUND:')
    print()
    for d in dupes:
        student_id = d['student']
        course_id = d['course']
        cnt = d['count']
        rows = (
            Enrollment.objects
            .filter(student_id=student_id, course_id=course_id)
            .values_list('id', 'enrolled_at')
            .order_by('id')
        )
        print(f'  student_id={student_id}, course_id={course_id}, duplicate_count={cnt}')
        for eid, edt in rows:
            print(f'    -> enrollment id={eid}, enrolled_at={edt}')
    print()
    print('STOP: Do NOT proceed with migration until duplicates are resolved.')
else:
    print('Result: No duplicate (student, course) pairs found.')
    print('Status: SAFE to proceed with migration.')
    print('=' * 50)
