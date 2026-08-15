from sqlalchemy import text
from sqlalchemy import text
from app.db.connection import get_db, fetch_one, fetch_all, execute
from app.api.auth import get_current_officer
from app.api.incidents import verify_incident_auth

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
import structlog

from app.api import auth

router = APIRouter()
logger = structlog.get_logger()

@router.get("/routes")
async def get_patrol_routes(
    db = Depends(get_db),
    officer = Depends(auth.require_permission('patrol_view'))
):

    import uuid as _uuid
    ps_id_raw = str(officer.get('ps_id', '') or '')
    try:
        ps_uuid = _uuid.UUID(ps_id_raw)
        units = (await db.execute(text("""
            SELECT id, unit_name, officer_name, vehicle, current_lat, current_lon, status, manual_waypoints
            FROM patrol_units
            WHERE status IN ('available','deployed','active','idle','responding')
              AND (ps_id = :p1 OR ps_id IS NULL)
        """), {'p1': ps_uuid})).mappings().fetchall()
    except (ValueError, AttributeError, TypeError):
        units = (await db.execute(text("""
            SELECT id, unit_name, officer_name, vehicle, current_lat, current_lon, status, manual_waypoints
            FROM patrol_units
            WHERE status IN ('available','deployed','active','idle','responding')
        """), {})).mappings().fetchall()

    if not units:
        units = (await db.execute(text("""
            SELECT id, unit_name, officer_name, vehicle, current_lat, current_lon, status, manual_waypoints
            FROM patrol_units
            LIMIT 20
        """), {})).mappings().fetchall()

    if not units:
        return {"routes": [], "message": "No active patrol units"}

    # Fetch PS ward
    ps_info = (await db.execute(text("SELECT ward FROM police_stations WHERE id = :p1"), {'p1': officer['ps_id']})).mappings().fetchone()
    ps_ward = ps_info['ward'] if ps_info else None

    # Fetch hotspots constrained by the police station's ward
    hotspots = []
    if ps_ward:
        hotspots = (await db.execute(text("""
            SELECT i.ward, z.risk_score,
                   AVG(i.lat) as lat, AVG(i.lon) as lon
            FROM incidents i
            JOIN zone_risk_scores z ON i.ward = z.ward
            WHERE i.timestamp > NOW() - INTERVAL '7 days'
              AND z.hour_slot = EXTRACT(HOUR FROM NOW())::INTEGER
              AND i.ward = :p1
            GROUP BY i.ward, z.risk_score
            ORDER BY z.risk_score DESC
            LIMIT 8
        """), {'p1': ps_ward})).mappings().fetchall()

    if not hotspots:
        hotspots = (await db.execute(text("""
            SELECT i.ward, z.risk_score,
                   AVG(i.lat) as lat, AVG(i.lon) as lon
            FROM incidents i
            JOIN zone_risk_scores z ON i.ward = z.ward
            WHERE i.timestamp > NOW() - INTERVAL '7 days'
              AND z.hour_slot = EXTRACT(HOUR FROM NOW())::INTEGER
            GROUP BY i.ward, z.risk_score
            ORDER BY z.risk_score DESC
            LIMIT 8
        """), {})).mappings().fetchall()

    from app.services.routing import optimize_patrol_routes
    routes = await optimize_patrol_routes(
        patrol_units=[dict(u) for u in units],
        hotspots=[dict(h) for h in hotspots] if hotspots else []
    )

    return {
        "routes":   routes,
        "units":    len(units),
        "hotspots": len(hotspots),
        "computed_at": datetime.now(timezone.utc).isoformat()
    }

class PCRWebhook(BaseModel):
    incident_type: str
    location_text: str
    lat:           float
    lon:           float
    severity:      int = 3
    caller_phone:  str = None

@router.post("/pcr")
async def receive_pcr_incident(
    body: PCRWebhook,
    db = Depends(get_db),
    auth_check = Depends(verify_incident_auth)
):
    incident_id = (await db.execute(text("""
        INSERT INTO incidents
        (source, crime_type, lat, lon,
         geoloc, severity, status)
        VALUES ('pcr', :p1, :p2, :p3,
                ST_MakePoint(:p3,:p2)::GEOGRAPHY,
                :p4, 'active')
        RETURNING id
    """), {'p1': body.incident_type, 'p2': body.lat, 'p3': body.lon, 'p4': body.severity})).mappings().fetchone()

    await db.commit()
    from app.api.websocket import manager
    await manager.broadcast({
        'type':      'PCR_INCIDENT',
        'payload': {
            'id':     incident_id['id'],
            'type':   body.incident_type,
            'lat':    body.lat,
            'lon':    body.lon,
            'severity': body.severity,
        }
    })
    return {"incident_id": incident_id['id'], "status": "received"}

class UnitCreate(BaseModel):
    unit_no: str
    officer_name: str = None
    vehicle: str = None
    status: str = 'available'
    location: str = None # location string or lat/lon
    current_lat: float = 23.0225 # default center if not geocoded
    current_lon: float = 72.5714

@router.get("/units")
async def list_patrol_units(
    db = Depends(get_db),
    officer = Depends(auth.require_permission('patrol_view'))
):
    units = (await db.execute(text("""
        SELECT id, unit_name as name, officer_name, vehicle, current_lat as lat, current_lon as lon, status
        FROM patrol_units
    """), {})).mappings().fetchall()
    return units

@router.post("/units")
async def create_patrol_unit(
    body: UnitCreate,
    db = Depends(get_db),
    officer = Depends(auth.require_permission('patrol_dispatch'))
):
    # Try basic geocoding from location string if needed, else fallback
    # The frontend will eventually send proper lat/lon if needed.
    new_unit = (await db.execute(text("""
        INSERT INTO patrol_units 
        (unit_name, officer_name, vehicle, status, ps_id, current_lat, current_lon)
        VALUES (:p1, :p2, :p3, :p4, :p5, :p6, :p7)
        RETURNING *
    """), {'p1': body.unit_no, 'p2': body.officer_name, 'p3': body.vehicle, 'p4': body.status, 'p5': str(officer['ps_id']), 'p6': body.current_lat, 'p7': body.current_lon})).mappings().fetchone()
    await db.commit()
    return {"status": "created", "unit": new_unit}

class UnitUpdate(BaseModel):
    current_lat: float = None
    current_lon: float = None
    status:      str = None
    unit_no: str = None
    officer_name: str = None
    vehicle: str = None
    manual_waypoints: list = None

@router.patch("/units/{unit_id}")
async def update_patrol_unit(
    unit_id: str,
    body: UnitUpdate,
    db = Depends(get_db),
    officer = Depends(auth.require_permission('patrol_dispatch'))
):
    updates = []
    params = []
    idx = 1
    
    for field in ['current_lat', 'current_lon', 'status', 'officer_name', 'vehicle']:
        val = getattr(body, field)
        if val is not None:
            updates.append(f"{field} = :p{idx}")
            params.append(val)
            idx += 1
            
    if body.unit_no is not None:
        updates.append(f"unit_name = :p{idx}")
        params.append(body.unit_no)
        idx += 1

    import json
    if body.manual_waypoints is not None:
        updates.append(f"manual_waypoints = :p{idx}")
        params.append(json.dumps(body.manual_waypoints))
        idx += 1

    if updates:
        updates.append("last_update = NOW()")
        q = f"UPDATE patrol_units SET {', '.join(updates)} WHERE id = :p{idx}"
        params.append(unit_id)
        await db.execute(text(q), {f'p{i+1}': v for i, v in enumerate(params)})
        await db.commit()
        
    return {"status": "updated"}

@router.delete("/units/{unit_id}")
async def delete_patrol_unit(
    unit_id: str,
    db = Depends(get_db),
    officer = Depends(auth.require_permission('patrol_dispatch'))
):
    await db.execute(text("DELETE FROM patrol_units WHERE id = :p1"), {'p1': unit_id})
    await db.commit()
    return {"status": "deleted"}