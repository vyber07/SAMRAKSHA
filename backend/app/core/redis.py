import os
import redis.asyncio as aioredis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

def get_redis() -> aioredis.Redis:
    """
    Returns a new Redis client instance bound to the current running event loop.
    """
    return aioredis.from_url(REDIS_URL, decode_responses=True)

class LazyRedisProxy:
    """
    Lazy proxy that instantiates a Redis client dynamically per operation/request,
    preventing static binding to closed event loops during async test executions.
    """
    def __getattr__(self, name):
        client = get_redis()
        return getattr(client, name)

redis_client = LazyRedisProxy()
