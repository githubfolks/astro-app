# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    git \
    ffmpeg \
    fonts-noto-core \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies. The cache mount persists pip's wheel cache across
# builds (in the BuildKit cache store, not the image itself), so even when this
# layer has to re-run — e.g. requirements.txt changed — it isn't re-downloading
# every wheel from PyPI from scratch.
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application.
# Apply any pending DB migrations before serving so the schema always matches the
# code on deploy (prevents "column does not exist" drift). SQLALCHEMY_DATABASE_URL
# is injected via compose and read by alembic/env.py.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
