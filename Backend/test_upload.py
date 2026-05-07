import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
import json
import traceback

User = get_user_model()
try:
    user = User.objects.first()
    print(f"Testing as user: {user.username}")

    client = APIClient()
    client.force_authenticate(user=user)

    data = {
        'title': 'Test Material',
        'material_type': 'pdf',
        'subject': 'Physics',
        'topic': 'Thermo',
        'tags': '["all"]',   # This string is what Frontend sends
        'visibility': 'private',
    }

    # Simulate multipart/form-data
    response = client.post('/api/materials/', data, format='multipart')

    print("Status:", response.status_code)
    print("Response:")
    print(json.dumps(response.data, indent=2))
except Exception as e:
    print("FATAL EXCEPTION:")
    traceback.print_exc()
