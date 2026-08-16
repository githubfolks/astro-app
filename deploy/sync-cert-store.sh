#!/usr/bin/env bash
# STOPGAP (installed 2026-08-16, review by 2026-11-16): the global-proxy
# container mounts /root/global-proxy/certbot/conf as its cert store, but
# host renewal (certbot.timer/cron) renews the separate default store at
# /etc/letsencrypt instead. Nothing kept these in sync, so the container
# served an expired cert for hours before anyone noticed (aadikarta.org
# ERR_CERT_DATE_INVALID incident, 2026-08-16). This script copies the
# host store's cert into the container's store whenever the host store
# has a newer serial, and reloads global-proxy so it's actually used.
#
# This is a bridge, not the fix -- the real fix is repointing one store
# at the other so they can't diverge again. Remove this script + its cron
# entry once that's done.
set -euo pipefail

HOST_STORE="/etc/letsencrypt/live/aadikarta.org"
PROXY_STORE="/root/global-proxy/certbot/conf/live/aadikarta.org"
LOG="/root/global-proxy/certbot/sync-cert-store.log"

host_serial=$(openssl x509 -noout -serial -in "$HOST_STORE/cert.pem" | cut -d= -f2)
proxy_serial=$(openssl x509 -noout -serial -in "$PROXY_STORE/cert.pem" | cut -d= -f2)

if [ "$host_serial" = "$proxy_serial" ]; then
    exit 0
fi

echo "$(date -Iseconds) serial mismatch: host=$host_serial proxy=$proxy_serial -- syncing" >> "$LOG"

cp "$HOST_STORE/fullchain.pem" "$PROXY_STORE/fullchain.pem"
cp "$HOST_STORE/privkey.pem"   "$PROXY_STORE/privkey.pem"
cp "$HOST_STORE/cert.pem"      "$PROXY_STORE/cert.pem"
cp "$HOST_STORE/chain.pem"     "$PROXY_STORE/chain.pem"

if docker exec global-proxy nginx -t >> "$LOG" 2>&1; then
    docker exec global-proxy nginx -s reload >> "$LOG" 2>&1
    echo "$(date -Iseconds) synced and reloaded, now serving serial=$host_serial" >> "$LOG"
else
    echo "$(date -Iseconds) ERROR: nginx -t failed after copy, NOT reloaded -- investigate $PROXY_STORE" >> "$LOG"
    exit 1
fi
