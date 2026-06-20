"""Regenerate the committed OpenAPI snapshot (api/openapi.json).

Run this whenever you intentionally change the API surface (routes, request/
response schemas), then commit the updated openapi.json:

    python scripts/dump_openapi.py

The snapshot is what test_openapi_contract.py diffs against to catch accidental
frontend/backend contract drift.
"""
import json
import os
import sys

# The app requires these at import time; match the test environment.
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("SQLALCHEMY_DATABASE_URL", "sqlite://")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app  # noqa: E402

OUTPUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "openapi.json"))


def main():
    schema = app.openapi()
    with open(OUTPUT, "w") as f:
        json.dump(schema, f, indent=2, sort_keys=True)
        f.write("\n")
    print(f"Wrote {OUTPUT} ({len(schema['paths'])} paths)")


if __name__ == "__main__":
    main()
