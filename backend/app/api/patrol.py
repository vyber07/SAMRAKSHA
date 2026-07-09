from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
import structlog

from app.db.connection import get_db, fetch_all, execute, fetch_one
from app.api.auth import get_current_officer
from app.services.routing import optimize_patrol_routes

router = APIRouter()
logger = structlog.get_logger()

class UnitRegister(BaseModel):
    unit_name: str
    ps_id: str
    current_lat: float
    current_lon: float

class UnitUpdate(BaseModel):
    current_lat: float
    current_lon: float
    status:      str

@router.post("/units")
async def register_patrol_unit(
    body: UnitRegister,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] not in ('sho', 'dcp', 'admin'):
        raise HTTPException(403, "Access denied")

    result = await fetch_one(db, """
        INSERT INTO patrol_units
        (unit_name, ps_id, current_lat, current_lon, status)
        VALUES ($1, $2, $3, $4, 'available')
        RETURNING id
    """, [body.unit_name, body.ps_id, body.current_lat, body.current_lon])

    await db.commit()
    return {"id": str(result['id']), "status": "registered"}

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

    # Fetch crime incidents within 7 days to identify hotspots
    hotspots = await fetch_all(db, """
        SELECT i.ward, 
               COALESCE(AVG(z.risk_score), 40) as risk_score,
               AVG(i.lat) as lat, AVG(i.lon) as lon
        FROM incidents i
        LEFT JOIN zone_risk_scores z ON i.ward = z.ward
        WHERE i.timestamp > NOW() - INTERVAL '7 days'
          AND i.ward IS NOT NULL
        GROUP BY i.ward
        ORDER BY risk_score DESC
        LIMIT 8
    """)

    if not hotspots:
        # Fallback to police stations or generic ward coordinates if no recent incidents exist
        hotspots = await fetch_all(db, """
            SELECT name as ward, 50.0 as risk_score, lat, lon 
            FROM police_stations
            LIMIT 5
        """)

    if not hotspots:
        return {"routes": [], "message": "No hotspots to route to"}

    try:
        routes = await optimize_patrol_routes(
            patrol_units=[dict(u) for u in units],
            hotspots=[dict(h) for h in hotspots]
        )
    except Exception as e:
        logger.error("Patrol routing optimization failure", error=str(e))
        routes = []

    return {
        "routes":   routes,
        "units":    len(units),
        "hotspots": len(hotspots),
        "computed_at": datetime.utcnow().isoformat()
    }

@router.patch("/units/{unit_id}")
async def update_patrol_unit(
    unit_id: str,
    body: UnitUpdate,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    # IO, SHO, Admin, DCP can update unit positions
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    await execute(db, """
        UPDATE patrol_units
        SET current_lat = $1, current_lon = $2,
            status = $3, last_update = NOW()
        WHERE id = $4
    """, [body.current_lat, body.current_lon, body.status, unit_id])
    
    await db.commit()
    return {"status": "updated"}
