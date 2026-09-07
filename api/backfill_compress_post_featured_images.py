# One-time backfill: blog post featured images generated before the
# encode_web_jpeg() compression step in app/routers/cms.py were stored as the
# image generator returned them (0.5-1 MB, lightly compressed) and are served
# as-is to the /blog index's ~400px-wide cards. This downscales each one to
# 1200px on the long edge and re-encodes at quality 80, matching what the
# generate endpoints now do on write.
#
# /static/* is served with `Cache-Control: immutable, max-age=31536000` (see
# main.py), so overwriting in place would let already-cached clients keep the
# old bytes for up to a year. Instead this writes a new file (new UUID name)
# and repoints post.featured_image (and any MediaGalleryImage row that shared
# the exact same URL) at it, leaving the old file as a harmless orphan.
#
# Run from the api/ directory: python backfill_compress_post_featured_images.py [--dry-run]

import io
import os
import sys
import uuid

from PIL import Image

from app.database import SessionLocal
from app import models

MAX_DIMENSION = 1200
MAX_BYTES = 200 * 1024
STATIC_PREFIX = "/static/"
UPLOAD_ROOT = "uploads"

dry_run = "--dry-run" in sys.argv


def compress(local_path: str) -> str | None:
    """Re-encode local_path under a new filename if it's oversized (either
    dimension over MAX_DIMENSION, or file larger than MAX_BYTES). Returns the
    new /static/... URL, or None if it didn't need work / couldn't be read."""
    try:
        if os.path.getsize(local_path) <= MAX_BYTES:
            with Image.open(local_path) as probe:
                if probe.width <= MAX_DIMENSION and probe.height <= MAX_DIMENSION:
                    return None

        with Image.open(local_path) as image:
            image.load()
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

            new_filename = f"{uuid.uuid4().hex}.jpg"
            new_path = os.path.join(os.path.dirname(local_path), new_filename)
            if not dry_run:
                image.save(new_path, format="JPEG", quality=80, optimize=True, progressive=True)

            rel = os.path.relpath(new_path, UPLOAD_ROOT)
            return f"{STATIC_PREFIX}{rel}"
    except Exception as e:
        print(f"  ! failed to process {local_path}: {e}")
        return None


def main():
    db = SessionLocal()
    posts = (
        db.query(models.Post)
        .filter(models.Post.featured_image.isnot(None))
        .filter(models.Post.featured_image.like(f"{STATIC_PREFIX}%"))
        .all()
    )

    print(f"Found {len(posts)} post(s) with a locally-hosted featured image.")
    updated = 0
    skipped_ok = 0
    missing = 0

    for post in posts:
        old_url = post.featured_image
        local_path = os.path.join(UPLOAD_ROOT, old_url[len(STATIC_PREFIX):])

        if not os.path.isfile(local_path):
            print(f"  ! missing file for post {post.id}: {local_path}")
            missing += 1
            continue

        before_size = os.path.getsize(local_path)
        new_url = compress(local_path)
        if new_url is None:
            skipped_ok += 1
            continue

        after_size = (
            os.path.getsize(os.path.join(UPLOAD_ROOT, new_url[len(STATIC_PREFIX):]))
            if not dry_run else None
        )
        size_note = (
            f"{before_size} -> {after_size} bytes" if after_size is not None
            else f"{before_size} bytes (dry run)"
        )
        print(f"  post {post.id}: {old_url} -> {new_url} ({size_note})")

        if not dry_run:
            post.featured_image = new_url
            shared = (
                db.query(models.MediaGalleryImage)
                .filter(models.MediaGalleryImage.url == old_url)
                .all()
            )
            for row in shared:
                row.url = new_url
        updated += 1

    if dry_run:
        print(f"\n[DRY RUN] Would update {updated} image(s); {skipped_ok} already fine; {missing} missing.")
    else:
        db.commit()
        print(f"\nUpdated {updated} image(s); {skipped_ok} already fine; {missing} missing.")


if __name__ == "__main__":
    main()
