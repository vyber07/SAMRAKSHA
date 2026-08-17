from sqlalchemy import text
from app.db.connection import get_db

from fastapi import APIRouter, Depends, HTTPException, Request, Response, Cookie
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
import jwt as _jwt  # PyJWT — replaces python-jose (CVE-2024-33663, CVE-2024-33664)
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from slowapi import Limiter
from slowapi.util import get_remote_address
import os
import uuid
import structlog

from app.core.redis import get_redis
from app.core.security import (
    SESSION_COOKIE_NAME,
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    cookie_secure,
    generate_csrf_token,
    csrf_tokens_match,
)

router = APIRouter()
logger = structlog.get_logger()
limiter = Limiter(key_func=get_remote_address, enabled=os.getenv("ENVIRONMENT") != "testing")
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY") or ""
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable must be set to a strong random value (min 32 chars)")
if len(SECRET_KEY) < 32:
    import warnings
    warnings.warn("SECRET_KEY is shorter than 32 characters — use a longer key for production", RuntimeWarning)

ALGORITHM = "HS256"  # pinned — do not allow algorithm negotiation from token header
ACCESS_EXP = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480")) / 60  # default 8 hours


class LoginRequest(BaseModel):
    badge_no: str
    password: str


def create_access_token(officer_id: str, role: str, ps_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": officer_id,
        "role": role,
        "ps_id": ps_id,
        "exp": now + timedelta(hours=ACCESS_EXP),
        "iat": now,
        "jti": str(uuid.uuid4()),  # Unique token ID for revocation
    }
    return _jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def set_auth_cookies(response: Response, token: str, csrf_token: str) -> None:
    """Attach the session cookie (HttpOnly) and CSRF cookie (JS-readable) to a response."""
    secure = cookie_secure()
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=secure,
        samesite="strict",
        max_age=86400,
        path="/",
    )
    # Double-submit CSRF token: readable by JS, echoed back in X-CSRF-Token header.
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=secure,
        samesite="strict",
        max_age=86400,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE_NAME)
    response.delete_cookie(CSRF_COOKIE_NAME)


async def get_current_officer(
    request: Request,
    samraksha_session: str = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db=Depends(get_db),
):
    token = samraksha_session
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = _jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # algorithm pinned, no negotiation
        officer_id_str = payload.get("sub")
        jti = payload.get("jti")
        if jti:
            try:
                r = get_redis()
                is_blacklisted = await r.get(f"blacklist:{jti}")
                await r.aclose()
                if is_blacklisted:
                    raise HTTPException(401, "Token has been revoked")
            except HTTPException:
                raise
            except Exception:
                pass
        if not officer_id_str:
            raise HTTPException(401, "Invalid token")
        officer_id = uuid.UUID(officer_id_str)
    except (_jwt.ExpiredSignatureError, _jwt.InvalidTokenError):
        raise HTTPException(401, "Invalid or expired token")
    except ValueError:
        raise HTTPException(401, "Invalid token")

    officer = (await db.execute(text(
        "SELECT id, badge_no, name, role, ps_id, is_active FROM officers WHERE id = :p1"
    ), {'p1': officer_id})).mappings().fetchone()

    if not officer or not officer['is_active']:
        raise HTTPException(401, "Officer account inactive")

    overrides = (await db.execute(text("""
        SELECT permission_key, granted
        FROM officer_permission_overrides
        WHERE officer_id = :p1
        AND (expires_at IS NULL OR expires_at > NOW())
    """), {'p1': officer_id})).mappings().fetchall()

    officer_dict = dict(officer)
    officer_dict['permissions'] = {o['permission_key']: o['granted'] for o in overrides}

    return officer_dict


def require_permission(permission_key: str):
    """Dependency: check if the authenticated officer has the requested permission."""
    async def check_permission(officer=Depends(get_current_officer)):
        if permission_key in officer.get('permissions', {}):
            if officer['permissions'][permission_key]:
                return officer
            raise HTTPException(403, "Permission denied by override")

        ALL_PERMISSIONS = [
            'admin_permissions', 'analytics_view', 'case_create', 'case_view_all',
            'case_view_own_ps', 'case_edit', 'doc_generate', 'patrol_dispatch',
            'patrol_view', 'cctv_view',
        ]
        role_permissions = {
            'constable': ['patrol_view'],
            'io': ['case_create', 'case_view_own_ps', 'case_edit', 'patrol_view', 'doc_generate', 'patrol_dispatch'],
            'sho': ['case_view_all', 'case_edit', 'doc_generate', 'patrol_dispatch',
                    'patrol_view', 'cctv_view', 'analytics_view'],
            'dcp': ['case_view_all', 'analytics_view', 'patrol_view', 'cctv_view', 'doc_generate'],
            'admin': ALL_PERMISSIONS,
        }

        if permission_key not in role_permissions.get(officer['role'], []):
            raise HTTPException(403, "Insufficient permissions")

        return officer

    return check_permission


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, response: Response, db=Depends(get_db)):
    officer = (await db.execute(text(
        "SELECT id, badge_no, name, role, ps_id, password_hash, is_active FROM officers WHERE badge_no = :p1"
    ), {'p1': body.badge_no})).mappings().fetchone()

    import bcrypt

    # Always verify a hash even if the officer is not found, to blunt timing attacks
    # that would otherwise reveal valid badge numbers.
    dummy_hash = "$2b$12$ThisIsAVeryRealBcryptSaltOu/VwK.u9lUoVwZg5ZzO.c.Y"
    stored_hash = officer['password_hash'] if officer else dummy_hash

    from fastapi.concurrency import run_in_threadpool
    is_valid = False
    try:
        is_valid = await run_in_threadpool(bcrypt.checkpw, body.password.encode('utf-8'), stored_hash.encode('utf-8'))
    except Exception as e:
        logger.error("Debug login exception", exc=str(e))

    if not is_valid or not officer:
        logger.warning("Failed login", badge=body.badge_no, ip=request.client.host)
        raise HTTPException(401, "Invalid credentials")

    if not officer['is_active']:
        raise HTTPException(401, "Account deactivated")

    officer_id = officer['id'] if isinstance(officer['id'], uuid.UUID) else uuid.UUID(str(officer['id']))
    try:
        await db.execute(text("UPDATE officers SET last_login = NOW() WHERE id = :p1"), {'p1': officer_id})
    except Exception as e:
        logger.warning("Failed to update last login", error=str(e))

    token = create_access_token(str(officer['id']), officer['role'], str(officer['ps_id']))
    csrf_token = generate_csrf_token()

    from app.services.audit import log_activity
    try:
        await log_activity(db, officer_id, "login", f"Officer {officer['badge_no']} logged in successfully.", request.client.host)
    except Exception as e:
        logger.error("Audit logging failed", error=str(e))

    # Return the bearer token only for in-memory/WebSocket compatibility; the client
    # MUST NOT persist it (session state travels in the HttpOnly cookie).
    payload = {
        "access_token": token,
        "token_type": "bearer",
        "csrf_token": csrf_token,
        "officer": {
            "id": str(officer['id']),
            "badge_no": officer['badge_no'],
            "name": officer['name'],
            "role": officer['role'],
            "ps_id": str(officer['ps_id']),
        },
    }
    set_auth_cookies(response, token, csrf_token)
    return payload


@router.get("/csrf")
async def get_csrf_token(request: Request, response: Response, officer=Depends(get_current_officer)):
    """Issue a fresh CSRF token for the current session (double-submit cookie)."""
    csrf_token = generate_csrf_token()
    secure = cookie_secure()
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=secure,
        samesite="strict",
        max_age=86400,
        path="/",
    )
    return {"csrf_token": csrf_token}


async def verify_csrf(
    request: Request,
    csrf_cookie: str = Cookie(default=None, alias=CSRF_COOKIE_NAME),
):
    """Dependency variant of CSRF validation for routes not covered by middleware."""
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return True
    header = request.headers.get(CSRF_HEADER_NAME)
    if not csrf_tokens_match(csrf_cookie, header):
        raise HTTPException(403, "CSRF token missing or invalid")
    return True


@router.post("/logout")
async def logout(request: Request, response: Response, officer=Depends(get_current_officer), db=Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    clear_auth_cookies(response)

    try:
        if token:
            payload = _jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            jti = payload.get("jti")
            if jti:
                exp = payload.get("exp")
                now = datetime.now(timezone.utc).timestamp()
                ttl = int(exp - now) if exp else int(ACCESS_EXP * 3600)
                if ttl > 0:
                    try:
                        r = get_redis()
                        await r.set(f"blacklist:{jti}", "true", ex=ttl)
                        await r.aclose()
                    except Exception:
                        pass
    except Exception as e:
        logger.error("Logout blacklist failed", error=str(e))

    from app.services.audit import log_activity
    try:
        await log_activity(db, officer['id'], "logout", f"Officer {officer['badge_no']} logged out.", request.client.host)
    except Exception as e:
        logger.error("Logout audit logging failed", error=str(e))

    return {"message": "Logged out"}


@router.get("/me")
async def get_me(officer=Depends(get_current_officer)):
    return {
        "officer": {
            "id": str(officer['id']),
            "badge_no": officer['badge_no'],
            "name": officer['name'],
            "role": officer['role'],
            "ps_id": str(officer['ps_id']),
        }
    }
