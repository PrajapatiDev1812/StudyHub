from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from .models import User, ManualRecoveryRequest, PasswordHistory
from .services.recovery_service import is_password_in_history

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        try:
            user = User.objects.get(id=data['user_id'])
            # Check password history
            if is_password_in_history(user, data['new_password']):
                raise serializers.ValidationError({"new_password": "You cannot reuse any of your last 5 passwords."})
                
            validate_password(data['new_password'], user)
        except User.DoesNotExist:
            # We don't reveal this to the user, but we need it for token validation
            pass
            
        return data

class ForgotUsernameSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ManualRecoveryRequestSerializer(serializers.ModelSerializer):
    recaptha_token = serializers.CharField(write_only=True, required=False) # Optional for now

    class Meta:
        model = ManualRecoveryRequest
        fields = [
            'full_name', 'email', 'username', 'enrollment_no', 
            'role_claimed', 'reason', 'recaptha_token'
        ]

class ManualRecoveryReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManualRecoveryRequest
        fields = ['status', 'admin_notes']
