from app.db.connection import get_db, fetch_one, fetch_all, execute

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address
import os, uuid
import redis.asyncio as aioredis

router   = APIRouter()
limiter  = Limiter(key_func=get_remote_address, enabled=os.getenv("ENVIRONMENT") != "testing")
pwd_ctx  = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2   = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-1234567890")
ALGORITHM  = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_EXP = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", 8))
from app.core.redis import get_redis, redis_client


class LoginRequest(BaseModel):
    badge_no: str
    password: str

def create_access_token(officer_id: str, role: str, ps_id: str) -> str:
    payload = {
        "sub":     officer_id,
        "role":    role,
        "ps_id":   ps_id,
        "exp":     datetime.utcnow() + timedelta(hours=ACCESS_EXP),
        "iat":     datetime.utcnow(),
        "jti":     str(uuid.uuid4()),  # Unique token ID
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_officer(
    token: str = Depends(oauth2),
    db = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
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
        # Convert to UUID to match column type
        officer_id = uuid.UUID(officer_id_str)
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")
    except ValueError:
        raise HTTPException(401, "Invalid token")

    officer = await fetch_one(db,
        "SELECT id, badge_no, name, role, ps_id, is_active "
        "FROM officers WHERE id = $1",
        [officer_id]
    )

    if not officer or not officer['is_active']:
        raise HTTPException(401, "Officer account inactive")

    # FETCH PERMISSION OVERRIDES (NEW)
    overrides = await fetch_all(db, """
        SELECT permission_key, granted
        FROM officer_permission_overrides
        WHERE officer_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
    """, [officer_id])
    
    officer['permissions'] = {o['permission_key']: o['granted'] for o in overrides}

    return officer

def require_permission(permission_key: str):
    """Dependency: check if officer has permission"""
    async def check_permission(officer = Depends(get_current_officer)):
        # Check override first
        if permission_key in officer.get('permissions', {}):
            if officer['permissions'][permission_key]:
                return officer  # Override grants permission
            else:
                raise HTTPException(403, "Permission denied by override")
        
        # Check role default (hardcoded for now)
        ALL_PERMISSIONS = [
            'admin_permissions', 'analytics_view', 'case_create', 'case_view_all',
            'case_view_own_ps', 'case_edit', 'doc_generate', 'patrol_dispatch',
            'patrol_view', 'cctv_view',
        ]
        role_permissions = {
            'constable': ['patrol_view'],
            'io':        ['case_create', 'case_view_own_ps', 'case_edit',
                          'patrol_view', 'doc_generate'],
            'sho':       ['case_view_all', 'case_edit', 'doc_generate', 'patrol_dispatch',
                          'patrol_view', 'cctv_view', 'analytics_view'],
            'dcp':       ['case_view_all', 'analytics_view', 'patrol_view',
                          'cctv_view', 'doc_generate'],
            'admin':     ALL_PERMISSIONS,
        }
        
        if permission_key not in role_permissions.get(officer['role'], []):
            raise HTTPException(403, "Insufficient permissions")
        
        return officer
    
    return check_permission

@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db = Depends(get_db)
):
    officer = await fetch_one(db,
        "SELECT id, badge_no, name, role, ps_id, "
        "password_hash, is_active "
        "FROM officers WHERE badge_no = $1",
        [body.badge_no]
    )

    import bcrypt
    
    # Always verify hash even if officer not found
    # Prevents timing attack to enumerate valid badge numbers
    dummy_hash = "$2b$12$00000000000000000000000000000000000000000000000000000"
    stored_hash = officer['password_hash'] if officer else dummy_hash

    is_valid = False
    try:
        is_valid = bcrypt.checkpw(body.password.encode('utf-8'), stored_hash.encode('utf-8'))
    except Exception:
        pass
        
    if not is_valid or not officer:
        import structlog
        structlog.get_logger().warning(
            "Failed login", badge=body.badge_no,
            ip=request.client.host
        )
        raise HTTPException(401, "Invalid credentials")

    if not officer['is_active']:
        raise HTTPException(401, "Account deactivated")

    # Update last login
    officer_id = officer['id'] if isinstance(officer['id'], uuid.UUID) else uuid.UUID(str(officer['id']))
    try:
        await execute(db,
            "UPDATE officers SET last_login = NOW() WHERE id = $1",
            [officer_id]
        )
    except Exception as e:
        import structlog
        structlog.get_logger().warning("Failed to update last login", error=str(e))

    token = create_access_token(
        str(officer['id']), officer['role'], str(officer['ps_id'])
    )

    from app.services.audit import log_activity
    try:
        await log_activity(db, officer_id, "login", f"Officer {officer['badge_no']} logged in successfully.", request.client.host)
    except Exception as e:
        structlog.get_logger().error("Audit logging failed", error=str(e))

    return {
        "access_token": token,
        "token_type":   "bearer",
        "officer": {
            "id":       str(officer['id']),
            "badge_no": officer['badge_no'],
            "name":     officer['name'],
            "role":     officer['role'],
            "ps_id":    str(officer['ps_id']),
        }
    }

@router.post("/logout")
async def logout(
    request: Request,
    token: str = Depends(oauth2),
    officer = Depends(get_current_officer),
    db = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        jti = payload.get("jti")
        if jti:
            exp = payload.get("exp")
            now = datetime.utcnow().timestamp()
            ttl = int(exp - now) if exp else int(ACCESS_EXP * 3600)
            if ttl > 0:
                try:
                    r = get_redis()
                    await r.setex(f"blacklist:{jti}", ttl, "true")
                    await r.aclose()
                except Exception:
                    pass
    except Exception as e:
        import structlog
        structlog.get_logger().error("Logout blacklist failed", error=str(e))

    from app.services.audit import log_activity
    try:
        await log_activity(db, officer['id'], "logout", f"Officer {officer['badge_no']} logged out.", request.client.host)
    except Exception as e:
        import structlog
        structlog.get_logger().error("Logout audit logging failed", error=str(e))

    return {"message": "Logged out"}