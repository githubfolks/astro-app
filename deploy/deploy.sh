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
echo "$(date -Iseconds) deploy triggered" >> "$LOG"
git pull origin main >> "$LOG" 2>&1
docker compose -f docker-compose.yml -f docker-compose.vps.yml build api web >> "$LOG" 2>&1
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d api web >> "$LOG" 2>&1
echo "$(date -Iseconds) deploy complete" >> "$LOG"
