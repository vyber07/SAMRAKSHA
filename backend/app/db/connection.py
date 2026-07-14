from sqlalchemy.ext.asyncio import (
    create_async_engine, AsyncSession, async_sessionmaker
)
from sqlalchemy.pool import NullPool
from sqlalchemy import text
import os
import re
import structlog

logger = structlog.get_logger()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(
    DATABASE_URL,
    poolclass=NullPool,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        logger.info("DB connection pool initialized")

async def close_db():
    await engine.dispose()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def convert_query(query: str, params: list = None) -> tuple[str, dict]:
    CAST_RE = re.compile(r'::([\w.]+(?:\[\])?)')
    casts: dict[str, str] = {}

    def _stash(m: re.Match) -> str:
        key = f"__CAST{len(casts)}__"
        casts[key] = m.group(0)
        return key

    q = CAST_RE.sub(_stash, query)
    q = re.sub(r'\$(\d+)', r':p\1', q)
    for key, cast in casts.items():
        q = q.replace(key, cast)

    param_dict = {}
    if params:
        for idx, val in enumerate(params):
            param_dict[f"p{idx+1}"] = val

    return q, param_dict

async def execute(
    db: AsyncSession,
    query: str,
    params: list = None
):
    """Execute SQLAlchemy query with proper parameter handling."""
    try:
        converted_query, param_dict = convert_query(query, params)
        result = await db.execute(text(converted_query), param_dict)
        return result
    except Exception as e:
        logger.error("Execute query failed", query=query[:50], error=str(e))
        raise

async def fetch_all(
    db: AsyncSession,
    query: str,
    params: list = None
) -> list:
    """Fetch all rows as list of dicts."""
    try:
        result = await execute(db, query, params)
        rows = result.fetchall()
        return [dict(row._mapping) for row in rows] if rows else []
    except Exception as e:
        logger.error("Fetch all failed", query=query[:50], error=str(e))
        return []

async def fetch_one(
    db: AsyncSession,
    query: str,
    params: list = None
) -> dict | None:
    """Fetch single row as dict."""
    try:
        result = await execute(db, query, params)
        row = result.fetchone()
        return dict(row._mapping) if row else None
    except Exception as e:
        logger.error("Fetch one failed", query=query[:50], error=str(e))
        return None
