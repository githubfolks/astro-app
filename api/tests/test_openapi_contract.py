"""Contract drift guard.

Fails if the live OpenAPI schema diverges from the committed snapshot
(api/openapi.json). This is the cheapest automated defense against the class of
frontend/backend mismatches we hit (e.g. signup changing from returning a token
to returning a verification message): any change to a route or request/response
schema forces a deliberate snapshot update + review.
"""
import json
import os

from app.main import app

SNAPSHOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "openapi.json"))


def test_openapi_matches_committed_snapshot():
    with open(SNAPSHOT) as f:
        committed = json.load(f)

    # Round-trip through JSON so the comparison is plain dicts/lists/strings.
    current = json.loads(json.dumps(app.openapi()))

    assert current == committed, (
        "OpenAPI schema drift detected.\n\n"
        "The API surface changed but api/openapi.json was not updated. If this "
        "change is intentional, regenerate and commit the snapshot:\n"
        "    python scripts/dump_openapi.py\n\n"
        "If it is NOT intentional, you likely broke the frontend/backend contract."
    )
