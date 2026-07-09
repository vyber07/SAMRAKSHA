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
    # Replace double colons (e.g. ::GEOGRAPHY) with escaped double colons (\:\:GEOGRAPHY)
    # SQLAlchemy text() interprets single colons as parameters, so we escape all colons first,
    # except our own parameters. To keep it simple:
    # 1. Replace all colons with escaped colons \:
    # 2. Replace all $N with :pN (which SQLAlchemy treats as parameter pN)
    
    # We replace ':' with '\:'
    escaped_query = query.replace(':', '\\:')
    
    # Then replace $1, $2 with :p1, :p2
    converted_query = re.sub(r'\$(\d+)', r':p\1', escaped_query)
    
    param_dict = {}
    if params:
        for idx, val in enumerate(params):
            param_dict[f"p{idx+1}"] = val
            
    return converted_query, param_dict

async def execute(
    db: AsyncSession,
    query: str,
    params: list = None
):
    converted_query, param_dict = convert_query(query, params)
    result = await db.execute(text(converted_query), param_dict)
    return result

async def fetch_all(
    db: AsyncSession,
    query: str,
    params: list = None
) -> list:
    result = await execute(db, query, params)
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]

async def fetch_one(
    db: AsyncSession,
    query: str,
    params: list = None
) -> dict | None:
    result = await execute(db, query, params)
    row = result.fetchone()
    return dict(row._mapping) if row else None
