# syntax=docker/dockerfile:1
# Build Stage — official Playwright image, not node:20-slim + apt-get: `npm run
# build` now includes a build-time prerender step (scripts/prerender.js) that
# needs a real Chromium, and this image ships it (and its OS deps) preinstalled,
# so there's no per-build apt-get/download cost. Keep the version tag in sync
# with the `playwright-core` version in package.json.
FROM mcr.microsoft.com/playwright:v1.61.0-noble AS build

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
