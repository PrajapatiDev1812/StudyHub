from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

from rest_framework import permissions
from rest_framework_simplejwt.views import TokenVerifyView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from accounts.permissions import IsAdmin


# ---------- Swagger / ReDoc Schema ----------
schema_view = get_schema_view(
    openapi.Info(
        title="StudyHub API",
        default_version='v1',
        description=(
            "REST API for the StudyHub learning platform.\n\n"
            "**Authentication:**\n"
            "1. Call `POST /api/auth/login/` with your credentials\n"
            "2. Copy the `access` token from the response\n"
            "3. Click the **Authorize 🔒** button above\n"
            "4. In the **Bearer** field, enter: `Bearer <your_access_token>`\n\n"
            "Admins manage courses, subjects, topics, and content.\n"
            "Students browse and consume study materials."
        ),
        contact=openapi.Contact(email="admin@studyhub.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    authentication_classes=[],
    # Inject JWT Bearer security definition directly into the schema
    # This ensures the Authorize dialog shows a Bearer token field
)


urlpatterns = [
    # Redirect base URL to Swagger docs
    path('', RedirectView.as_view(url='swagger/', permanent=False), name='index'),

    # Django Admin
    path('admin/', admin.site.urls),

    # ── Authentication APIs ──
    path('api/auth/', include('accounts.urls')),

    # ── Course Hierarchy APIs ──
    path('api/', include('courses.urls')),

    # ── Assessments APIs (tests, questions, options, attempts) ──
    path('api/', include('assessments.urls')),

    # ── Notifications APIs ──
    path('api/notifications/', include('notifications.urls')),

    # ── AI APIs ──
    path('api/ai/', include('ai.urls')),

    # ── Focus Mode APIs ──
    path('api/focus/', include('focus.urls')),

    # ── Token Verify ──
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='auth-token-verify'),

    # ── Debug RAG retrieval (Admin only — no Gemini call) ──
    path(
        'api/debug/retrieval/',
        __import__('ai.views', fromlist=['DebugRetrievalView']).DebugRetrievalView.as_view(),
        name='debug-retrieval',
    ),

    # ── Swagger Documentation ──
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

