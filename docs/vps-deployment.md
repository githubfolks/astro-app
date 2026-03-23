# VPS Deployment Guide - Aadikarta.org

This guide covers the steps to deploy the Aadikarta application on a Linux VPS (Ubuntu 22.04+ recommended).

## 1. Prerequisites
- A Linux VPS with SSH access.
- Domain names (`aadikarta.org`, `dev.aadikarta.org`, `api.aadikarta.org`) pointing to the VPS IP.
- Basic tools installed: `git`, `curl`, `nginx`.

## 2. Environment Setup

### Install Node.js & NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

## 3. Clone and Build the Application

### Clone Repository
```bash
git clone https://github.com/your-repo/aadikarta.git
cd aadikarta
```

### Build Frontend
```bash
cd web
npm install
npm run build
```

### Setup API (Example with Python/FastAPI)
```bash
cd ../api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 4. Run the Application

### Start Frontend (Vite/Astro with SPA)
If using Vite as a dev server in production (not recommended, but often done for quick dev hosts), use PM2:
```bash
pm2 start "npm run dev -- --port 3002 --host" --name aadikarta-web
```
*Better approach:* Serve `web/dist` via Nginx directly (static files).

### Start API
```bash
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name aadikarta-api
```

## 5. Nginx Configuration

1. Copy the provided `aadikarta.conf` to Nginx:
```bash
sudo cp aadikarta.conf /etc/nginx/sites-available/aadikarta.org
sudo ln -s /etc/nginx/sites-available/aadikarta.org /etc/nginx/sites-enabled/
```

2. Test Nginx syntax and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 6. SSL Configuration (Certbot)
Install Certbot and obtain certificates:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d aadikarta.org -d www.aadikarta.org -d dev.aadikarta.org -d api.aadikarta.org
```
Follow the interactive prompts to enable automatic HTTPS redirection.
