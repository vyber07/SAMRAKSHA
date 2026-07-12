from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
import bcrypt as _bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import uuid
import structlog

from app.db.connection import get_db, fetch_one, fetch_all, execute

router = APIRouter()
oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set. Refusing to start.")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_EXP = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", 8))

def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False

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
        "jti":     str(uuid.uuid4()),
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

    # Fetch per-officer permission overrides
    custom_perms_rows = await fetch_all(db,
        "SELECT permission, granted FROM officer_permissions WHERE officer_id = $1",
        [officer_id]
    )
    custom_permissions = [
        {"permission": r["permission"], "granted": r["granted"]}
        for r in custom_perms_rows
    ]

    # Return as a plain dict including custom_permissions
    return {
        "id":                str(officer["id"]),
        "badge_no":          officer["badge_no"],
        "name":              officer["name"],
        "role":              officer["role"],
        "ps_id":             str(officer["ps_id"]) if officer["ps_id"] else None,
        "is_active":         officer["is_active"],
        "custom_permissions": custom_permissions,
    }

@router.post("/login")
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

    dummy_hash = "$2b$12$dummy.hash.to.prevent.timing.attack.xyz"
    stored_hash = officer['password_hash'] if officer else dummy_hash

    if not _verify_password(body.password, stored_hash) or not officer:
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
        str(officer['id']), officer['role'], str(officer['ps_id']) if officer['ps_id'] else ""
    )

    return {
        "access_token": token,
        "token_type":   "bearer",
        "officer": {
            "id":       str(officer['id']),
            "badge_no": officer['badge_no'],
            "name":     officer['name'],
            "role":     officer['role'],
            "ps_id":    str(officer['ps_id']) if officer['ps_id'] else None,
        }
    }

@router.post("/logout")
async def logout(
    officer = Depends(get_current_officer)
):
    return {"message": "Logged out"}

@router.get("/me")
async def get_me(
    officer = Depends(get_current_officer)
):
    """
    Returns the current authenticated officer's profile data including custom permissions.
    """
    return {
        "id":                str(officer['id']),
        "badge_no":          officer['badge_no'],
        "name":              officer['name'],
        "role":              officer['role'],
        "ps_id":             str(officer['ps_id']) if officer['ps_id'] else None,
        "is_active":         officer['is_active'],
        "custom_permissions": officer.get('custom_permissions', []),
    }
