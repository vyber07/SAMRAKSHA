import pytest
import sys
import subprocess
try:
    import redis.asyncio
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "redis", "--target=/home/ubuntu/sam/backend/venv/lib/python3.14/site-packages"])
from unittest.mock import MagicMock
for mod in ["torch", "transformers", "IndicTransToolkit", "whisper"]:
    try:
        __import__(mod)
    except ImportError:
        sys.modules[mod] = MagicMock()

import pytest_asyncio
import asyncio
import os
import uuid
import time
import httpx
from datetime import datetime, timedelta
import bcrypt

from main import app
from app.db.connection import get_db, fetch_one, execute, AsyncSessionLocal, engine
from app.api.auth import create_access_token, limiter

# Set environment for testing
os.environ["ENVIRONMENT"] = "testing"
os.environ["SECRET_KEY"] = "samraksha-super-secret-jwt-key-change-in-prod"
os.environ["DEMO_SEED_PASSWORD"] = "password123"
os.environ["ADMIN_SEED_PASSWORD"] = "password123"
limiter.enabled = False

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_test_database():
    """Ensure database has police station and base officers for tests."""
    async with AsyncSessionLocal() as session:
        # Schema migration fix for cases ward column
        try:
            await execute(session, "ALTER TABLE cases ADD COLUMN IF NOT EXISTS ward VARCHAR(50);")
            await session.commit()
        except Exception:
            pass

        # Check if test police station exists
        ps = await fetch_one(session, "SELECT id FROM police_stations LIMIT 1")
        if not ps:
            ps_id = str(uuid.uuid4())
            await execute(session, """
                INSERT INTO police_stations (id, name, zone, ward, lat, lon, address)
                VALUES ($1, 'Ellisbridge Police Station', 'Zone 1', 'Ellisbridge', 23.0225, 72.5714, 'Ellisbridge, Ahmedabad')
            """, [ps_id])
            await session.commit()
        else:
            ps_id = str(ps['id'])

        def hash_pwd(p: str) -> str:
            return bcrypt.hashpw(p.encode(), bcrypt.gensalt(rounds=10)).decode()

        pw_hash = hash_pwd("password123")

        # Ensure test officers exist and have expected password hash
        test_officers_def = [
            ('ADMIN001', 'System Admin', 'Admin', 'admin'),
            ('DCP001', 'Dr. Kanad Vyas', 'DCP', 'dcp'),
            ('SHO_ELL', 'Inspector Patel', 'SHO', 'sho'),
            ('IO_ELL_1', 'Sub-Inspector Shah', 'PSI', 'io'),
            ('CONST001', 'Constable Kumar', 'Constable', 'constable'),
        ]
        for badge_no, name, rank, role in test_officers_def:
            off = await fetch_one(session, "SELECT id FROM officers WHERE badge_no = $1", [badge_no])
            if not off:
                off_id = str(uuid.uuid4())
                await execute(session, """
                    INSERT INTO officers (id, badge_no, name, rank, role, ps_id, password_hash, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
                """, [off_id, badge_no, name, rank, role, ps_id, pw_hash])
            else:
                await execute(session, """
                    UPDATE officers SET password_hash = $1, is_active = TRUE WHERE badge_no = $2
                """, [pw_hash, badge_no])
            await session.commit()

@pytest_asyncio.fixture
async def async_client():
    """Async HTTP client for testing FastAPI application."""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client

@pytest_asyncio.fixture
async def db_session():
    """Provides async database session for tests."""
    async with AsyncSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def admin_officer(db_session):
    return await fetch_one(db_session, "SELECT id, badge_no, role, ps_id FROM officers WHERE badge_no = 'ADMIN001'")

@pytest_asyncio.fixture
async def dcp_officer(db_session):
    return await fetch_one(db_session, "SELECT id, badge_no, role, ps_id FROM officers WHERE badge_no = 'DCP001'")

@pytest_asyncio.fixture
async def sho_officer(db_session):
    return await fetch_one(db_session, "SELECT id, badge_no, role, ps_id FROM officers WHERE badge_no = 'SHO_ELL'")

@pytest_asyncio.fixture
async def io_officer(db_session):
    return await fetch_one(db_session, "SELECT id, badge_no, role, ps_id FROM officers WHERE badge_no = 'IO_ELL_1'")

@pytest.fixture
def admin_token(admin_officer):
    return create_access_token(str(admin_officer['id']), admin_officer['role'], str(admin_officer['ps_id']))

@pytest.fixture
def dcp_token(dcp_officer):
    return create_access_token(str(dcp_officer['id']), dcp_officer['role'], str(dcp_officer['ps_id']))

@pytest.fixture
def sho_token(sho_officer):
    return create_access_token(str(sho_officer['id']), sho_officer['role'], str(sho_officer['ps_id']))

@pytest.fixture
def io_token(io_officer):
    return create_access_token(str(io_officer['id']), io_officer['role'], str(io_officer['ps_id']))

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def dcp_headers(dcp_token):
    return {"Authorization": f"Bearer {dcp_token}"}

@pytest.fixture
def sho_headers(sho_token):
    return {"Authorization": f"Bearer {sho_token}"}

@pytest.fixture
def io_headers(io_token):
    return {"Authorization": f"Bearer {io_token}"}
