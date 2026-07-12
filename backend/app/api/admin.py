from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import structlog
import bcrypt
import os

from app.db.connection import get_db, fetch_all, fetch_one, execute
from app.api.auth import get_current_officer

router = APIRouter()
logger = structlog.get_logger()

def _require_admin(officer):
    if officer['role'] != 'admin':
        raise HTTPException(403, "Admin role required")

def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(12)).decode()

# ── Officer management ────────────────────────────────────────────────

class OfficerCreate(BaseModel):
    badge_no: str
    name:     str
    role:     str
    ps_id:    Optional[str] = None
    password: str           # plaintext — hashed server-side

class OfficerPatch(BaseModel):
    is_active: Optional[bool] = None
    role:      Optional[str]  = None
    ps_id:     Optional[str]  = None

@router.get("/officers")
async def list_officers(
    db      = Depends(get_db),
    officer = Depends(get_current_officer)
):
    _require_admin(officer)
    return await fetch_all(db, """
        SELECT o.id, o.badge_no, o.name, o.role, o.ps_id,
               o.is_active, o.last_login,
               ps.name AS ps_name
        FROM officers o
        LEFT JOIN police_stations ps ON o.ps_id = ps.id
        ORDER BY o.name
    """)

@router.post("/officers", status_code=201)
async def create_officer(
    body:    OfficerCreate,
    db     = Depends(get_db),
    officer= Depends(get_current_officer)
):
    _require_admin(officer)
    if body.role not in ('constable', 'io', 'sho', 'dcp', 'admin'):
        raise HTTPException(400, "Invalid role")
    existing = await fetch_one(db, "SELECT id FROM officers WHERE badge_no = $1", [body.badge_no])
    if existing:
        raise HTTPException(409, "Badge number already exists")
    hashed = _hash_password(body.password)
    await execute(db, """
        INSERT INTO officers (badge_no, name, role, ps_id, password_hash)
        VALUES ($1, $2, $3, $4::uuid, $5)
    """, [body.badge_no, body.name, body.role, body.ps_id, hashed])
    return {"status": "created"}

@router.patch("/officers/{officer_id}")
async def patch_officer(
    officer_id: str,
    body:       OfficerPatch,
    db        = Depends(get_db),
    officer   = Depends(get_current_officer)
):
    _require_admin(officer)
    target = await fetch_one(db, "SELECT id FROM officers WHERE id = $1::uuid", [officer_id])
    if not target:
        raise HTTPException(404, "Officer not found")
    if body.is_active is not None:
        await execute(db, "UPDATE officers SET is_active = $1 WHERE id = $2::uuid",
                      [body.is_active, officer_id])
    if body.role is not None:
        await execute(db, "UPDATE officers SET role = $1 WHERE id = $2::uuid",
                      [body.role, officer_id])
    if body.ps_id is not None:
        await execute(db, "UPDATE officers SET ps_id = $1::uuid WHERE id = $2::uuid",
                      [body.ps_id, officer_id])
    return {"status": "updated"}

# ── Police station management ─────────────────────────────────────────

class StationCreate(BaseModel):
    name:    str
    zone:    Optional[str] = None
    ward:    Optional[str] = None
    lat:     Optional[float] = None
    lon:     Optional[float] = None
    address: Optional[str] = None

@router.get("/stations")
async def list_stations(
    db     = Depends(get_db),
    officer= Depends(get_current_officer)
):
    _require_admin(officer)
    return await fetch_all(db, "SELECT * FROM police_stations ORDER BY name")

@router.post("/stations", status_code=201)
async def create_station(
    body:   StationCreate,
    db    = Depends(get_db),
    officer=Depends(get_current_officer)
):
    _require_admin(officer)
    await execute(db, """
        INSERT INTO police_stations (name, zone, ward, lat, lon, address)
        VALUES ($1, $2, $3, $4, $5, $6)
    """, [body.name, body.zone, body.ward, body.lat, body.lon, body.address])
    return {"status": "created"}

@router.patch("/stations/{station_id}")
async def patch_station(
    station_id: str,
    body:       StationCreate,
    db        = Depends(get_db),
    officer   = Depends(get_current_officer)
):
    _require_admin(officer)
    await execute(db, """
        UPDATE police_stations
        SET name=$1, zone=$2, ward=$3, lat=$4, lon=$5, address=$6
        WHERE id=$7::uuid
    """, [body.name, body.zone, body.ward, body.lat, body.lon, body.address, station_id])
    return {"status": "updated"}

@router.delete("/stations/{station_id}")
async def delete_station(
    station_id: str,
    db        = Depends(get_db),
    officer   = Depends(get_current_officer)
):
    _require_admin(officer)
    await execute(db, "DELETE FROM police_stations WHERE id=$1::uuid", [station_id])
    return {"status": "deleted"}

# ── Officer permission management ────────────────────────────────────

VALID_PERMISSIONS = {
    'view_map', 'create_fir', 'view_cases', 'edit_case', 'generate_docs',
    'view_cctv', 'assistant_all', 'view_analytics', 'admin_settings',
    'admin_officers', 'admin_stations', 'admin_permissions',
    'admin_access_log', 'admin_system_health',
}

class PermissionGrant(BaseModel):
    permission: str
    granted:    bool = True

@router.get("/officers/{officer_id}/permissions")
async def list_officer_permissions(
    officer_id: str,
    db        = Depends(get_db),
    officer   = Depends(get_current_officer)
):
    """List all custom permission overrides for an officer."""
    _require_admin(officer)
    target = await fetch_one(db,
        "SELECT id, badge_no, name, role FROM officers WHERE id = $1::uuid",
        [officer_id]
    )
    if not target:
        raise HTTPException(404, "Officer not found")

    rows = await fetch_all(db, """
        SELECT op.id, op.permission, op.granted, op.granted_at,
               o.badge_no AS granted_by_badge
        FROM officer_permissions op
        LEFT JOIN officers o ON op.granted_by = o.id
        WHERE op.officer_id = $1::uuid
        ORDER BY op.permission
    """, [officer_id])

    return {
        "officer": {
            "id":      str(target["id"]),
            "badge_no": target["badge_no"],
            "name":    target["name"],
            "role":    target["role"],
        },
        "custom_permissions": [dict(r) for r in rows],
    }

@router.post("/officers/{officer_id}/permissions", status_code=201)
async def grant_officer_permission(
    officer_id: str,
    body:       PermissionGrant,
    db        = Depends(get_db),
    officer   = Depends(get_current_officer)
):
    """Grant or explicitly revoke a permission for an officer (upsert)."""
    _require_admin(officer)

    if body.permission not in VALID_PERMISSIONS:
        raise HTTPException(400, f"Unknown permission '{body.permission}'. "
                                 f"Valid: {sorted(VALID_PERMISSIONS)}")

    target = await fetch_one(db,
        "SELECT id FROM officers WHERE id = $1::uuid", [officer_id]
    )
    if not target:
        raise HTTPException(404, "Officer not found")

    await execute(db, """
        INSERT INTO officer_permissions (officer_id, permission, granted, granted_by)
        VALUES ($1::uuid, $2, $3, $4::uuid)
        ON CONFLICT (officer_id, permission)
        DO UPDATE SET granted = EXCLUDED.granted,
                      granted_by = EXCLUDED.granted_by,
                      granted_at = NOW()
    """, [officer_id, body.permission, body.granted, str(officer["id"])])

    action = "granted" if body.granted else "revoked"
    logger.info("permission_changed", permission=body.permission,
                target=officer_id, action=action, by=officer["badge_no"])
    return {"status": action, "permission": body.permission, "granted": body.granted}

@router.delete("/officers/{officer_id}/permissions/{permission}")
async def delete_officer_permission(
    officer_id: str,
    permission: str,
    db        = Depends(get_db),
    officer   = Depends(get_current_officer)
):
    """Remove a custom permission override (reverts to role default)."""
    _require_admin(officer)
    target = await fetch_one(db,
        "SELECT id FROM officers WHERE id = $1::uuid", [officer_id]
    )
    if not target:
        raise HTTPException(404, "Officer not found")

    await execute(db,
        "DELETE FROM officer_permissions WHERE officer_id = $1::uuid AND permission = $2",
        [officer_id, permission]
    )
    logger.info("permission_override_removed", permission=permission,
                target=officer_id, by=officer["badge_no"])
    return {"status": "removed", "permission": permission}

# ── Full audit log (admin unrestricted) ───────────────────────────────

@router.get("/audit")
async def admin_audit_log(
    officer_id:  Optional[str] = None,
    action:      Optional[str] = None,
    days:        int = 7,
    db         = Depends(get_db),
    officer    = Depends(get_current_officer)
):
    _require_admin(officer)
    filters = ["changed_at > NOW() - INTERVAL '1 day' * $1"]
    params  = [days]
    if officer_id:
        params.append(officer_id)
        filters.append(f"officer_id = ${len(params)}::uuid")
    if action:
        params.append(action)
        filters.append(f"action = ${len(params)}")
    where = " AND ".join(filters)
    return await fetch_all(db, f"""
        SELECT ca.*, o.name AS officer_name, o.badge_no
        FROM case_audit ca
        LEFT JOIN officers o ON ca.officer_id = o.id
        WHERE {where}
        ORDER BY changed_at DESC
        LIMIT 500
    """, params)
