# One-time backfill: astrologer profile photos uploaded before the resize-on-upload
# fix in app/routers/astrologers.py (upload_onboarding_photo) were saved at their
# original camera resolution and are served at 84-208px on the frontend. This
# resizes each one down to the same MAX_DIMENSION the upload endpoint now enforces.
#
# /static/* is served with `Cache-Control: immutable, max-age=31536000` (see
# main.py), so anyone who already cached a given URL would keep serving the old
# bytes for up to a year if we overwrote the file in place. Instead this writes a
# new file (new UUID name) and repoints profile_picture_url at it, leaving the old
# file untouched on disk (harmless orphan, not deleted — safer than guessing
# nothing else references it).
#
# Run from the api/ directory: python backfill_resize_astrologer_photos.py [--dry-run]

import io
import os
import sys
import uuid

from PIL import Image

from app.database import SessionLocal
from app import models

MAX_DIMENSION = 800
STATIC_PREFIX = "/static/"
UPLOAD_ROOT = "uploads"

dry_run = "--dry-run" in sys.argv


def resize_and_save(local_path: str) -> str | None:
    """Resizes local_path in place under a new filename if it's larger than
    MAX_DIMENSION in either dimension. Returns the new /static/... URL, or None
    if the file didn't need resizing / couldn't be processed."""
    try:
        with Image.open(local_path) as image:
            if image.width <= MAX_DIMENSION and image.height <= MAX_DIMENSION:
                return None

            image_format = image.format
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "A" in image.mode else "RGB")
            image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

            directory = os.path.dirname(local_path)
            ext = os.path.splitext(local_path)[1]
            new_filename = f"{uuid.uuid4().hex}{ext}"
            new_path = os.path.join(directory, new_filename)

            save_kwargs = {"optimize": True}
            if image_format == "JPEG":
                if image.mode == "RGBA":
                    image = image.convert("RGB")
                save_kwargs["quality"] = 85
            elif image_format == "WEBP":
                save_kwargs["quality"] = 85

            if not dry_run:
                image.save(new_path, format=image_format, **save_kwargs)

            rel = os.path.relpath(new_path, UPLOAD_ROOT)
            return f"{STATIC_PREFIX}{rel}"
    except Exception as e:
        print(f"  ! failed to process {local_path}: {e}")
        return None


def main():
    db = SessionLocal()
    profiles = (
        db.query(models.AstrologerProfile)
        .filter(models.AstrologerProfile.profile_picture_url.isnot(None))
        .filter(models.AstrologerProfile.profile_picture_url.like(f"{STATIC_PREFIX}%"))
        .all()
    )

    print(f"Found {len(profiles)} astrologer profile(s) with a locally-hosted photo.")
    updated = 0
    skipped_ok = 0
    missing = 0

    for profile in profiles:
        rel_path = profile.profile_picture_url[len(STATIC_PREFIX):]
        local_path = os.path.join(UPLOAD_ROOT, rel_path)

        if not os.path.isfile(local_path):
            print(f"  ! missing file for astrologer {profile.user_id}: {local_path}")
            missing += 1
            continue

        before_size = os.path.getsize(local_path)
        new_url = resize_and_save(local_path)
        if new_url is None:
            skipped_ok += 1
            continue

        after_size = os.path.getsize(os.path.join(UPLOAD_ROOT, new_url[len(STATIC_PREFIX):])) if not dry_run else None
        size_note = f"{before_size} -> {after_size} bytes" if after_size is not None else f"{before_size} bytes (dry run, size after unknown)"
        print(f"  astrologer {profile.user_id}: {profile.profile_picture_url} -> {new_url} ({size_note})")

        if not dry_run:
            profile.profile_picture_url = new_url
        updated += 1

    if dry_run:
        print(f"\n[DRY RUN] Would update {updated} photo(s); {skipped_ok} already small enough; {missing} missing file(s).")
    else:
        db.commit()
        print(f"\nUpdated {updated} photo(s); {skipped_ok} already small enough; {missing} missing file(s).")


if __name__ == "__main__":
    main()
