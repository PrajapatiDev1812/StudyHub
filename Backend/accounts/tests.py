# pyrefly: ignore [missing-import]
from .models import Theme
# pyrefly: ignore [missing-import]
from django.urls import reverse
# pyrefly: ignore [missing-import]
from rest_framework.test import APITestCase
# pyrefly: ignore [missing-import]
from rest_framework import status
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model

User = get_user_model()

# pyrefly: ignore [missing-import]
from django.core.cache import cache

class RegistrationSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.register_url = reverse('auth-register')

    def test_registration_without_role_creates_student(self):
        data = {
            "username": "student_no_role",
            "email": "student_no_role@example.com",
            "password": "Password123!"
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'student')
        
        user = User.objects.get(username="student_no_role")
        self.assertEqual(user.role, 'student')

    def test_registration_with_student_role_creates_student(self):
        data = {
            "username": "student_with_role",
            "email": "student_with_role@example.com",
            "password": "Password123!",
            "role": "student"
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'student')
        
        user = User.objects.get(username="student_with_role")
        self.assertEqual(user.role, 'student')

    def test_registration_with_admin_role_fails_validation(self):
        data = {
            "username": "admin_wannabe",
            "email": "admin_wannabe@example.com",
            "password": "Password123!",
            "role": "admin"
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('role', response.data)
        
        # Verify user was not created
        self.assertFalse(User.objects.filter(username="admin_wannabe").exists())


class ThemeSecurityTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="userone", password="Password123!", role="student")
        self.user2 = User.objects.create_user(username="usertwo", password="Password123!", role="student")
        
        # Built-in theme
        self.builtin_theme = Theme.objects.create(name="Builtin", slug="builtin", theme_type="builtin", is_public=True, config={})
        # User 1 custom private theme
        self.user1_private_theme = Theme.objects.create(name="Private U1", slug="private-u1", theme_type="custom", created_by=self.user1, is_public=False, config={})
        # User 2 custom private theme
        self.user2_private_theme = Theme.objects.create(name="Private U2", slug="private-u2", theme_type="custom", created_by=self.user2, is_public=False, config={})
        # Public custom theme
        self.public_theme = Theme.objects.create(name="Public Theme", slug="public-theme", theme_type="custom", created_by=self.user2, is_public=True, config={})
        
        self.appearance_url = reverse('appearance-update')

    def test_apply_own_private_theme_succeeds(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(self.appearance_url, {"selected_theme": self.user1_private_theme.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_apply_builtin_theme_succeeds(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(self.appearance_url, {"selected_theme": self.builtin_theme.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_apply_public_custom_theme_succeeds(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(self.appearance_url, {"selected_theme": self.public_theme.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_apply_other_user_private_theme_returns_404(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(self.appearance_url, {"selected_theme": self.user2_private_theme.id})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# pyrefly: ignore [missing-import]
from django.test import override_settings

@override_settings(
    CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'rate-limiting-tests-cache',
        }
    }
)
class RateLimitingSecurityTests(APITestCase):
    def setUp(self):
        super().setUp()
        cache.clear()
        from accounts.views import RegisterThrottle
        from accounts.profile_views import PasswordChangeThrottle
        
        # Override the rates directly on the classes to bypass DRF settings cache
        RegisterThrottle.rate = '2/hour'
        PasswordChangeThrottle.rate = '2/hour'

    def tearDown(self):
        from accounts.views import RegisterThrottle
        from accounts.profile_views import PasswordChangeThrottle
        
        # Reset rates to default setting lookup
        RegisterThrottle.rate = None
        PasswordChangeThrottle.rate = None
        super().tearDown()

    def test_register_is_throttled(self):
        url = reverse('auth-register')
        
        # 1st attempt
        data = {"username": "r1", "email": "r1@example.com", "password": "Password123!"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 2nd attempt
        data = {"username": "r2", "email": "r2@example.com", "password": "Password123!"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 3rd attempt should trigger 429
        data = {"username": "r3", "email": "r3@example.com", "password": "Password123!"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_password_change_is_throttled(self):
        # Create user
        user = User.objects.create_user(username="throttleuser", password="OldPassword123!", role="student")
        self.client.force_authenticate(user=user)
        
        url = reverse('security-change-password')
        
        # 1st change
        response = self.client.post(url, {"current_password": "OldPassword123!", "new_password": "NewPassword123!"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2nd change
        response = self.client.post(url, {"current_password": "NewPassword123!", "new_password": "AnotherPassword123!"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3rd change should trigger 429
        response = self.client.post(url, {"current_password": "AnotherPassword123!", "new_password": "FinalPassword123!"})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


