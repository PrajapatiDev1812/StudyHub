"""
courses/tests_soft_delete.py
────────────────────────────────────────────────────────────────────────────
Automated tests for soft delete behaviour in the `courses` app.

Run with:
    python manage.py test courses.tests_soft_delete --verbosity=2
"""

# pyrefly: ignore [missing-import]
from django.test import TestCase
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from django.utils import timezone

# pyrefly: ignore [missing-import]
from courses.models import Course, Subject, Topic, Material, Content, Enrollment, Progress

User = get_user_model()


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_admin(**kwargs):
    defaults = dict(username='admin_user', email='admin@test.com', role='admin', password='pass')
    defaults.update(kwargs)
    return User.objects.create_user(**defaults)


def make_student(**kwargs):
    defaults = dict(username='student_user', email='student@test.com', role='student', password='pass')
    defaults.update(kwargs)
    return User.objects.create_user(**defaults)


def make_course(admin, **kwargs):
    defaults = dict(title='Test Course', created_by=admin)
    defaults.update(kwargs)
    return Course.objects.create(**defaults)


# ── Course Soft Delete Tests ──────────────────────────────────────────────────

class CourseSoftDeleteTest(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.course = make_course(self.admin)

    def test_soft_delete_sets_is_deleted(self):
        """Soft-deleting a course sets is_deleted=True."""
        self.course.delete()
        self.course.refresh_from_db()
        self.assertTrue(self.course.is_deleted)

    def test_soft_delete_sets_deleted_at(self):
        """Soft-deleting a course sets deleted_at to a non-null datetime."""
        self.course.delete()
        self.course.refresh_from_db()
        self.assertIsNotNone(self.course.deleted_at)

    def test_soft_delete_records_deleted_by(self):
        """Soft-deleting with a user records deleted_by."""
        self.course.delete(user=self.admin)
        self.course.refresh_from_db()
        self.assertEqual(self.course.deleted_by, self.admin)

    def test_default_manager_excludes_soft_deleted(self):
        """Course.objects.all() must NOT include soft-deleted courses."""
        self.course.delete()
        qs = Course.objects.all()
        self.assertNotIn(self.course, qs)

    def test_all_objects_manager_includes_soft_deleted(self):
        """Course.all_objects.all() MUST include soft-deleted courses."""
        self.course.delete()
        qs = Course.all_objects.all()
        self.assertIn(self.course, qs)

    def test_deleted_only_returns_only_deleted(self):
        """Course.objects.deleted_only() returns only soft-deleted courses."""
        active_course = make_course(self.admin, title='Active Course', slug='active-course')
        self.course.delete()
        qs = Course.objects.deleted_only()
        self.assertIn(self.course, qs)
        self.assertNotIn(active_course, qs)

    def test_restore_resets_soft_delete_fields(self):
        """Restoring a course resets is_deleted, deleted_at, deleted_by."""
        self.course.delete(user=self.admin)
        self.course.restore()
        self.course.refresh_from_db()
        self.assertFalse(self.course.is_deleted)
        self.assertIsNone(self.course.deleted_at)
        self.assertIsNone(self.course.deleted_by)

    def test_restored_course_visible_in_default_manager(self):
        """A restored course appears in Course.objects.all()."""
        self.course.delete()
        self.course.restore()
        qs = Course.objects.all()
        self.assertIn(self.course, qs)

    def test_hard_delete_removes_from_db(self):
        """hard_delete() permanently removes the course from the database."""
        pk = self.course.pk
        self.course.hard_delete()
        self.assertFalse(Course.all_objects.filter(pk=pk).exists())

    def test_is_active_property(self):
        """is_active property returns True for active and False for deleted."""
        self.assertTrue(self.course.is_active)
        self.course.delete()
        self.course.refresh_from_db()
        self.assertFalse(self.course.is_active)


# ── Enrollment Soft Delete Tests ───────────────────────────────────────────────

class EnrollmentSoftDeleteTest(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.student = make_student()
        self.course = make_course(self.admin)
        self.enrollment = Enrollment.objects.create(student=self.student, course=self.course)

    def test_soft_delete_enrollment(self):
        """Soft-deleting an enrollment sets is_deleted=True."""
        self.enrollment.delete()
        self.enrollment.refresh_from_db()
        self.assertTrue(self.enrollment.is_deleted)

    def test_re_enrollment_after_soft_delete(self):
        """
        After soft-deleting an enrollment, a student can re-enroll
        without a UniqueConstraint IntegrityError.
        """
        self.enrollment.delete()
        # Re-enroll — should succeed because the old enrollment is soft-deleted
        new_enrollment = Enrollment.objects.create(student=self.student, course=self.course)
        self.assertIsNotNone(new_enrollment.pk)
        self.assertFalse(new_enrollment.is_deleted)

    def test_enrollment_hidden_after_soft_delete(self):
        """Soft-deleted enrollment not visible via default manager."""
        self.enrollment.delete()
        qs = Enrollment.objects.filter(student=self.student, course=self.course)
        self.assertEqual(qs.count(), 0)

    def test_enrollment_restore(self):
        """Restoring a soft-deleted enrollment makes it visible again."""
        self.enrollment.delete()
        self.enrollment.restore()
        qs = Enrollment.objects.filter(student=self.student, course=self.course)
        self.assertEqual(qs.count(), 1)


# ── Queryset-Level Soft Delete Tests ──────────────────────────────────────────

class QuerysetSoftDeleteTest(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.c1 = make_course(self.admin, title='Course A', slug='course-a')
        self.c2 = make_course(self.admin, title='Course B', slug='course-b')
        self.c3 = make_course(self.admin, title='Course C', slug='course-c')

    def test_queryset_delete_soft_deletes_all(self):
        """Deleting a queryset soft-deletes all matching records."""
        Course.objects.filter(title__in=['Course A', 'Course B']).delete()
        self.c1.refresh_from_db()
        self.c2.refresh_from_db()
        self.assertTrue(self.c1.is_deleted)
        self.assertTrue(self.c2.is_deleted)
        self.assertFalse(self.c3.is_deleted)  # Not deleted

    def test_queryset_restore(self):
        """Restoring a queryset resets all soft-deleted records."""
        Course.objects.all().delete()
        Course.all_objects.filter(is_deleted=True).restore()
        self.c1.refresh_from_db()
        self.assertFalse(self.c1.is_deleted)


# ── Subject Slug Conditional Constraint Test ──────────────────────────────────

class SubjectConditionalConstraintTest(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.course = make_course(self.admin)

    def test_conditional_unique_constraint_allows_reuse_after_soft_delete(self):
        """
        Creating a subject with a slug that already exists but is soft-deleted
        should NOT raise an IntegrityError.
        """
        # pyrefly: ignore [import-import, missing-import]
        from django.db import IntegrityError

        s1 = Subject.objects.create(course=self.course, title='Intro', slug='intro')
        s1.delete()  # Soft-delete

        # Creating another subject with the same slug should work
        try:
            s2 = Subject.objects.create(course=self.course, title='Intro', slug='intro')
            self.assertIsNotNone(s2.pk)
        except IntegrityError:
            self.fail("IntegrityError raised — conditional unique constraint not working!")
