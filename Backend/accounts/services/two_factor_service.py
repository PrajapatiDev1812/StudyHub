"""
Core TOTP (Time-based One-Time Password) service for StudyHub 2FA.
Handles secret generation, QR code creation, OTP verification, and backup codes.
"""
import pyotp
import qrcode
import io
import base64
import secrets
import string
import logging
from django.contrib.auth.hashers import make_password, check_password
from django.conf import settings

logger = logging.getLogger(__name__)

APP_NAME = "StudyHub"
OTP_WINDOW = 1  # Allow ±1 time window (30s each) for clock drift


def generate_totp_secret() -> str:
    """Generate a secure, random Base32 TOTP secret."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, username: str) -> str:
    """Build the otpauth:// URI for authenticator apps."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=APP_NAME)


def generate_qr_code_base64(totp_uri: str) -> str:
    """
    Generate a QR code from a TOTP URI and return it as a base64-encoded PNG.
    The frontend can render this directly as: <img src="data:image/png;base64,..." />
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(totp_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


def verify_totp(secret: str, otp_code: str) -> bool:
    """
    Verify a TOTP code against the given secret.
    Allows ±1 time window (OTP_WINDOW) to account for clock drift between
    the user's device and the server.
    """
    if not secret or not otp_code:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(otp_code, valid_window=OTP_WINDOW)


# ----- Backup Code Utilities -----

BACKUP_CODE_LENGTH = 8
BACKUP_CODE_COUNT = 10
BACKUP_CODE_CHARS = string.ascii_uppercase + string.digits


def generate_backup_codes() -> tuple[list[str], list[str]]:
    """
    Generate 10 one-time backup codes.
    Returns: (plaintext_codes, hashed_codes)
    - plaintext_codes are shown ONCE to the user.
    - hashed_codes are stored in the DB.
    """
    plaintext = []
    hashed = []
    for _ in range(BACKUP_CODE_COUNT):
        code = ''.join(secrets.choice(BACKUP_CODE_CHARS) for _ in range(BACKUP_CODE_LENGTH))
        plaintext.append(code)
        hashed.append(make_password(code))
    return plaintext, hashed


def verify_backup_code(stored_hashes: list, submitted_code: str) -> tuple[bool, list]:
    """
    Check a submitted backup code against the stored hashed list.
    If matched, that code is removed (one-time use).
    Returns: (is_valid: bool, remaining_hashes: list)
    """
    for i, hashed in enumerate(stored_hashes):
        if check_password(submitted_code, hashed):
            remaining = stored_hashes[:i] + stored_hashes[i+1:]
            logger.warning(f"Backup code used. {len(remaining)} codes remaining.")
            return True, remaining
    return False, stored_hashes


# ----- Temp Token Utilities (Redis-backed) -----

def generate_temp_token() -> str:
    """Generate a cryptographically secure temp token for the 2FA step-up phase."""
    return secrets.token_urlsafe(32)


def store_temp_token(cache, user_id: int, token: str):
    """Store temp_token → user_id in cache with configured TTL."""
    ttl = getattr(settings, 'TWO_FA_TEMP_TOKEN_TTL', 300)
    cache.set(f"2fa_temp:{token}", user_id, timeout=ttl)


def resolve_temp_token(cache, token: str):
    """
    Look up a temp token in cache. Returns user_id or None.
    This is a one-time check — the token is NOT deleted here;
    it is deleted only on successful OTP verification.
    """
    return cache.get(f"2fa_temp:{token}")


def consume_temp_token(cache, token: str):
    """Permanently remove a temp token (used after successful OTP verify)."""
    cache.delete(f"2fa_temp:{token}")
