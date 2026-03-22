#!/bin/bash

# Astro App VPS Deployment Script
# Usage: chmod +x deploy.sh && ./deploy.sh

set -e

DOMAIN="aadikarta.org"
EMAIL="hello@aadikarta.org"

echo "--- Updating System ---"
sudo apt update && sudo apt upgrade -y

echo "--- Installing Dependencies (Docker, Nginx, Certbot) ---"
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker

echo "--- Building and Starting Docker Containers ---"
docker-compose up -d --build

echo "--- Configuring Nginx ---"
sudo cp vps-nginx.conf /etc/nginx/sites-available/astro-app
sudo ln -sf /etc/nginx/sites-available/astro-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "--- Testing Nginx Configuration ---"
sudo nginx -t

echo "--- Reloading Nginx ---"
sudo systemctl reload nginx

echo "--- Setting up SSL with Certbot ---"
# Note: This will interactively ask for email and agreement unless --non-interactive is used
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

echo "--- Deployment Complete! ---"
echo "Check your site at: https://$DOMAIN"
echo "Admin panel: https://$DOMAIN/admin"
echo "API Docs: https://$DOMAIN/api/docs"
