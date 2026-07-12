
from sqlalchemy.ext.asyncio import (
    create_async_engine, AsyncSession, async_sessionmaker
)
from sqlalchemy.pool import NullPool
import os, structlog

logger = structlog.get_logger()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(
    DATABASE_URL,
    poolclass=NullPool,  # Simpler, works well with async
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

# Helper for raw parameterized queries
async def execute(
    db: AsyncSession,
    query: str,
    params: list = None
):
    from sqlalchemy import text
    import re
    
    # Convert PostgreSQL $1, $2 to SQLAlchemy :p1, :p2
    query = re.sub(r'\$(\d+)', r':p\1', query)
    p_dict = {f"p{i+1}": p for i, p in enumerate(params or [])}
    
    result = await db.execute(
        text(query),
        p_dict
    )
    return result

async def fetch_all(
    db: AsyncSession,
    query: str,
    params: list = None
) -> list:
    result = await execute(db, query, params)
    return [dict(row._mapping) for row in result.fetchall()]

async def fetch_one(
    db: AsyncSession,
    query: str,
    params: list = None
) -> dict | None:
    result = await execute(db, query, params)
    row = result.fetchone()
    return dict(row._mapping) if row else None