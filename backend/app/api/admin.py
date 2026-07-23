from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import structlog
import uuid

router = APIRouter()
logger = structlog.get_logger()

class OfficerCreate(BaseModel):
    badge_no: str
    name: str
    role: str
    ps_id: str
    password: str

class OfficerUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    ps_id: Optional[str] = None
    is_active: Optional[bool] = None

from app.db.connection import get_db, fetch_all, execute
from app.api.auth import get_current_officer
import bcrypt

def verify_admin_role(officer = Depends(get_current_officer)):
    if officer['role'].lower() != 'admin':
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return officer

@router.get("/officers", dependencies=[Depends(verify_admin_role)])
async def get_officers(db = Depends(get_db)):
    return await fetch_all(db, "SELECT badge_no, name, role, ps_id, is_active FROM officers")

@router.post("/officers", dependencies=[Depends(verify_admin_role)])
async def create_officer(officer: OfficerCreate, db = Depends(get_db)):
    hashed_pw = bcrypt.hashpw(officer.password.encode(), bcrypt.gensalt(rounds=12)).decode()
    officer_id = str(uuid.uuid4())
    await execute(db, """
        INSERT INTO officers (id, badge_no, name, role, ps_id, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6)
    """, [officer_id, officer.badge_no, officer.name, officer.role, officer.ps_id, hashed_pw])
    
    from app.services.audit import log_activity
    try:
        await log_activity(db, None, "create_officer", f"Officer {officer.badge_no} created with role {officer.role}")
    except Exception as e:
        logger.error("Audit log failed", error=str(e))
        
    await db.commit()
    return {"status": "created"}

@router.patch("/officers/{badge_no}", dependencies=[Depends(verify_admin_role)])
async def update_officer(badge_no: str, officer: OfficerUpdate, db = Depends(get_db)):
    updates = []
    params = [badge_no]
    idx = 2
    for field, value in officer.dict(exclude_unset=True).items():
        updates.append(f"{field} = ${idx}")
        params.append(value)
        idx += 1
    
    if not updates:
        return {"status": "no changes"}
        
    query = f"UPDATE officers SET {', '.join(updates)} WHERE badge_no = $1"
    await execute(db, query, params)
    
    from app.services.audit import log_activity
    try:
        await log_activity(db, None, "update_officer", f"Officer {badge_no} updated: {list(officer.dict(exclude_unset=True).keys())}")
    except Exception as e:
        logger.error("Audit log failed", error=str(e))
        
    await db.commit()
    return {"status": "updated"}

@router.delete("/officers/{badge_no}", dependencies=[Depends(verify_admin_role)])
async def delete_officer(badge_no: str, db = Depends(get_db)):
    officer_records = await fetch_all(db, "SELECT id FROM officers WHERE badge_no = $1", [badge_no])
    if not officer_records:
        raise HTTPException(404, "Officer not found")
    await execute(db, "DELETE FROM officers WHERE badge_no = $1", [badge_no])
    await db.commit()
    from app.services.audit import log_activity
    try:
        await log_activity(db, None, "delete_officer", f"Officer {badge_no} deleted")
    except Exception as e:
        logger.error("Audit log failed", error=str(e))
    return {"status": "deleted"}

@router.get("/health", dependencies=[Depends(verify_admin_role)])
async def system_health(db = Depends(get_db)):
    try:
        await execute(db, "SELECT 1")
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"db": db_status, "websockets": 0, "last_seed": None}

@router.get("/audit", dependencies=[Depends(verify_admin_role)])
async def get_audit_logs(officer: Optional[str] = None, type: Optional[str] = None, q: Optional[str] = None, db = Depends(get_db)):
    query = """
        SELECT a.created_at as changed_at, o.name as officer_name, o.badge_no, a.action, a.details as new_value
        FROM system_logs a
        LEFT JOIN officers o ON a.officer_id = o.id
        WHERE 1=1
    """
    params = []
    idx = 1
    if officer:
        query += f" AND (o.badge_no = ${idx} OR o.name ILIKE ${idx})"
        params.append(officer if officer.isalnum() else f"%{officer}%")
        idx += 1
    if type:
        query += f" AND a.action = ${idx}"
        params.append(type)
        idx += 1
    if q:
        query += f" AND a.details ILIKE ${idx}"
        params.append(f"%{q}%")
        idx += 1
    query += f" ORDER BY a.created_at DESC LIMIT 100"
    return await fetch_all(db, query, params)

class PermissionOverride(BaseModel):
    permission_key: str
    granted: bool

@router.get("/permissions", dependencies=[Depends(verify_admin_role)])
async def get_all_permissions(db = Depends(get_db)):
    """Get all available permissions (the IAM policies)."""
    return await fetch_all(db, "SELECT * FROM permissions ORDER BY module, action")

@router.get("/officers/{badge_no}/permissions", dependencies=[Depends(verify_admin_role)])
async def get_officer_permissions(badge_no: str, db = Depends(get_db)):
    """Get specific IAM style overrides for an officer."""
    officer_records = await fetch_all(db, "SELECT id FROM officers WHERE badge_no = $1", [badge_no])
    if not officer_records:
        raise HTTPException(404, "Officer not found")
    officer_id = officer_records[0]['id']
    return await fetch_all(db, "SELECT permission_key, granted FROM officer_permission_overrides WHERE officer_id = $1", [officer_id])

@router.put("/officers/{badge_no}/permissions", dependencies=[Depends(verify_admin_role)])
async def set_officer_permissions(badge_no: str, overrides: List[PermissionOverride], db = Depends(get_db)):
    """Set IAM style overrides for an officer."""
    officer_records = await fetch_all(db, "SELECT id FROM officers WHERE badge_no = $1", [badge_no])
    if not officer_records:
        raise HTTPException(404, "Officer not found")
    officer_id = officer_records[0]['id']
    
    # First delete all existing overrides for this officer
    await execute(db, "DELETE FROM officer_permission_overrides WHERE officer_id = $1", [officer_id])
    
    # Then insert the new ones
    for override in overrides:
        await execute(db, """
            INSERT INTO officer_permission_overrides (officer_id, permission_key, granted)
            VALUES ($1, $2, $3)
        """, [officer_id, override.permission_key, override.granted])
        
    from app.services.audit import log_activity
    try:
        await log_activity(db, None, "set_permissions", f"Permissions updated for officer {badge_no}")
    except Exception as e:
        logger.error("Audit log failed", error=str(e))
        
    await db.commit()
    return {"status": "permissions updated"}
