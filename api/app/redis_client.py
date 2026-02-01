import redis
import os
import logging

logger = logging.getLogger(__name__)

# Redis Connection URL
# If running in Docker, it should correspond to the service name 'redis'
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    # Ping to check connection
    # redis_client.ping() # Lazy connection might not fail here immediately
except Exception as e:
    logger.error(f"Failed to initialize Redis: {e}")
    redis_client = None

def get_redis():
    return redis_client
