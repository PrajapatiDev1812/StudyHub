import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

u = User.objects.filter(username="studyhub_user").first()
if u:
    print(f"studyhub_user check_password('MyPass@2026'): {u.check_password('MyPass@2026')}")
    print(f"studyhub_user is_active: {u.is_active}")
else:
    print("User not found!")