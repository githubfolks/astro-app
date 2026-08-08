#!/usr/bin/env bash
# One-off smoke test for the Umami analytics setup. Run on the VPS after
# bringing the `umami` service up, to confirm the schema, container, and
# public endpoint are all working before wiring the real website ID into
# web/index.html.
# Postgres container name differs by environment: the VPS runs a standalone
# `postgres-app` container (see `docker stats` on the host); local dev uses
# native Postgres on the Mac host, not a container. Override via env var:
#   POSTGRES_CONTAINER=postgres-app ./deploy/check-umami.sh
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-postgres-app}"

set -euo pipefail

echo "1. Postgres schema 'umami_db' exists?"
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d app_db -tAc \
  "SELECT 1 FROM information_schema.schemata WHERE schema_name = 'umami_db';" \
  | grep -q 1 && echo "   OK" || echo "   MISSING - run: CREATE SCHEMA IF NOT EXISTS umami_db;"

echo "2. astro_umami container running?"
docker inspect -f '{{.State.Status}}' astro_umami 2>/dev/null || echo "   NOT FOUND"

echo "3. Umami tables migrated?"
docker exec "$POSTGRES_CONTAINER" psql -U postgres -d app_db -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'umami_db';" \
  | xargs -I{} echo "   {} tables in umami_db (expect ~20+ once migrated)"

echo "4. App responding locally (port 4003)?"
curl -sf -o /dev/null -w "   HTTP %{http_code}\n" http://localhost:4003/ || echo "   FAILED"

echo "5. Public endpoint responding?"
curl -sf -o /dev/null -w "   HTTP %{http_code}\n" http://65.20.90.180:4003/ || echo "   FAILED (check firewall + docker port mapping)"

echo "Done. If all OK, log into http://65.20.90.180:4003, create the admin account,"
echo "add aadikarta.org as a website, and paste its website ID into web/index.html."
