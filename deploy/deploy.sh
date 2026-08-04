#!/usr/bin/env bash
# Full production deploy: git pull + rebuild api/web. Invoked by the
# `webhook` daemon (see deploy/hooks.json) after CI passes on `main` — see
# the `deploy` job in .github/workflows/tests.yml for the trigger side.
set -euo pipefail

DEPLOY_DIR="/root/aadikarta-app/production"
# Lives inside DEPLOY_DIR (rather than /var/log) because this script runs
# inside the webhook container, which only bind-mounts DEPLOY_DIR — nothing
# written outside it would survive a container restart.
LOG="$DEPLOY_DIR/deploy.log"

cd "$DEPLOY_DIR"

if [ -z "${DEPLOY_REEXECED:-}" ]; then
    echo "$(date -Iseconds) deploy triggered" >> "$LOG"
    git pull origin main >> "$LOG" 2>&1
    # `git pull` just replaced this very file on disk (new inode via
    # checkout), but bash already has the old one open and would keep
    # executing stale buffered content for the rest of this process —
    # silently running last commit's deploy steps. Re-exec as a fresh
    # process so it opens whatever is actually on disk now.
    export DEPLOY_REEXECED=1
    exec "$0"
fi

# Built sequentially, not `build api web` in one call — Compose builds
# services in parallel by default, and web's build runs a CPU-heavy
# headless-Chromium prerender step (scripts/prerender.js) that was losing
# the CPU race against api's build on this VPS, causing routes (e.g. the
# homepage) to time out mid-prerender and silently ship the unrendered SPA
# shell to crawlers.
docker compose -f docker-compose.yml -f docker-compose.vps.yml build api >> "$LOG" 2>&1
docker compose -f docker-compose.yml -f docker-compose.vps.yml build web >> "$LOG" 2>&1
docker compose -f docker-compose.yml -f docker-compose.vps.yml build admin >> "$LOG" 2>&1
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d api web admin >> "$LOG" 2>&1
echo "$(date -Iseconds) deploy complete" >> "$LOG"
