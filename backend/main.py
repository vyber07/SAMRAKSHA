
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog

from app.api import (
    auth, cases, incidents,
    patrol, hotspot, cctv, assistant,
    legal, websocket, admin, analytics, translate, cctns, documents, voice
)
from app.db.connection import init_db, close_db

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if __import__('os').getenv('ENVIRONMENT') == 'production':
        secret = __import__('os').getenv('SECRET_KEY', '')
        if not secret or secret in ('samraksha-super-secret-jwt-key-change-in-prod', 'super-secret-key-1234567890'):
            raise ValueError("Insecure SECRET_KEY detected in production environment!")

    await init_db()
    logger.info("Database connected")
    yield
    # Shutdown
    await close_db()
    logger.info("Database disconnected")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="SAMRAKSHA API",
    version="1.0.0",
    description="Unified Predictive Policing & Advanced Case Intelligence Platform",
    docs_url="/api/docs" if __import__('os').getenv('ENVIRONMENT') != 'production' else None,
    redoc_url=None,
    lifespan=lifespan
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "https://samraksha.local"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.samraksha.local", "backend", "*"]
)

import asyncio
from fastapi import Request
@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        response = await call_next(request)
        
        async def save_audit():
            try:
                from app.db.connection import engine
                from sqlalchemy import text
                async with engine.begin() as conn:
                    await conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS audit_logs (
                            id SERIAL PRIMARY KEY,
                            changed_at TIMESTAMPTZ DEFAULT NOW(),
                            action VARCHAR(50),
                            target VARCHAR(100),
                            badge_no VARCHAR(50),
                            officer_name VARCHAR(200),
                            ip_address VARCHAR(50),
                            details TEXT
                        )
                    """))
                    await conn.execute(text("""
                        INSERT INTO audit_logs (action, target, ip_address, details, badge_no, officer_name)
                        VALUES (:action, :target, :ip, :details, :badge, :name)
                    """), {
                        "action": request.method,
                        "target": request.url.path,
                        "ip": request.client.host if request.client else "127.0.0.1",
                        "details": f"Status: {response.status_code}",
                        "badge": "System",
                        "name": "System"
                    })
            except Exception as e:
                logger.error(f"Audit middleware failed: {e}")
                
        asyncio.create_task(save_audit())
        return response
    return await call_next(request)


# Routers (mounted under /api/v1 prefixes)
for prefix in ["/api/v1"]:
    app.include_router(auth.router,       prefix=f"{prefix}/auth",      tags=["Auth"])
    app.include_router(cases.router,      prefix=f"{prefix}/cases",     tags=["Cases"])
    app.include_router(incidents.router,  prefix=f"{prefix}/incident",  tags=["Incidents"])
    app.include_router(patrol.router,     prefix=f"{prefix}/patrol",    tags=["Patrol"])
    app.include_router(hotspot.router,    prefix=f"{prefix}/map",       tags=["Map"])
    app.include_router(cctv.router,       prefix=f"{prefix}/cctv",      tags=["CCTV"])
    app.include_router(assistant.router,  prefix=f"{prefix}/assistant", tags=["Assistant"])
    app.include_router(legal.router,      prefix=f"{prefix}/legal",     tags=["Legal"])
    app.include_router(websocket.router,  prefix=f"{prefix}/ws",        tags=["WebSocket"])
    app.include_router(admin.router,      prefix=f"{prefix}/admin",     tags=["Admin"])
    app.include_router(analytics.router,  prefix=f"{prefix}/analytics", tags=["Analytics"])
    app.include_router(translate.router,  prefix=f"{prefix}/translate", tags=["Translation"])
    app.include_router(cctns.router,      prefix=f"{prefix}/cctns",     tags=["CCTNS"])
    app.include_router(documents.router,  prefix=f"{prefix}/docs",      tags=["Documents"])
    app.include_router(voice.router,      prefix=f"{prefix}/voice",     tags=["Voice"])




# FIR create (top level — most important endpoint)
# We can just mount the cases router again or a specific router, but cases already has it.
# We'll just rely on the cases router.

@app.get("/")
async def root():
    return {
        "message": "Welcome to SAMRAKSHA API",
        "docs": "/api/docs",
        "health": "/health"
    }

@app.get("/health")
@app.get("/api/health")
async def health():
    db_ok = False
    redis_ok = False
    try:
        from app.db.connection import engine
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    try:
        from app.core.redis import redis_client
        await redis_client.ping()
        redis_ok = True
    except Exception:
        pass

    return {
        "status": "ok" if db_ok and redis_ok else "error",
        "service": "SAMRAKSHA",
        "version": "1.0.0",
        "db": db_ok,
        "redis": redis_ok,
    }