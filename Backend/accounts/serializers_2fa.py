"""
All serializers related to the 2FA authentication flow.
"""
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    """Step 1: Validate username + password."""
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True)


class VerifyOTPSerializer(serializers.Serializer):
    """Step 2: Verify OTP code against temp token."""
    temp_token = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=9)  # 6-digit TOTP or 8-char backup


class Setup2FASerializer(serializers.Serializer):
    """Requires password confirmation before revealing 2FA setup info."""
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True)


class Activate2FASerializer(serializers.Serializer):
    """Confirm the user has scanned the QR code, verify first OTP."""
    otp = serializers.CharField(min_length=6, max_length=6)


class Disable2FASerializer(serializers.Serializer):
    """Requires both password AND current OTP to disable 2FA."""
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True)
    otp = serializers.CharField(min_length=6, max_length=6)


class BackupCodesRegenerateSerializer(serializers.Serializer):
    """Requires password confirmation before regenerating backup codes."""
    password = serializers.CharField(style={'input_type': 'password'}, write_only=True)
