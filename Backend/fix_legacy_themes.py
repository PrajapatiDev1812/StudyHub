import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Theme, UserAppearance, User

def fix_existing_users():
    print("Assigning 'light' theme to all existing users...")
    light_theme = Theme.objects.filter(slug='light').first()
    if not light_theme:
        print("Error: Light theme not found in DB.")
        return

    users = User.objects.all()
    count = 0
    for user in users:
        app, created = UserAppearance.objects.get_or_create(user=user)
        if not app.selected_theme:
            app.selected_theme = light_theme
            app.save()
            count += 1
    
    print(f"Fixed {count} user appearance records.")

if __name__ == "__main__":
    fix_existing_users()
