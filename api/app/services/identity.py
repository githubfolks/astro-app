"""Identity protection helpers.

Astrologers should not see a seeker's full legal name (or any contact info).
Birth details remain visible because they are required for the reading.
"""


def mask_name(full_name: str | None) -> str:
    """'Vikram Kumar' -> 'Vikram K.'  ; single name unchanged ; empty -> 'Seeker'."""
    if not full_name or not full_name.strip():
        return "Seeker"
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]} {parts[-1][0].upper()}."
