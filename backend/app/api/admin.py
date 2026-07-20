from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import structlog

router = APIRouter()
logger = structlog.get_logger()

class OfficerCreate(BaseModel):
    badge_no: str
    name: str
    role: str
    ps_id: str
    password: str

class OfficerUpdate(BaseModel):
    name: Optional[str]
    role: Optional[str]
    ps_id: Optional[str]
    is_active: Optional[bool]

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
    await execute(db, """
        INSERT INTO officers (badge_no, name, role, ps_id, password_hash)
        VALUES ($1, $2, $3, $4, $5)
    """, [officer.badge_no, officer.name, officer.role, officer.ps_id, hashed_pw])
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
    return {"status": "updated"}

@router.get("/health", dependencies=[Depends(verify_admin_role)])
async def system_health(db = Depends(get_db)):
    try:
        await execute(db, "SELECT 1")
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"db": db_status, "websockets": 0, "last_seed": None}

@router.get("/audit", dependencies=[Depends(verify_admin_role)])
async def get_audit_logs(officer: Optional[str] = None, type: Optional[str] = None, db = Depends(get_db)):
    query = "SELECT * FROM case_audit WHERE 1=1"
    params = []
    idx = 1
    if officer:
        query += f" AND officer_id = ${idx}"
        params.append(officer)
        idx += 1
    if type:
        query += f" AND action = ${idx}"
        params.append(type)
        idx += 1
    query += " ORDER BY changed_at DESC LIMIT 100"
    return await fetch_all(db, query, params)
