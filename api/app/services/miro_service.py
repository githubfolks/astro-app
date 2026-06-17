"""
MiroTalk SFU integration helpers.

The token + join-URL format here mirrors what the ``mirotalk/sfu`` server
expects (see its ``encodeToken``/``decodeToken`` and ``/join/`` route):

* The JWT is ``jwt.sign({ "data": <AES-encrypted JSON> }, JWT_SECRET)`` where the
  inner JSON is ``{"username", "password", "presenter"}``. The AES layer is
  CryptoJS's OpenSSL-compatible "Salted__" format (MD5 KDF, AES-256-CBC).
* ``presenter`` (string ``"true"``/``"false"``) is what grants moderator rights.
* The room id and display name are passed as URL query params, NOT in the token.
"""
import base64
import hashlib
import json
import os
from datetime import datetime, timedelta
from urllib.parse import urlencode

from jose import jwt
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

# MiroTalk Configuration
MIROTALK_URL = os.getenv("MIROTALK_URL", "http://localhost:4020").rstrip("/")
MIROTALK_JWT_SECRET = os.getenv("MIROTALK_JWT_SECRET", "mirotalksfu_jwt_secret")
# password embedded in the token. Only enforced when the SFU runs with host
# protection / user_auth; harmless otherwise. Keep in sync with the SFU host config.
MIROTALK_PEER_PASSWORD = os.getenv("MIROTALK_PEER_PASSWORD", "password")
ALGORITHM = "HS256"


def _evp_bytes_to_key(password: bytes, salt: bytes, key_len: int = 32, iv_len: int = 16):
    """Replicate OpenSSL's EVP_BytesToKey (MD5) used by CryptoJS.AES with a passphrase."""
    d = b""
    derived = b""
    while len(derived) < key_len + iv_len:
        d = hashlib.md5(d + password + salt).digest()
        derived += d
    return derived[:key_len], derived[key_len:key_len + iv_len]


def _cryptojs_aes_encrypt(plaintext: str, passphrase: str) -> str:
    """Produce a CryptoJS.AES.encrypt(plaintext, passphrase)-compatible base64 string."""
    salt = os.urandom(8)
    key, iv = _evp_bytes_to_key(passphrase.encode("utf-8"), salt)

    data = plaintext.encode("utf-8")
    pad_len = 16 - (len(data) % 16)
    data += bytes([pad_len]) * pad_len  # PKCS7

    encryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).encryptor()
    ct = encryptor.update(data) + encryptor.finalize()

    return base64.b64encode(b"Salted__" + salt + ct).decode("utf-8")


def _cryptojs_aes_decrypt(ciphertext_b64: str, passphrase: str) -> str:
    """Inverse of :func:`_cryptojs_aes_encrypt` — decrypt a CryptoJS "Salted__" string."""
    raw = base64.b64decode(ciphertext_b64)
    if raw[:8] != b"Salted__":
        raise ValueError("Not a CryptoJS salted payload")
    salt, ct = raw[8:16], raw[16:]
    key, iv = _evp_bytes_to_key(passphrase.encode("utf-8"), salt)

    decryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()
    padded = decryptor.update(ct) + decryptor.finalize()
    return padded[:-padded[-1]].decode("utf-8")  # strip PKCS7


def generate_miro_token(user_id: int, full_name: str, room_id: str, role: str,
                        expires_delta: timedelta = None) -> str:
    """
    Generate a MiroTalk SFU-compatible JWT.

    ``role`` should be ``'moderator'`` (-> presenter) or ``'participant'``.
    Note: ``room_id``/``full_name`` are accepted for API compatibility but the SFU
    reads the room and display name from the URL, not the token.
    """
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=2))

    # username carries our DB user id so the attendance webhook can recover identity
    # from peer_info.peer_token. When the SFU runs with host protection, set
    # MIROTALK_PEER_USERNAME/PASSWORD instead and map attendance another way.
    inner = json.dumps({
        "username": str(user_id),
        "password": MIROTALK_PEER_PASSWORD,
        "presenter": "true" if role == "moderator" else "false",
    })
    encrypted = _cryptojs_aes_encrypt(inner, MIROTALK_JWT_SECRET)

    return jwt.encode({"data": encrypted, "exp": expire}, MIROTALK_JWT_SECRET, algorithm=ALGORITHM)


def decode_miro_token(token: str) -> dict:
    """Verify + decrypt a MiroTalk token, returning ``{username, password, presenter}``."""
    decoded = jwt.decode(token, MIROTALK_JWT_SECRET, algorithms=[ALGORITHM])
    return json.loads(_cryptojs_aes_decrypt(decoded["data"], MIROTALK_JWT_SECRET))


def get_join_url(user_id: int, full_name: str, room_id: str, role: str) -> str:
    """Full MiroTalk SFU join URL: room + display name as query params, token for auth/role."""
    token = generate_miro_token(user_id, full_name, room_id, role)
    params = urlencode({
        "room": room_id,
        "name": full_name,
        "token": token,
        "audio": "1",
        "video": "1",
        "screen": "0",
        "notify": "0",
    })
    return f"{MIROTALK_URL}/join/?{params}"
