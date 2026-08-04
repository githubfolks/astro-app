#!/usr/bin/env bash
# Rebuilds and redeploys the `web` service whenever a blog post has been
# published/updated more recently than the last successful build. Meant to
# run on a schedule (see VPS_DEPLOYMENT_GUIDE.md §7) so newly published posts
# don't sit un-prerendered (missing title/meta/OG/JSON-LD) until some
# unrelated deploy happens to rebuild the site.
set -euo pipefail

DEPLOY_DIR="/var/www/aadikarta/production"
MARKER="$DEPLOY_DIR/.last-content-build"
API_URL="https://api.aadikarta.org"
LOG="/var/log/aadikarta-rebuild.log"

latest=$(curl -sf "$API_URL/public/posts?skip=0&limit=1" \
  | python3 -c "import json,sys; p=json.load(sys.stdin)['posts']; print(max((x.get('updated_at') or x['published_at']) for x in p) if p else '')")

if [ -z "$latest" ]; then
  echo "$(date -Iseconds) skip: could not read latest post timestamp" >> "$LOG"
  exit 0
fi

last_built=$(cat "$MARKER" 2>/dev/null || echo "")

if [ "$latest" \> "$last_built" ]; then
  echo "$(date -Iseconds) rebuilding: newer content ($latest > ${last_built:-none})" >> "$LOG"
  cd "$DEPLOY_DIR"
  git pull origin main >> "$LOG" 2>&1
  docker compose -f docker-compose.yml -f docker-compose.vps.yml build --no-cache web >> "$LOG" 2>&1
  docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --force-recreate web >> "$LOG" 2>&1
  echo "$latest" > "$MARKER"
  echo "$(date -Iseconds) rebuild complete" >> "$LOG"
else
  echo "$(date -Iseconds) skip: up to date ($last_built)" >> "$LOG"
fi
