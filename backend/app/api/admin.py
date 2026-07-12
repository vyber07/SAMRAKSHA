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

from app.api.auth import get_current_officer

def verify_admin_role(officer = Depends(get_current_officer)):
    if officer['role'] != 'ADMIN':
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return officer
@router.get("/officers", dependencies=[Depends(verify_admin_role)])
async def get_officers():
    return []

@router.post("/officers", dependencies=[Depends(verify_admin_role)])
async def create_officer(officer: OfficerCreate):
    return {"status": "created"}

@router.patch("/officers/{badge_no}", dependencies=[Depends(verify_admin_role)])
async def update_officer(badge_no: str, officer: OfficerUpdate):
    return {"status": "updated"}

@router.get("/health", dependencies=[Depends(verify_admin_role)])
async def system_health():
    return {"db": "ok", "websockets": 0, "last_seed": None}

@router.get("/audit", dependencies=[Depends(verify_admin_role)])
async def get_audit_logs(officer: Optional[str] = None, type: Optional[str] = None):
    return []
