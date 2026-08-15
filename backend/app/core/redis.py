import os
import asyncio
import redis.asyncio as aioredis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

def get_redis() -> aioredis.Redis:
    """
    Returns a new Redis client instance bound to the current running event loop.
    """
    return aioredis.from_url(REDIS_URL, decode_responses=True)

redis_client = get_redis()
