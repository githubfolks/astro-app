#!/bin/bash

# Astro App VPS Deployment Script
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

DOMAIN="dev.aadikarta.org"
API_DOMAIN="api.aadikarta.org"
ADMIN_DOMAIN="admin.aadikarta.org"
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
echo "Attempting SSL setup for $DOMAIN, $API_DOMAIN, and $ADMIN_DOMAIN..."

# Disable exit-on-error temporarily for Certbot
set +e
sudo certbot --nginx -d "$DOMAIN" -d "$API_DOMAIN" -d "$ADMIN_DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
set -e

echo "--- Deployment Complete! ---"
echo "Web App: https://$DOMAIN"
echo "Admin App: https://$ADMIN_DOMAIN"
echo "API Docs: https://$API_DOMAIN/docs"

echo "--- Deployment Complete! ---"
echo "Check your site at: https://$DOMAIN"
echo "Admin panel: https://$DOMAIN/admin"
echo "API Docs: https://$DOMAIN/api/docs"
