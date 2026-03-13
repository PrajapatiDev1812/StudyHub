from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


# ---------- Swagger / ReDoc Schema ----------
schema_view = get_schema_view(
    openapi.Info(
        title="StudyHub API",
        default_version='v1',
        description="REST API for the StudyHub learning platform.\n\n"
                    "Admins manage courses, subjects, topics, and content.\n"
                    "Students browse and consume study materials.",
        contact=openapi.Contact(email="admin@studyhub.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)


urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # Authentication APIs
    path('api/auth/', include('accounts.urls')),

    # Course Hierarchy APIs
    path('api/', include('courses.urls')),

    # Assessments APIs (tests, questions, options, attempts)
    path('api/', include('assessments.urls')),

    # Swagger Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
