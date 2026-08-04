#!/usr/bin/env bash
# Full production deploy: git pull + rebuild api/web. Invoked by the
# `webhook` daemon (see deploy/hooks.json) after CI passes on `main` — see
# the `deploy` job in .github/workflows/tests.yml for the trigger side.
set -euo pipefail

DEPLOY_DIR="/var/www/aadikarta/production"
LOG="/var/log/aadikarta-deploy.log"

cd "$DEPLOY_DIR"
echo "$(date -Iseconds) deploy triggered" >> "$LOG"
git pull origin main >> "$LOG" 2>&1
docker compose -f docker-compose.yml -f docker-compose.vps.yml build api web >> "$LOG" 2>&1
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d api web >> "$LOG" 2>&1
echo "$(date -Iseconds) deploy complete" >> "$LOG"
