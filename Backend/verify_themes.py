import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Theme, UserAppearance, User

def verify_data():
    print("--- Theme Verification ---")
    themes = Theme.objects.all()
    print(f"Total themes: {themes.count()}")
    for theme in themes[:3]:
        print(f"- {theme.name} ({theme.slug}): {list(theme.config.keys())[:3]}...")

    print("\n--- User Appearance Verification ---")
    users = User.objects.all()
    for user in users:
        app, created = UserAppearance.objects.get_or_create(user=user)
        theme_name = app.selected_theme.name if app.selected_theme else "None"
        print(f"User: {user.username} | Theme: {theme_name}")

if __name__ == "__main__":
    verify_data()
