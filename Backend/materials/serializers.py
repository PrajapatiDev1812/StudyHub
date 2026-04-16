from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentMaterial, MaterialAccess, MaterialUserNote, MaterialComment

User = get_user_model()


class MaterialAccessSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = MaterialAccess
        fields = ['id', 'user', 'username', 'email', 'can_view', 'can_edit', 'can_comment', 'granted_at']
        read_only_fields = ['id', 'granted_at']


class ShareMaterialSerializer(serializers.Serializer):
    """Used for granting access to a specific user via email."""
    email = serializers.EmailField()
    can_view = serializers.BooleanField(default=True)
    can_edit = serializers.BooleanField(default=False)
    can_comment = serializers.BooleanField(default=True)

    def validate_email(self, value):
        try:
            User.objects.get(email__iexact=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with that email address.")
        return value


class MaterialUserNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialUserNote
        fields = ['id', 'note_content', 'updated_at']
        read_only_fields = ['id', 'updated_at']


class MaterialCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = MaterialComment
        fields = ['id', 'username', 'content', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']


class StudentMaterialSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    file_size = serializers.ReadOnlyField()
    # The caller's personal note (injected at view level)
    my_note = serializers.SerializerMethodField()
    # Access grants (shared users) — owner-only context
    access_grants = MaterialAccessSerializer(many=True, read_only=True)
    # Caller's access permissions (for shared materials)
    my_access = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = StudentMaterial
        fields = [
            'id', 'student', 'student_username',
            'title', 'description',
            'material_type',
            'file', 'external_url', 'note_text',
            'subject', 'topic', 'tags',
            'visibility', 'folder_name', 'favorite',
            'ai_indexed', 'source',
            'is_deleted',
            'uploaded_at', 'updated_at',
            'file_size',
            'my_note', 'access_grants', 'my_access', 'is_owner',
        ]
        read_only_fields = ['id', 'student', 'uploaded_at', 'updated_at', 'ai_indexed', 'source']

    def get_my_note(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        try:
            note = MaterialUserNote.objects.get(material=obj, user=request.user)
            return MaterialUserNoteSerializer(note).data
        except MaterialUserNote.DoesNotExist:
            return None

    def get_my_access(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        if obj.student == request.user:
            return {'can_view': True, 'can_edit': True, 'can_comment': True}
        try:
            access = MaterialAccess.objects.get(material=obj, user=request.user)
            return {
                'can_view': access.can_view,
                'can_edit': access.can_edit,
                'can_comment': access.can_comment,
            }
        except MaterialAccess.DoesNotExist:
            return None

    def get_is_owner(self, obj):
        request = self.context.get('request')
        return request and obj.student == request.user
