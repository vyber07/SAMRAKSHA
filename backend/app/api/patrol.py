from app.db.connection import get_db, fetch_one, fetch_all, execute
from app.api.auth import get_current_officer

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
import structlog

router = APIRouter()
logger = structlog.get_logger()

@router.get("/routes")
async def get_patrol_routes(
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    units = await fetch_all(db, """
        SELECT id, unit_name, current_lat, current_lon, status
        FROM patrol_units
        WHERE status IN ('available','deployed')
          AND ps_id = $1
          AND current_lat IS NOT NULL
    """, [str(officer['ps_id'])])

    if not units:
        return {"routes": [], "message": "No active patrol units"}

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

    if not hotspots:
        return {"routes": [], "message": "No hotspots to route to"}

    from app.services.routing import optimize_patrol_routes
    routes = await optimize_patrol_routes(
        patrol_units=[dict(u) for u in units],
        hotspots=[dict(h) for h in hotspots]
    )

    return {
        "routes":   routes,
        "units":    len(units),
        "hotspots": len(hotspots),
        "computed_at": datetime.utcnow().isoformat()
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
    db = Depends(get_db)
    # Note: PCR webhook uses API key auth, not JWT
):
    """
    Receives incidents from Police Control Room (100 call center).
    PCR operator logs incident → system auto-updates patrol routes.
    """
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

class UnitUpdate(BaseModel):
    current_lat: float
    current_lon: float
    status:      str

@router.patch("/units/{unit_id}")
async def update_patrol_unit(
    unit_id: str,
    body: UnitUpdate,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    await execute(db, """
        UPDATE patrol_units
        SET current_lat = $1, current_lon = $2,
            status = $3, last_update = NOW()
        WHERE id = $4
    """, [body.current_lat, body.current_lon,
          body.status, unit_id])
    await db.commit()
    return {"status": "updated"}