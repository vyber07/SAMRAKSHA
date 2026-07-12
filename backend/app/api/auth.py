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

router   = APIRouter()
limiter  = Limiter(key_func=get_remote_address)
pwd_ctx  = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2   = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-1234567890")
ALGORITHM  = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_EXP = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", 8))

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
        officer_id = payload.get("sub")
        if not officer_id:
            raise HTTPException(401, "Invalid token")
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

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
        role_permissions = {
            'constable': [],  # Can do nothing
            'io': ['case_create', 'case_view_own_ps', 'case_edit', 'patrol_view'],
            'sho': ['case_view_all', 'case_edit', 'doc_generate', 'patrol_dispatch', 'cctv_view'],
            'dcp': ['case_view_all', 'analytics_view'],
            'admin': ['admin_permissions', 'analytics_view'],
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
    await execute(db,
        "UPDATE officers SET last_login = NOW() WHERE id = $1",
        [officer['id']]
    )
    await db.commit()

    token = create_access_token(
        str(officer['id']), officer['role'], str(officer['ps_id'])
    )

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
    officer = Depends(get_current_officer)
):
    # Token-based auth: client discards token
    # For production: add token to Redis blacklist
    return {"message": "Logged out"}