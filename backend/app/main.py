# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog

from app.api import (
    auth, cases,  documents,
    patrol, hotspot, cctv, assistant,
    legal, websocket, analytics, incidents, cctns, translate
)
from app.db.connection import init_db, close_db

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
    docs_url="/docs" if __import__('os').getenv('ENVIRONMENT') != 'production' else None,
    redoc_url=None,
    lifespan=lifespan
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Trusted hosts (Disabled for dev/proxy compatibility)
# app.add_middleware(
#     TrustedHostMiddleware,
#     allowed_hosts=["*"]
# )

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
app.include_router(cctns.router,      prefix="/cctns",     tags=["CCTNS"])
app.include_router(analytics.router,  prefix="/analytics", tags=["Analytics"])
app.include_router(translate.router,  prefix="/translate", tags=["Translation"])

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "SAMRAKSHA",
        "version": "1.0.0",
        "demo_mode": __import__('os').getenv('DEMO_MODE', 'false')
    }
