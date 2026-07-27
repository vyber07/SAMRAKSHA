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
        units = await fetch_all(db, """
            SELECT id, unit_name, officer_name, vehicle, current_lat, current_lon, status, manual_waypoints
            FROM patrol_units
            WHERE status IN ('available','deployed','active','idle','responding')
              AND (ps_id = $1 OR ps_id IS NULL)
        """, [ps_uuid])
    except (ValueError, AttributeError, TypeError):
        units = await fetch_all(db, """
            SELECT id, unit_name, officer_name, vehicle, current_lat, current_lon, status, manual_waypoints
            FROM patrol_units
            WHERE status IN ('available','deployed','active','idle','responding')
        """, [])

    if not units:
        units = await fetch_all(db, """
            SELECT id, unit_name, officer_name, vehicle, current_lat, current_lon, status, manual_waypoints
            FROM patrol_units
            LIMIT 20
        """, [])

    if not units:
        return {"routes": [], "message": "No active patrol units"}

    # Fetch PS ward
    ps_info = await fetch_one(db, "SELECT ward FROM police_stations WHERE id = $1", [officer['ps_id']])
    ps_ward = ps_info['ward'] if ps_info else None

    # Fetch hotspots constrained by the police station's ward
    hotspots = []
    if ps_ward:
        hotspots = await fetch_all(db, """
            SELECT i.ward, z.risk_score,
                   AVG(i.lat) as lat, AVG(i.lon) as lon
            FROM incidents i
            JOIN zone_risk_scores z ON i.ward = z.ward
            WHERE i.timestamp > NOW() - INTERVAL '7 days'
              AND z.hour_slot = EXTRACT(HOUR FROM NOW())::INTEGER
              AND i.ward = $1
            GROUP BY i.ward, z.risk_score
            ORDER BY z.risk_score DESC
            LIMIT 8
        """, [ps_ward])

    if not hotspots:
        hotspots = await fetch_all(db, """
            SELECT i.ward, z.risk_score,
                   AVG(i.lat) as lat, AVG(i.lon) as lon
            FROM incidents i
            JOIN zone_risk_scores z ON i.ward = z.ward
            WHERE i.timestamp > NOW() - INTERVAL '7 days'
              AND z.hour_slot = EXTRACT(HOUR FROM NOW())::INTEGER
            GROUP BY i.ward, z.risk_score
            ORDER BY z.risk_score DESC
            LIMIT 8
        """, [])

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
    incident_id = await fetch_one(db, """
        INSERT INTO incidents
        (source, crime_type, lat, lon,
         geoloc, severity, status)
        VALUES ('pcr', $1, $2, $3,
                ST_MakePoint($3,$2)::GEOGRAPHY,
                $4, 'active')
        RETURNING id
    """, [body.incident_type, body.lat, body.lon, body.severity])

    await db.commit()
    from app.api.websocket import manager
    await manager.broadcast({
        'type':      'PCR_INCIDENT',
        'incident': {
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
    units = await fetch_all(db, """
        SELECT id, unit_name as name, officer_name, vehicle, current_lat as lat, current_lon as lon, status
        FROM patrol_units
    """, [])
    return units

@router.post("/units")
async def create_patrol_unit(
    body: UnitCreate,
    db = Depends(get_db),
    officer = Depends(auth.require_permission('patrol_dispatch'))
):
    # Try basic geocoding from location string if needed, else fallback
    # The frontend will eventually send proper lat/lon if needed.
    new_unit = await fetch_one(db, """
        INSERT INTO patrol_units 
        (unit_name, officer_name, vehicle, status, ps_id, current_lat, current_lon)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    """, [body.unit_no, body.officer_name, body.vehicle, body.status, str(officer['ps_id']), body.current_lat, body.current_lon])
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
            updates.append(f"{field} = ${idx}")
            params.append(val)
            idx += 1
            
    if body.unit_no is not None:
        updates.append(f"unit_name = ${idx}")
        params.append(body.unit_no)
        idx += 1

    import json
    if body.manual_waypoints is not None:
        updates.append(f"manual_waypoints = ${idx}")
        params.append(json.dumps(body.manual_waypoints))
        idx += 1

    if updates:
        updates.append("last_update = NOW()")
        q = f"UPDATE patrol_units SET {', '.join(updates)} WHERE id = ${idx}"
        params.append(unit_id)
        await execute(db, q, params)
        await db.commit()
        
    return {"status": "updated"}

@router.delete("/units/{unit_id}")
async def delete_patrol_unit(
    unit_id: str,
    db = Depends(get_db),
    officer = Depends(auth.require_permission('patrol_dispatch'))
):
    await execute(db, "DELETE FROM patrol_units WHERE id = $1", [unit_id])
    await db.commit()
    return {"status": "deleted"}