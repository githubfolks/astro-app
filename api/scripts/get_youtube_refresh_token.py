"""One-off script: run locally (not on the server) to authorize Content
Studio's YouTube upload access and print a refresh token to save in .env.

Usage:
    pip install google-auth-oauthlib
    python scripts/get_youtube_refresh_token.py /path/to/client_secret.json

A browser window opens -- log in as the Google account that owns/manages the
target YouTube channel and approve. The refresh token this prints authorizes
uploads to whichever channel that account is signed into, and does not expire
until manually revoked from the Google account's third-party access settings.
"""
import sys

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def main():
    if len(sys.argv) != 2:
        print("Usage: python get_youtube_refresh_token.py /path/to/client_secret.json")
        sys.exit(1)

    flow = InstalledAppFlow.from_client_secrets_file(sys.argv[1], SCOPES)
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
