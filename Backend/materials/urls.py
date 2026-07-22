# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from rest_framework.routers import DefaultRouter
from .views import StudentMaterialViewSet, MaterialSharingViewSet, MaterialNoteViewSet, MaterialCommentViewSet

router = DefaultRouter()
router.register(r'student-materials', StudentMaterialViewSet, basename='student-material')

urlpatterns = [
    path('', include(router.urls)),

    # Nested sharing routes: /api/student-materials/{material_pk}/sharing/
    path(
        'student-materials/<int:material_pk>/sharing/share/',
        MaterialSharingViewSet.as_view({'post': 'share'}),
        name='material-share',
    ),
    path(
        'student-materials/<int:material_pk>/sharing/access-list/',
        MaterialSharingViewSet.as_view({'get': 'access_list'}),
        name='material-access-list',
    ),
    path(
        'student-materials/<int:material_pk>/sharing/<int:pk>/update-permission/',
        MaterialSharingViewSet.as_view({'patch': 'update_permission'}),
        name='material-update-permission',
    ),
    path(
        'student-materials/<int:material_pk>/sharing/<int:pk>/revoke/',
        MaterialSharingViewSet.as_view({'delete': 'revoke'}),
        name='material-revoke',
    ),

    # Private note routes: /api/student-materials/{material_pk}/note/
    path(
        'student-materials/<int:material_pk>/note/',
        MaterialNoteViewSet.as_view({'get': 'note', 'post': 'note', 'put': 'note'}),
        name='material-note',
    ),

    # Comments routes: /api/student-materials/{material_pk}/comments/
    path(
        'student-materials/<int:material_pk>/comments/',
        MaterialCommentViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='material-comments-list',
    ),
    path(
        'student-materials/<int:material_pk>/comments/<int:pk>/',
        MaterialCommentViewSet.as_view({'delete': 'destroy'}),
        name='material-comments-detail',
    ),
]
