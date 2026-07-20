from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.db.connection import get_db, fetch_one, execute

router = APIRouter()

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

@router.get("/sla_breaches")
async def get_sla_breaches(
    db = Depends(get_db)
):
    from app.db.connection import fetch_all
    breaches = await fetch_all(db, """
        SELECT id, crime_type, lat, lon, severity, timestamp
        FROM incidents
        WHERE status = 'active'
          AND timestamp < NOW() - INTERVAL '15 minutes'
        ORDER BY timestamp ASC
    """, [])
    return {"breaches": breaches}
