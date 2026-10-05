"""
ai/encryption.py
------------------
Encryption utilities for storing AI provider API keys securely.

Uses Fernet symmetric encryption with a master key loaded from
the AI_SECRET_KEY environment variable. The master key must be
a 32-byte URL-safe Base64-encoded string (Fernet key format).

Generate a new master key:
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

Usage:
    from ai.encryption import encrypt_value, decrypt_value

    encrypted = encrypt_value("sk-abc123...")
    plaintext = decrypt_value(encrypted)
"""

import os
import logging
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)

# ── Master Key Management ─────────────────────────────────────────────────────

_fernet_instance = None


def _get_fernet() -> Fernet:
    """
    Lazily initialise and cache the Fernet cipher using AI_SECRET_KEY.

    If AI_SECRET_KEY is not a valid Fernet key (44 chars, base64), we
    derive a proper key via SHA-256 hash so any passphrase works.
    """
    global _fernet_instance
    if _fernet_instance is not None:
        return _fernet_instance

    secret = os.environ.get('AI_SECRET_KEY', '')
    if not secret:
        # Fall back to Django SECRET_KEY as a last resort
        try:
            # pyrefly: ignore [missing-import]
            from django.conf import settings
            secret = settings.SECRET_KEY
        except Exception:
            pass

    if not secret:
        raise ValueError(
            "AI_SECRET_KEY environment variable is not set. "
            "Cannot encrypt/decrypt API keys without a master key."
        )

    # Derive a valid Fernet key from any passphrase
    key_bytes = hashlib.sha256(secret.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)

    _fernet_instance = Fernet(fernet_key)
    return _fernet_instance


# ── Public API ────────────────────────────────────────────────────────────────

def encrypt_value(plaintext: str) -> str:
    """
    Encrypt a plaintext string and return the ciphertext as a UTF-8 string.

    Parameters
    ----------
    plaintext : The value to encrypt (e.g. an API key).

    Returns
    -------
    str — Fernet-encrypted ciphertext (safe to store in DB).
    """
    if not plaintext:
        return ''
    f = _get_fernet()
    return f.encrypt(plaintext.encode('utf-8')).decode('utf-8')


def decrypt_value(ciphertext: str) -> str:
    """
    Decrypt a ciphertext string and return the original plaintext.

    Parameters
    ----------
    ciphertext : The encrypted value from the database.

    Returns
    -------
    str — The original plaintext value.

    Raises
    ------
    ValueError : If the ciphertext is invalid or the master key has changed.
    """
    if not ciphertext:
        return ''
    try:
        f = _get_fernet()
        return f.decrypt(ciphertext.encode('utf-8')).decode('utf-8')
    except InvalidToken:
        logger.error(
            "[Encryption] Failed to decrypt value — "
            "master key may have changed or data is corrupted."
        )
        raise ValueError("Failed to decrypt. Master key may have changed.")


def mask_api_key(api_key: str) -> str:
    """
    Mask an API key for display in the admin UI.
    Shows only the first 4 and last 4 characters.

    Example: "sk-abc123...xyz789" → "sk-a...9"
    """
    if not api_key or len(api_key) <= 8:
        return '****'
    return f"{api_key[:4]}...{api_key[-4:]}"
