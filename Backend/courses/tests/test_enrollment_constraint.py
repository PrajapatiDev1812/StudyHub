"""
Verification test for unique_enrollment_per_user_course constraint.
Run: python manage.py test courses.tests.test_enrollment_constraint --verbosity=2
"""
from django.test import TestCase
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError
from accounts.models import User
from courses.models import Course, Enrollment


class EnrollmentUniqueConstraintTest(TestCase):
    """
    Four-scenario verification of the UniqueConstraint on (student, course).

    Scenario 1: User A enrolls in Course X           → Allowed
    Scenario 2: User A enrolls in Course Y           → Allowed (different course)
    Scenario 3: User B enrolls in Course X           → Allowed (different student)
    Scenario 4: User A enrolls in Course X (again)   → Raises IntegrityError
    """

    @classmethod
    def setUpTestData(cls):
        # Create two admin users to own courses
        cls.admin = User.objects.create_user(
            username='test_admin_constraint',
            password='Admin@1234',
            role='admin',
        )
        # Create two students
        cls.student_a = User.objects.create_user(
            username='test_student_a_constraint',
            password='Student@1234',
            role='student',
        )
        cls.student_b = User.objects.create_user(
            username='test_student_b_constraint',
            password='Student@1234',
            role='student',
        )
        # Create two courses
        cls.course_x = Course.objects.create(
            title='Constraint Test Course X',
            created_by=cls.admin,
        )
        cls.course_y = Course.objects.create(
            title='Constraint Test Course Y',
            created_by=cls.admin,
        )

    # ── Scenario 1 ────────────────────────────────────────────────────────────

    def test_scenario_1_user_a_enrolls_in_course_x_is_allowed(self):
        """User A enrolls in Course X for the first time → should succeed."""
        enrollment = Enrollment.objects.create(
            student=self.student_a,
            course=self.course_x,
        )
        self.assertIsNotNone(enrollment.pk)
        self.assertEqual(enrollment.student, self.student_a)
        self.assertEqual(enrollment.course, self.course_x)
        print("  PASS  Scenario 1: User A enrolled in Course X.")

    # ── Scenario 2 ────────────────────────────────────────────────────────────

    def test_scenario_2_user_a_enrolls_in_course_y_is_allowed(self):
        """User A enrolls in a different Course Y → should succeed (different course)."""
        enrollment = Enrollment.objects.create(
            student=self.student_a,
            course=self.course_y,
        )
        self.assertIsNotNone(enrollment.pk)
        self.assertEqual(enrollment.course, self.course_y)
        print("  PASS  Scenario 2: User A enrolled in Course Y (different course).")

    # ── Scenario 3 ────────────────────────────────────────────────────────────

    def test_scenario_3_user_b_enrolls_in_course_x_is_allowed(self):
        """User B enrolls in Course X → should succeed (different student, same course)."""
        enrollment = Enrollment.objects.create(
            student=self.student_b,
            course=self.course_x,
        )
        self.assertIsNotNone(enrollment.pk)
        self.assertEqual(enrollment.student, self.student_b)
        print("  PASS  Scenario 3: User B enrolled in Course X (different student).")

    # ── Scenario 4 ────────────────────────────────────────────────────────────

    def test_scenario_4_user_a_duplicate_enrollment_raises_integrity_error(self):
        """User A tries to enroll in Course X a second time → must raise IntegrityError."""
        # First enrollment — must succeed
        Enrollment.objects.create(
            student=self.student_a,
            course=self.course_x,
        )
        # Second enrollment — must be blocked by the DB constraint
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Enrollment.objects.create(
                    student=self.student_a,
                    course=self.course_x,
                )
        # Confirm only one record exists
        count = Enrollment.objects.filter(
            student=self.student_a,
            course=self.course_x,
        ).count()
        self.assertEqual(count, 1)
        print("  PASS  Scenario 4: Duplicate enrollment for User A + Course X correctly blocked.")

    # ── Meta check ────────────────────────────────────────────────────────────

    def test_constraint_is_named_correctly_in_meta(self):
        """The UniqueConstraint must exist in Meta.constraints with the correct name."""
        constraint_names = [c.name for c in Enrollment._meta.constraints]
        self.assertIn(
            'unique_enrollment_per_user_course',
            constraint_names,
            msg="Expected 'unique_enrollment_per_user_course' in Enrollment._meta.constraints"
        )
        print("  PASS  Meta check: UniqueConstraint 'unique_enrollment_per_user_course' is present.")

    def test_unique_together_is_not_used(self):
        """Legacy unique_together must be empty on the Enrollment model."""
        self.assertEqual(
            Enrollment._meta.unique_together,
            (),
            msg="unique_together should be empty — use UniqueConstraint instead."
        )
        print("  PASS  Meta check: unique_together is correctly absent from Enrollment.Meta.")
