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

class ReportIncident(BaseModel):
    type: str
    location: str
    severity: str
    description: str = ""

@router.post("/report")
async def report_incident(
    body: ReportIncident,
    db = Depends(get_db)
):
    sev_map = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
    severity_int = sev_map.get(body.severity.lower(), 2)
    import random
    lat = 23.0 + random.uniform(-0.1, 0.1)
    lon = 72.5 + random.uniform(-0.1, 0.1)
    
    incident_id = await fetch_one(db, """
        INSERT INTO incidents
        (source, crime_type, lat, lon, geoloc, severity, status, ward)
        VALUES ('manual', $1, $2, $3, ST_MakePoint($3,$2)::GEOGRAPHY, $4, 'active', $5)
        RETURNING id
    """, [body.type, lat, lon, severity_int, body.location])
    await db.commit()
    
    from app.api.websocket import manager
    await manager.broadcast({
        'type': 'NEW_INCIDENT',
        'incident': {
            'id': incident_id['id'],
            'type': body.type,
            'lat': lat,
            'lon': lon,
            'severity': severity_int,
        }
    })
    
    return {
        "id": incident_id['id'],
        "type": body.type,
        "location": body.location,
        "severity": body.severity,
        "time": __import__('datetime').datetime.utcnow().isoformat(),
        "description": body.description
    }
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
