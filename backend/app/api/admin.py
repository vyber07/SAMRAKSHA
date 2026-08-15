from sqlalchemy import text
from sqlalchemy import text
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
    password: Optional[str] = None

class OfficerUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    ps_id: Optional[str] = None
    is_active: Optional[bool] = None

from app.db.connection import get_db, fetch_all, execute
from app.api.auth import get_current_officer
import bcrypt
import secrets
import string

def verify_admin_role(officer = Depends(get_current_officer)):
    if officer['role'].lower() != 'admin':
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return officer

@router.get("/officers", dependencies=[Depends(verify_admin_role)])
async def get_officers(db = Depends(get_db)):
    return (await db.execute(text("SELECT badge_no, name, role, ps_id, is_active FROM officers"), {})).mappings().fetchall()

@router.post("/officers", dependencies=[Depends(verify_admin_role)])
async def create_officer(officer: OfficerCreate, db = Depends(get_db)):
    # Validate ps_id
    try:
        ps_records = (await db.execute(text("SELECT id FROM police_stations WHERE id = :p1"), {'p1': officer.ps_id})).mappings().fetchall()
        if not ps_records:
            raise HTTPException(status_code=400, detail=f"Invalid police station ID: {officer.ps_id}")
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=f"Invalid police station ID format: {officer.ps_id}")

    # Generate password if not supplied
    generated_password = None
    if not officer.password:
        alphabet = string.ascii_letters + string.digits + string.punctuation
        generated_password = ''.join(secrets.choice(alphabet) for i in range(12))
        password_to_use = generated_password
    else:
        password_to_use = officer.password

    hashed_pw = bcrypt.hashpw(password_to_use.encode(), bcrypt.gensalt(rounds=12)).decode()
    officer_id = str(uuid.uuid4())
    await db.execute(text("""
        INSERT INTO officers (id, badge_no, name, role, ps_id, password_hash)
        VALUES (:p1, :p2, :p3, :p4, :p5, :p6)
    """), {'p1': officer_id, 'p2': officer.badge_no, 'p3': officer.name, 'p4': officer.role, 'p5': officer.ps_id, 'p6': hashed_pw})
    
    from app.services.audit import log_activity
    try:
        await log_activity(db, None, "create_officer", f"Officer {officer.badge_no} created with role {officer.role}")
    except Exception as e:
        logger.error("Audit log failed", error=str(e))
        
    await db.commit()
    response = {"status": "created"}
    if generated_password:
        response["generated_password"] = generated_password
    return response

@router.patch("/officers/{badge_no}", dependencies=[Depends(verify_admin_role)])
async def update_officer(badge_no: str, officer: OfficerUpdate, db = Depends(get_db)):
    updates = []
    params = [badge_no]
    idx = 2
    for field, value in officer.model_dump(exclude_unset=True).items():
        updates.append(f"{field} = :p{idx}")
        params.append(value)
        idx += 1
    
    if not updates:
        return {"status": "no changes"}
        
    query = f"UPDATE officers SET {', '.join(updates)} WHERE badge_no = :p1"
    await db.execute(text(query), {f'p{i+1}': v for i, v in enumerate(params)})
    
    from app.services.audit import log_activity
    try:
        await log_activity(db, None, "update_officer", f"Officer {badge_no} updated: {list(officer.model_dump(exclude_unset=True).keys())}")
    except Exception as e:
        logger.error("Audit log failed", error=str(e))
        
    await db.commit()
    return {"status": "updated"}

@router.delete("/officers/{badge_no}", dependencies=[Depends(verify_admin_role)])
async def delete_officer(badge_no: str, db = Depends(get_db)):
    officer_records = (await db.execute(text("SELECT id FROM officers WHERE badge_no = :p1"), {'p1': badge_no})).mappings().fetchall()
    if not officer_records:
        raise HTTPException(404, "Officer not found")
    await db.execute(text("DELETE FROM officers WHERE badge_no = :p1"), {'p1': badge_no})
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
        await db.execute(text("SELECT 1"), {})
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
        query += f" AND (o.badge_no ILIKE :p{idx} OR o.name ILIKE :p{idx})"
        params.append(f"%{officer.strip()}%")
        idx += 1
    if type:
        query += f" AND a.action = :p{idx}"
        params.append(type)
        idx += 1
    if q:
        query += f" AND a.details ILIKE :p{idx}"
        params.append(f"%{q}%")
        idx += 1
    query += f" ORDER BY a.created_at DESC LIMIT 100"
    return (await db.execute(text(query), {f'p{i+1}': v for i, v in enumerate(params)})).mappings().fetchall()

class PermissionOverride(BaseModel):
    permission_key: str
    granted: bool

@router.get("/permissions", dependencies=[Depends(verify_admin_role)])
async def get_all_permissions(db = Depends(get_db)):
    """Get all available permissions (the IAM policies)."""
    return (await db.execute(text("SELECT * FROM permissions ORDER BY module, action"), {})).mappings().fetchall()

@router.get("/officers/{badge_no}/permissions", dependencies=[Depends(verify_admin_role)])
async def get_officer_permissions(badge_no: str, db = Depends(get_db)):
    """Get specific IAM style overrides for an officer."""
    officer_records = (await db.execute(text("SELECT id FROM officers WHERE badge_no = :p1"), {'p1': badge_no})).mappings().fetchall()
    if not officer_records:
        raise HTTPException(404, "Officer not found")
    officer_id = officer_records[0]['id']
    return (await db.execute(text("SELECT permission_key, granted FROM officer_permission_overrides WHERE officer_id = :p1"), {'p1': officer_id})).mappings().fetchall()

@router.put("/officers/{badge_no}/permissions", dependencies=[Depends(verify_admin_role)])
async def set_officer_permissions(badge_no: str, overrides: List[PermissionOverride], db = Depends(get_db)):
    """Set IAM style overrides for an officer."""
    officer_records = (await db.execute(text("SELECT id FROM officers WHERE badge_no = :p1"), {'p1': badge_no})).mappings().fetchall()
    if not officer_records:
        raise HTTPException(404, "Officer not found")
    officer_id = officer_records[0]['id']
    
    # First delete all existing overrides for this officer
    await db.execute(text("DELETE FROM officer_permission_overrides WHERE officer_id = :p1"), {'p1': officer_id})
    
    # Then insert the new ones
    for override in overrides:
        await db.execute(text("""
            INSERT INTO officer_permission_overrides (officer_id, permission_key, granted)
            VALUES (:p1, :p2, :p3)
        """), {'p1': officer_id, 'p2': override.permission_key, 'p3': override.granted})
        
    from app.services.audit import log_activity
    try:
        await log_activity(db, None, "set_permissions", f"Permissions updated for officer {badge_no}")
    except Exception as e:
        logger.error("Audit log failed", error=str(e))
        
    await db.commit()
    return {"status": "permissions updated"}

@router.patch("/officers/me")
async def update_my_profile(
    updates: OfficerUpdate,
    officer = Depends(get_current_officer),
    db = Depends(get_db)
):
    fields = updates.model_dump(exclude_unset=True)
    if not fields:
        raise HTTPException(400, "No fields to update")
    # Only allow name and phone
    allowed = {k: v for k, v in fields.items() if k in ("name",)}
    if not allowed:
        raise HTTPException(400, "No permitted fields")
    params = []
    updates_sql = []
    for col, val in allowed.items():
        params.append(val)
        updates_sql.append(f"{col} = :p{len(params)}")
    params.append(officer["id"])
    await db.execute(text(f"UPDATE officers SET {', '.join(updates_sql)} WHERE id = :p{len(params)}"), {f'p{i+1}': v for i, v in enumerate(params)})
    return {"message": "Profile updated"}

