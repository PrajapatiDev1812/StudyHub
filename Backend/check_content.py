"""
Seed real educational content for ALL topics in the Data Science course.
Run with: python manage.py shell < seed_real_content.py
"""
import os
# pyrefly: ignore [missing-import]
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from courses.models import Course, Subject, Topic, Material

# Get all courses
courses = Course.objects.all()
print(f"Found {courses.count()} courses")

for course in courses:
    print(f"\nCourse: {course.title} (id={course.id})")
    for subject in course.subjects.all():
        print(f"  Subject: {subject.title} (id={subject.id})")
        for topic in subject.topics.all():
            mats = topic.materials.all()
            print(f"    Topic: {topic.title} (id={topic.id}) - {mats.count()} materials")
            for mat in mats:
                print(f"      Material: {mat.title} (type={mat.material_type}, has_file={bool(mat.file)}, has_text={bool(mat.text_content)}, has_video_url={bool(mat.video_url)})")
