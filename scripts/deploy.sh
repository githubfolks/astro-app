#!/bin/bash

# Astro App VPS Deployment Script
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

DOMAIN="dev.aadikarta.org"
EMAIL="hello@aadikarta.org"

echo "--- Updating System ---"
sudo apt update && sudo apt upgrade -y

echo "--- Installing Dependencies (Docker V2, Nginx, Certbot) ---"
# Remove old version of docker-compose if present
sudo apt-get remove -y docker-compose
# Install Docker Compose V2 plugin
sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker

echo "--- Building and Starting Docker Containers ---"
# Using Docker V2 (docker compose) instead of V1 (docker-compose)
docker compose up -d --build

echo "--- Configuring Nginx ---"
sudo cp vps-nginx.conf /etc/nginx/sites-available/astro-app
sudo ln -sf /etc/nginx/sites-available/astro-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "--- Testing Nginx Configuration ---"
sudo nginx -t

echo "--- Reloading Nginx ---"
sudo systemctl reload nginx

echo "--- Setting up SSL with Certbot ---"
echo "Checking if $DOMAIN resolves to an IP..."

# Use ping or curl as fallback if host/dig is missing
DNS_RESOLVES=false
if command -v host >/dev/null 2>&1; then
    if host "$DOMAIN" >/dev/null 2>&1; then DNS_RESOLVES=true; fi
elif command -v ping >/dev/null 2>&1; then
    if ping -c 1 "$DOMAIN" >/dev/null 2>&1; then DNS_RESOLVES=true; fi
fi

if [ "$DNS_RESOLVES" = true ]; then
    echo "DNS is ready. Attempting SSL setup..."
    # Disable exit-on-error temporarily for Certbot
    set +e
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
    set -e
else
    echo "****************************************************************"
    echo "WARNING: DNS for $DOMAIN is not yet pointing to this server."
    echo "****************************************************************"
    echo "1. Go to BigRock (or your DNS provider)."
    echo "2. Add an 'A' record for $DOMAIN pointing to this VPS IP."
    echo "3. Once DNS propagates, run: sudo certbot --nginx -d $DOMAIN"
    echo "4. Your site will be available via HTTP for now."
fi

echo "--- Deployment Complete! ---"
echo "Check your site at: https://$DOMAIN"
echo "Admin panel: https://$DOMAIN/admin"
echo "API Docs: https://$DOMAIN/api/docs"
