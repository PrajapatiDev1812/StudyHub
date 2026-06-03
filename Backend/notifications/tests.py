from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Notification

User = get_user_model()

class NotificationSecurityTests(APITestCase):
    def setUp(self):
        # Create student and admin users
        self.student = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='Password123!',
            role='student'
        )
        self.other_student = User.objects.create_user(
            username='other_student',
            email='other_student@example.com',
            password='Password123!',
            role='student'
        )
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='Password123!',
            role='admin'
        )

        # Create notifications
        self.notification_student = Notification.objects.create(
            user=self.student,
            message="Welcome Student!"
        )
        self.notification_other = Notification.objects.create(
            user=self.other_student,
            message="Welcome Other!"
        )

    def test_student_cannot_create_notification(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('notification-list')
        data = {'message': 'Spam alert!'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_notification_for_student(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('notification-list')
        data = {
            'message': 'Important update!',
            'user': self.student.id
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Notification.objects.filter(user=self.student, message='Important update!').count(), 1)

    def test_student_sees_only_own_notifications(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('notification-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see their own notification
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['message'], "Welcome Student!")

    def test_admin_sees_all_notifications(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('notification-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_student_cannot_mark_other_notification_as_read(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('notification-mark-read', kwargs={'pk': self.notification_other.pk})
        response = self.client.post(url)
        # Note: Depending on views.py implementation, if we filter by queryset or handle in get_object,
        # get_object() on a query not in student's own notifications will raise 404.
        # Let's see: get_queryset returns owned notifications, so get_object will raise HTTP 404.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_can_mark_own_notification_as_read(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('notification-mark-read', kwargs={'pk': self.notification_student.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification_student.refresh_from_db()
        self.assertTrue(self.notification_student.is_read)

