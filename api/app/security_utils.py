import re
from fastapi import HTTPException, status

def validate_password_strength(password: str) -> None:
    """
    Validates that a password meets complexity rules:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter."
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number."
        )

def sanitize_input_string(text: str, max_length: int = 5000) -> str:
    """
    Sanitizes user-provided string input:
    - Truncates to max_length
    - Strips dangerous control characters (except standard whitespace/newlines)
    - Strips basic script injection tags
    """
    if not text:
        return ""
    
    # Truncate
    text = text[:max_length]
    
    # Remove null bytes and non-printable control characters
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    
    # Strip dangerous inline <script> tags
    text = re.sub(r'(?i)<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', text)
    
    return text.strip()
