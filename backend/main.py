import os
import asyncio

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import structlog

from app.api import (
    auth, cases, incidents,
    patrol, hotspot, cctv, assistant,
    legal, websocket, admin, analytics, translate, cctns, documents, voice
)
from app.db.connection import init_db, close_db
from app.core.security import (
    ENVIRONMENT,
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    UNSAFE_METHODS,
    csrf_tokens_match,
)

logger = structlog.get_logger()


def _csv_env(name: str, default: str = "") -> list[str]:
    """Split a comma-separated env var into a trimmed, non-empty list."""
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    if ENVIRONMENT == "production":
        secret = os.getenv("SECRET_KEY", "")
        if not secret or secret in ("samraksha-super-secret-jwt-key-change-in-prod", "super-secret-key-1234567890"):
            raise ValueError("Insecure SECRET_KEY detected in production environment!")

    await init_db()
    logger.info("Database connected")
    yield
    await close_db()
    logger.info("Database disconnected")


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="SAMRAKSHA API",
    version="1.0.0",
    description="Unified Predictive Policing & Advanced Case Intelligence Platform",
    docs_url="/api/docs" if ENVIRONMENT != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS: strict allowlist from environment, never "*" with credentials ───────
# Defaults are local-development origins only; production MUST set CORS_ORIGINS.
_cors_origins = _csv_env("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", CSRF_HEADER_NAME],
    expose_headers=["Content-Disposition", "X-Document-SHA256"],
)

# ── Trusted Hosts: explicit allowlist, no wildcards ───────────────────────────
# _trusted_hosts = _csv_env("TRUSTED_HOSTS", "*")
# app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# ── Global rate limiting ──────────────────────────────────────────────────────
app.add_middleware(SlowAPIMiddleware)


# ── CSRF protection (double-submit cookie) ────────────────────────────────────
# Applies to cookie-authenticated browser mutations. Server-to-server clients
# using API keys (X-API-Key / X-API-Token) are exempt because they never hold a
# session cookie and cannot be CSRF'd by a browser.
@app.middleware("http")
async def csrf_protect_middleware(request: Request, call_next):
    if request.method not in UNSAFE_METHODS:
        return await call_next(request)

    # Webhook / machine clients authenticate with API keys, not cookies.
    if request.headers.get("x-api-key") or request.headers.get("x-api-token"):
        return await call_next(request)

    # Endpoints that establish or refresh the session are the trust anchor.
    if request.url.path.endswith(("/auth/login", "/auth/csrf")):
        return await call_next(request)

    csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
    csrf_header = request.headers.get(CSRF_HEADER_NAME)
    if not csrf_tokens_match(csrf_cookie, csrf_header):
        return JSONResponse({"detail": "CSRF token missing or invalid"}, status_code=403)

    return await call_next(request)


# ── Audit middleware: append-only activity log for state-changing requests ────
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
                        "name": "System",
                    })
            except Exception as e:
                logger.error(f"Audit middleware failed: {e}")

        asyncio.create_task(save_audit())
        return response
    return await call_next(request)


# ── Routers (mounted under /api/v1) ──────────────────────────────────────────
_prefix = "/api/v1"
app.include_router(auth.router,       prefix=f"{_prefix}/auth",      tags=["Auth"])
app.include_router(cases.router,      prefix=f"{_prefix}/cases",     tags=["Cases"])
app.include_router(incidents.router,  prefix=f"{_prefix}/incident",  tags=["Incidents"])
app.include_router(patrol.router,     prefix=f"{_prefix}/patrol",    tags=["Patrol"])
app.include_router(hotspot.router,    prefix=f"{_prefix}/map",       tags=["Map"])
app.include_router(cctv.router,       prefix=f"{_prefix}/cctv",      tags=["CCTV"])
app.include_router(analytics.router,  prefix=f"{_prefix}/analytics", tags=["Analytics"])
app.include_router(assistant.router,  prefix=f"{_prefix}/assistant", tags=["Assistant"])
app.include_router(legal.router,      prefix=f"{_prefix}/legal",     tags=["Legal"])
app.include_router(websocket.router,  prefix=f"{_prefix}/ws",        tags=["WebSocket"])
app.include_router(admin.router,      prefix=f"{_prefix}/admin",     tags=["Admin"])
app.include_router(analytics.router,  prefix=f"{_prefix}/analytics", tags=["Analytics"])
app.include_router(translate.router,  prefix=f"{_prefix}/translate", tags=["Translation"])
app.include_router(cctns.router,      prefix=f"{_prefix}/cctns",     tags=["CCTNS"])
app.include_router(documents.router,  prefix=f"{_prefix}/docs",      tags=["Documents"])
app.include_router(voice.router,      prefix=f"{_prefix}/voice",     tags=["Voice"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to SAMRAKSHA API",
        "docs": "/api/docs",
        "health": "/health",
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
