from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# Register your models here.

class CustomUserAdmin(UserAdmin):
    model = User

    fieldsets = UserAdmin.fieldsets + (
         ("StudyHub Roles", {"fields": ("role", "is_active_user")}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("StudyHub Roles", {"fields": ("role", "is_active_user")}),
    )

    list_display = ("username", "email", "role", "is_active_user", "is_staff")
    list_filter = ("role", "is_active_user")


admin.site.register(User, CustomUserAdmin)