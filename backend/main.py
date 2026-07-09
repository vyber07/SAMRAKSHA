from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog
import os

from app.api import (
    auth, cases, incidents, documents,
    patrol, hotspot, cctv, assistant,
    legal, websocket
)
from app.db.connection import init_db, close_db
from app.middleware.auth import AuthMiddleware

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
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
    description="Unified Predictive Policing & AI Case Intelligence Platform",
    docs_url="/docs" if os.getenv('ENVIRONMENT') != 'production' else None,
    redoc_url=None,
    lifespan=lifespan
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS origins
cors_origins_str = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:80,http://localhost')
cors_origins = [origin.strip() for origin in cors_origins_str.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "postgres", "api", "frontend", "*.samraksha.local", "*"]
)

# Add custom auth checking middleware globally if needed
app.add_middleware(AuthMiddleware)

# Routers
app.include_router(auth.router,       prefix="/auth",      tags=["Auth"])
app.include_router(cases.router,      prefix="/cases",     tags=["Cases"])
app.include_router(incidents.router,  prefix="/incident",  tags=["Incidents"])
app.include_router(documents.router,  prefix="/docs",      tags=["Documents"])
app.include_router(patrol.router,     prefix="/patrol",    tags=["Patrol"])
app.include_router(hotspot.router,    prefix="/map",       tags=["Map"])
app.include_router(cctv.router,       prefix="/cctv",      tags=["CCTV"])
app.include_router(assistant.router,  prefix="/assistant", tags=["Assistant"])
app.include_router(legal.router,      prefix="/legal",     tags=["Legal"])
app.include_router(websocket.router,  prefix="/ws",        tags=["WebSocket"])

# FIR create (top level — most important endpoint)
from app.api.cases import create_fir_handler
app.include_router(create_fir_handler, prefix="/fir", tags=["FIR"])

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "SAMRAKSHA",
        "version": "1.0.0",
        "demo_mode": os.getenv('DEMO_MODE', 'false')
    }
