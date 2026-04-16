from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentMaterialViewSet, MaterialSharingViewSet, MaterialNoteViewSet, MaterialCommentViewSet

router = DefaultRouter()
router.register(r'materials', StudentMaterialViewSet, basename='student-material')

urlpatterns = [
    path('', include(router.urls)),

    # Nested sharing routes: /api/materials/{material_pk}/sharing/
    path(
        'materials/<int:material_pk>/sharing/share/',
        MaterialSharingViewSet.as_view({'post': 'share'}),
        name='material-share',
    ),
    path(
        'materials/<int:material_pk>/sharing/access-list/',
        MaterialSharingViewSet.as_view({'get': 'access_list'}),
        name='material-access-list',
    ),
    path(
        'materials/<int:material_pk>/sharing/<int:pk>/update-permission/',
        MaterialSharingViewSet.as_view({'patch': 'update_permission'}),
        name='material-update-permission',
    ),
    path(
        'materials/<int:material_pk>/sharing/<int:pk>/revoke/',
        MaterialSharingViewSet.as_view({'delete': 'revoke'}),
        name='material-revoke',
    ),

    # Private note routes: /api/materials/{material_pk}/note/
    path(
        'materials/<int:material_pk>/note/',
        MaterialNoteViewSet.as_view({'get': 'note', 'post': 'note', 'put': 'note'}),
        name='material-note',
    ),
]
