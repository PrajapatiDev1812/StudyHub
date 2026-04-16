import logging
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import StudentMaterial, MaterialAccess, MaterialUserNote
from .serializers import (
    StudentMaterialSerializer, MaterialAccessSerializer,
    ShareMaterialSerializer, MaterialUserNoteSerializer,
    MaterialCommentSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class IsOwnerOrHasAccess(permissions.BasePermission):
    """
    - Owner: full access.
    - Shared user (MaterialAccess): access per permission flags.
    - Others: denied.
    """
    def has_object_permission(self, request, view, obj):
        if obj.student == request.user:
            return True
        try:
            access = MaterialAccess.objects.get(material=obj, user=request.user)
            if request.method in permissions.SAFE_METHODS:
                return access.can_view
            # Write/delete requires can_edit, and ONLY owner can delete/manage sharing
            return False
        except MaterialAccess.DoesNotExist:
            return False


class StudentMaterialViewSet(viewsets.ModelViewSet):
    """
    Full CRUD + custom actions for student personal materials.
    Tab filtering is handled via ?tab= query param:
      all, uploads, shared, favorites, trash
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    serializer_class = StudentMaterialSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def get_queryset(self):
        user = self.request.user
        
        # For detail views (restore, permanent-delete, etc.), 
        # we need to include trashed items in the base queryset.
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'restore', 'permanent_delete', 'move_to_folder', 'toggle_favorite']:
            # Return all materials owned by user (deleted or not) + shared materials
            owned = Q(student=user)
            accessible_ids = MaterialAccess.objects.filter(user=user).values_list('material_id', flat=True)
            shared_with_me = Q(id__in=accessible_ids, visibility='shared')
            return StudentMaterial.objects.filter(owned | shared_with_me).select_related('student')

        tab = self.request.query_params.get('tab', 'all')
        if tab == 'trash':
            qs = StudentMaterial.objects.filter(student=user, is_deleted=True)
        elif tab == 'uploads':
            qs = StudentMaterial.objects.filter(student=user, is_deleted=False)
        elif tab == 'shared':
            # Materials owned by OTHERS that this user has been granted access to
            accessible_ids = MaterialAccess.objects.filter(user=user).values_list('material_id', flat=True)
            qs = StudentMaterial.objects.filter(
                id__in=accessible_ids, is_deleted=False, visibility='shared'
            )
        elif tab == 'favorites':
            qs = StudentMaterial.objects.filter(student=user, is_deleted=False, favorite=True)
        else:  # 'all'
            owned = Q(student=user, is_deleted=False)
            accessible_ids = MaterialAccess.objects.filter(user=user).values_list('material_id', flat=True)
            shared_with_me = Q(id__in=accessible_ids, is_deleted=False, visibility='shared')
            qs = StudentMaterial.objects.filter(owned | shared_with_me)

        # Search
        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(subject__icontains=search) | Q(topic__icontains=search))

        # Filters
        material_type = self.request.query_params.get('type')
        if material_type:
            qs = qs.filter(material_type=material_type)

        subject = self.request.query_params.get('subject')
        if subject:
            qs = qs.filter(subject__icontains=subject)

        folder = self.request.query_params.get('folder')
        if folder:
            qs = qs.filter(folder_name=folder)

        # Sorting
        sort = self.request.query_params.get('sort', 'newest')
        sort_map = {
            'newest': '-uploaded_at',
            'oldest': 'uploaded_at',
            'az': 'title',
            'za': '-title',
        }
        qs = qs.order_by(sort_map.get(sort, '-uploaded_at'))

        return qs.select_related('student').prefetch_related('access_grants__user')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Override to do SOFT delete instead of hard delete."""
        obj = self.get_object()
        if obj.student != request.user:
            return Response({'error': 'Only the owner can delete this material.'}, status=status.HTTP_403_FORBIDDEN)
        obj.is_deleted = True
        obj.save(update_fields=['is_deleted'])
        return Response({'message': 'Material moved to trash.'}, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.student != request.user:
            # Shared users with can_edit may update note_text only
            try:
                access = MaterialAccess.objects.get(material=obj, user=request.user)
                if not access.can_edit:
                    return Response({'error': 'You do not have edit permission for this material.'}, status=status.HTTP_403_FORBIDDEN)
                # Restrict shared editors — they cannot change visibility/sharing
                allowed_fields = {'note_text', 'description'}
                for key in request.data.keys():
                    if key not in allowed_fields:
                        return Response({'error': f'Shared editors cannot modify `{key}`.'}, status=status.HTTP_403_FORBIDDEN)
            except MaterialAccess.DoesNotExist:
                return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    # ── Custom Actions ─────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='toggle-favorite')
    def toggle_favorite(self, request, pk=None):
        obj = self.get_object()
        if obj.student != request.user:
            return Response({'error': 'Only the owner can favorite a material.'}, status=status.HTTP_403_FORBIDDEN)
        obj.favorite = not obj.favorite
        obj.save(update_fields=['favorite'])
        return Response({'favorite': obj.favorite})

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        obj = self.get_object()
        if obj.student != request.user:
            return Response({'error': 'Only the owner can restore a material.'}, status=status.HTTP_403_FORBIDDEN)
        if not obj.is_deleted:
            return Response({'error': 'Material is not in trash.'}, status=status.HTTP_400_BAD_REQUEST)
        obj.is_deleted = False
        obj.save(update_fields=['is_deleted'])
        return Response({'message': 'Material restored successfully.'})

    @action(detail=True, methods=['post'], url_path='move-to-folder')
    def move_to_folder(self, request, pk=None):
        obj = self.get_object()
        if obj.student != request.user:
            return Response({'error': 'Only the owner can move a material.'}, status=status.HTTP_403_FORBIDDEN)
        folder = request.data.get('folder_name', '')
        obj.folder_name = folder
        obj.save(update_fields=['folder_name'])
        return Response({'folder_name': obj.folder_name})

    @action(detail=False, methods=['get'], url_path='folders')
    def list_folders(self, request):
        """Returns unique folder names for the current user."""
        folders = (
            StudentMaterial.objects
            .filter(student=request.user, is_deleted=False)
            .exclude(folder_name='')
            .values_list('folder_name', flat=True)
            .distinct()
        )
        return Response(sorted(set(folders)))

    @action(detail=True, methods=['post', 'delete'], url_path='permanent-delete')
    def permanent_delete(self, request, pk=None):
        obj = self.get_object()
        if obj.student != request.user:
            return Response({'error': 'Only the owner can permanently delete a material.'}, status=status.HTTP_403_FORBIDDEN)
        if not obj.is_deleted:
            return Response({'error': 'Move to trash first before permanent deletion.'}, status=status.HTTP_400_BAD_REQUEST)
        obj.delete()
        return Response({'message': 'Material permanently deleted.'}, status=status.HTTP_204_NO_CONTENT)


class MaterialSharingViewSet(viewsets.ViewSet):
    """
    Handles all sharing-related actions for a single material.
    All endpoints are nested under /api/materials/{material_id}/sharing/
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_material(self, pk, request):
        try:
            material = StudentMaterial.objects.get(pk=pk, is_deleted=False)
        except StudentMaterial.DoesNotExist:
            return None, Response({'error': 'Material not found.'}, status=status.HTTP_404_NOT_FOUND)
        if material.student != request.user:
            return None, Response({'error': 'Only the owner can manage sharing.'}, status=status.HTTP_403_FORBIDDEN)
        return material, None

    @action(detail=False, methods=['post'], url_path='share')
    def share(self, request, material_pk=None):
        material, err = self._get_material(material_pk, request)
        if err:
            return err

        serializer = ShareMaterialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_user = User.objects.get(email__iexact=serializer.validated_data['email'])
        if target_user == request.user:
            return Response({'error': 'You cannot share a material with yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        access, created = MaterialAccess.objects.update_or_create(
            material=material,
            user=target_user,
            defaults={
                'can_view': serializer.validated_data['can_view'],
                'can_edit': serializer.validated_data['can_edit'],
                'can_comment': serializer.validated_data['can_comment'],
            }
        )
        material.visibility = 'shared'
        material.save(update_fields=['visibility'])

        return Response(
            MaterialAccessSerializer(access).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='access-list')
    def access_list(self, request, material_pk=None):
        material, err = self._get_material(material_pk, request)
        if err:
            return err
        grants = MaterialAccess.objects.filter(material=material).select_related('user')
        return Response(MaterialAccessSerializer(grants, many=True).data)

    @action(detail=True, methods=['patch'], url_path='update-permission')
    def update_permission(self, request, material_pk=None, pk=None):
        material, err = self._get_material(material_pk, request)
        if err:
            return err
        try:
            access = MaterialAccess.objects.get(pk=pk, material=material)
        except MaterialAccess.DoesNotExist:
            return Response({'error': 'Access grant not found.'}, status=status.HTTP_404_NOT_FOUND)

        for field in ['can_view', 'can_edit', 'can_comment']:
            if field in request.data:
                setattr(access, field, request.data[field])
        access.save()
        return Response(MaterialAccessSerializer(access).data)

    @action(detail=True, methods=['delete'], url_path='revoke')
    def revoke(self, request, material_pk=None, pk=None):
        material, err = self._get_material(material_pk, request)
        if err:
            return err
        try:
            access = MaterialAccess.objects.get(pk=pk, material=material)
            access.delete()
        except MaterialAccess.DoesNotExist:
            return Response({'error': 'Access grant not found.'}, status=status.HTTP_404_NOT_FOUND)

        # If no more grants remain, revert to private
        if not MaterialAccess.objects.filter(material=material).exists():
            material.visibility = 'private'
            material.save(update_fields=['visibility'])

        return Response({'message': 'Access revoked.'}, status=status.HTTP_200_OK)


class MaterialNoteViewSet(viewsets.ViewSet):
    """
    Private per-user notes on a material. Notes are NEVER exposed to other users.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _check_access(self, material_pk, request):
        try:
            material = StudentMaterial.objects.get(pk=material_pk, is_deleted=False)
        except StudentMaterial.DoesNotExist:
            return None, Response({'error': 'Material not found.'}, status=status.HTTP_404_NOT_FOUND)

        is_owner = material.student == request.user
        has_access = MaterialAccess.objects.filter(material=material, user=request.user).exists()
        if not is_owner and not has_access:
            return None, Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        return material, None

    @action(detail=False, methods=['get', 'post', 'put'], url_path='note')
    def note(self, request, material_pk=None):
        material, err = self._check_access(material_pk, request)
        if err:
            return err

        if request.method == 'GET':
            try:
                note = MaterialUserNote.objects.get(material=material, user=request.user)
                return Response(MaterialUserNoteSerializer(note).data)
            except MaterialUserNote.DoesNotExist:
                return Response({'note_content': '', 'updated_at': None})

        # POST / PUT — upsert the note
        serializer = MaterialUserNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        note, _ = MaterialUserNote.objects.update_or_create(
            material=material,
            user=request.user,
            defaults={'note_content': serializer.validated_data['note_content']}
        )
        return Response(MaterialUserNoteSerializer(note).data, status=status.HTTP_200_OK)


class MaterialCommentViewSet(viewsets.ViewSet):
    """
    Public comments visible to anyone with access to the material.
    """
    permission_classes = [permissions.IsAuthenticated]

    def _check_access(self, material_pk, request):
        try:
            material = StudentMaterial.objects.get(pk=material_pk, is_deleted=False)
        except StudentMaterial.DoesNotExist:
            return None, Response({'error': 'Material not found.'}, status=status.HTTP_404_NOT_FOUND)

        is_owner = material.student == request.user
        has_access = MaterialAccess.objects.filter(material=material, user=request.user).exists()
        if not is_owner and not has_access:
            return None, Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        return material, None

    def list(self, request, material_pk=None):
        material, err = self._check_access(material_pk, request)
        if err:
            return err
        
        from .models import MaterialComment
        comments = MaterialComment.objects.filter(material=material)
        return Response(MaterialCommentSerializer(comments, many=True).data)

    def create(self, request, material_pk=None):
        material, err = self._check_access(material_pk, request)
        if err:
            return err

        # If they are just a guest, check if they have comment permission
        if material.student != request.user:
            access = MaterialAccess.objects.get(material=material, user=request.user)
            if not access.can_comment:
                return Response({'error': 'You do not have permission to comment on this material.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = MaterialCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from .models import MaterialComment
        comment = MaterialComment.objects.create(
            material=material,
            user=request.user,
            content=serializer.validated_data['content']
        )
        return Response(MaterialCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None, material_pk=None):
        material, err = self._check_access(material_pk, request)
        if err:
            return err
            
        from .models import MaterialComment
        try:
            comment = MaterialComment.objects.get(pk=pk, material=material)
        except MaterialComment.DoesNotExist:
            return Response({'error': 'Comment not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Only the comment author or the material owner can delete the comment
        if comment.user != request.user and material.student != request.user:
            return Response({'error': 'You cannot delete this comment.'}, status=status.HTTP_403_FORBIDDEN)
            
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
