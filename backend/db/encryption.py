"""Symmetric encryption helpers for credentials at rest.

Uses Fernet (AES-128-CBC + HMAC-SHA256) keyed by `settings.CREDENTIALS_ENCRYPTION_KEY`.
Rotating the key invalidates all previously stored credentials.
"""
import json

from cryptography.fernet import Fernet, InvalidToken

from core.config import settings

_fernet = Fernet(settings.CREDENTIALS_ENCRYPTION_KEY.encode())


def encrypt_dict(data: dict) -> str:
    plaintext = json.dumps(data, separators=(",", ":")).encode()
    return _fernet.encrypt(plaintext).decode()


def decrypt_dict(ciphertext: str) -> dict:
    try:
        plaintext = _fernet.decrypt(ciphertext.encode())
    except InvalidToken as exc:
        raise ValueError(
            "Failed to decrypt credentials — CREDENTIALS_ENCRYPTION_KEY mismatch "
            "or corrupted ciphertext."
        ) from exc
    return json.loads(plaintext.decode())
