import os
import asyncio
import redis.asyncio as aioredis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

def get_redis() -> aioredis.Redis:
    """
    Returns a new Redis client instance bound to the current running event loop.
    """
    return aioredis.from_url(REDIS_URL, decode_responses=True)

class LazyRedisProxy:
    """
    Lazy proxy that reuses a Redis client instance per event loop,
    preventing static binding to closed event loops while eliminating connection pool leaks.
    """
    def __init__(self):
        self._clients = {}

    def _get_client(self) -> aioredis.Redis:
        try:
            loop = asyncio.get_running_loop()
            key = id(loop)
        except RuntimeError:
            key = 'default'

        client = self._clients.get(key)
        if client is None:
            client = get_redis()
            self._clients[key] = client
        return client

    def __getattr__(self, name):
        client = self._get_client()
        return getattr(client, name)

redis_client = LazyRedisProxy()

