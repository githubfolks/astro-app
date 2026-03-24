# VPS Deployment Guide: Separate Main & Staging

To host both the `main` (Landing Page) and `staging` (Full Codebase) branches on the same VPS, follow these steps to ensure isolation and proper routing.

## 1. Directory Structure

Create two separate directories on your VPS to house each "environment":

```bash
mkdir -p /var/www/aadikarta/production
mkdir -p /var/www/aadikarta/staging
```

## 2. Cloning the Branches

Clone the SAME repository into both folders, then switch each to the correct branch:

### For Production (Landing Page)
```bash
cd /var/www/aadikarta/production
git clone -b main https://github.com/githubfolks/astro-app.git .
```

### For Staging (Full Codebase)
```bash
cd /var/www/aadikarta/staging
git clone -b staging https://github.com/githubfolks/astro-app.git .
```

## 3. Docker Configuration

Since both environments run similar services (like `web` and `api`), they cannot use the same host ports. You must update the `docker-compose.yml` in each directory.

### Production (`/var/www/aadikarta/production/docker-compose.yml`)
Keep the standard ports:
- **API**: `8000`
- **Web**: `3002`
- **Admin**: `3001` (Note: In the `main` branch, `admin` is deleted, so this service is not needed).

### Staging (`/var/www/aadikarta/staging/docker-compose.yml`)
Change the host ports to avoid conflicts:
- **API**: `9000:8000`
- **Web**: `4002:80` (or similar)
- **Admin**: `4001:80`
- **Redis**: `7379:6379`
- **Mirotalk**: `4010:3010`

> [!TIP]
> Also, ensure you use different `container_name` values in each file (e.g., `astro_api_prod` vs `astro_api_staging`) to avoid name collisions.

## 4. Nginx Reverse Proxy Setup

Configure Nginx to route traffic based on the domain name.

### Example Nginx Config (`/etc/nginx/sites-available/aadikarta`)

```nginx
# 1. Main Landing Page- **Production (main)**: 
    - URL: `aadikarta.org`
    - Port: `3002` (Web only)
- **Staging (staging)**: 
    - URL: `dev.aadikarta.org`
    - API: `api.aadikarta.org`
    - Ports: `4002` (Web), `9000` (API)
server {
    listen 80;
    server_name aadikarta.org www.aadikarta.org;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 2. Staging Site (Full App)
server {
    listen 80;
    server_name staging.aadikarta.org;

    location / {
        proxy_pass http://localhost:4002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 3. API & Admin for Staging
server {
    listen 80;
    server_name api-staging.aadikarta.org;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
    }
}
```

## 5. Environment Variables

Ensure that the `.env` files in each directory point to the correct services and databases. Specifically, the `VITE_API_URL` should point to the correct API endpoint for that environment.

## 6. Deployment Workflow

1.  **Develop** on the `staging` branch (local or remote).
2.  **Pull** to the staging directory on VPS: `cd /var/www/aadikarta/staging && git pull origin staging && docker-compose up -d --build`.
3.  **Merge** `staging` into `main` when ready for production.
4.  **Pull** to the production directory on VPS: `cd /var/www/aadikarta/production && git pull origin main && docker-compose up -d --build`.
