"""One-off script: run locally (not on the server) to authorize Content
Studio's YouTube upload + metadata-edit access and print a refresh token to
save in .env.

Usage (reuses the existing OAuth client -- reads YOUTUBE_CLIENT_ID /
YOUTUBE_CLIENT_SECRET from your local .env, no client_secret.json needed):
    pip install google-auth-oauthlib python-dotenv
    python scripts/get_youtube_refresh_token.py

Usage (with a downloaded client_secret.json instead, e.g. for a fresh OAuth
client):
    python scripts/get_youtube_refresh_token.py /path/to/client_secret.json

A browser window opens -- log in as the Google account that owns/manages the
target YouTube channel and approve. The refresh token this prints authorizes
uploads to (and edits of) whichever channel that account is signed into, and
does not expire until manually revoked from the Google account's third-party
access settings.
"""
import os
import sys

from dotenv import load_dotenv
from google_auth_oauthlib.flow import InstalledAppFlow

# youtube.upload alone only authorizes videos.insert (the initial upload).
# Editing an already-published video's title/description/tags via
# videos.update requires the broader youtube.force-ssl scope -- see
# content_studio_youtube.py's update_youtube_video(). Re-run this script and
# replace YOUTUBE_REFRESH_TOKEN if the existing token predates this scope.
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]


def _build_flow():
    if len(sys.argv) == 2:
        return InstalledAppFlow.from_client_secrets_file(sys.argv[1], SCOPES)

    # Matches app/database.py's convention: .env.development or
    # .env.production depending on APP_ENV, not a plain .env.
    load_dotenv(f".env.{os.getenv('APP_ENV', 'development')}")
    client_id = os.getenv("YOUTUBE_CLIENT_ID")
    client_secret = os.getenv("YOUTUBE_CLIENT_SECRET")
    if not client_id or not client_secret:
        print(
            "YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET not found in .env, and no "
            "client_secret.json path was given.\n"
            "Usage: python get_youtube_refresh_token.py [/path/to/client_secret.json]"
        )
        sys.exit(1)

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }
    return InstalledAppFlow.from_client_config(client_config, SCOPES)


def main():
    flow = _build_flow()
    # access_type=offline + prompt=consent forces Google to issue a refresh
    # token every run -- without prompt=consent, re-running this against an
    # account that already approved once can silently return no refresh token.
    credentials = flow.run_local_server(port=0, access_type="offline", prompt="consent")

    print("\nAuthorization successful. Save these in .env:\n")
    print(f"YOUTUBE_CLIENT_ID={credentials.client_id}")
    print(f"YOUTUBE_CLIENT_SECRET={credentials.client_secret}")
    print(f"YOUTUBE_REFRESH_TOKEN={credentials.refresh_token}")


if __name__ == "__main__":
    main()
