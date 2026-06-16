from datetime import datetime, timedelta
from jose import jwt
import os
from .. import models_edu

# MiroTalk Configuration
MIROTALK_URL = os.getenv("MIROTALK_URL", "https://mirotalk.herokuapp.com")
MIROTALK_JWT_SECRET = os.getenv("MIROTALK_JWT_SECRET", "mirotalk_secret_key")
ALGORITHM = "HS256"

def generate_miro_token(user_id: int, full_name: str, room_id: str, role: str, expires_delta: timedelta = None):
    """
    Generates a secure JWT token for MiroTalk SFU.
    Role should be 'moderator' or 'participant'.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=2) # Default 2 hours

    payload = {
        "room": room_id,
        "name": full_name,
        "role": role,
        "sub": str(user_id),
        "exp": expire
    }

    token = jwt.encode(payload, MIROTALK_JWT_SECRET, algorithm=ALGORITHM)
    return token

def get_join_url(user_id: int, full_name: str, room_id: str, role: str):
    """
    Returns the full MiroTalk URL with the JWT token for secure joining.
    """
    token = generate_miro_token(user_id, full_name, room_id, role)
    # MiroTalk SFU usually accepts token as a query parameter or in the URL path
    # For many MiroTalk SFU setups, the format is: [URL]/join?room=[ROOM]&token=[TOKEN]
    # Or [URL]/[ROOM]?token=[TOKEN]
    return f"{MIROTALK_URL}/{room_id}?token={token}"
