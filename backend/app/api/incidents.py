from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import structlog

from app.db.connection import get_db, fetch_one, execute

router = APIRouter()
logger = structlog.get_logger()

class PCRWebhook(BaseModel):
    incident_type: str
    location_text: str
    lat:           float
    lon:           float
    severity:      int = 3
    caller_phone:  Optional[str] = None

@router.post("/pcr")
async def receive_pcr_incident(
    body: PCRWebhook,
    db = Depends(get_db)
):
    # Receives incidents from Police Control Room (100 call center).
    # PCR operator logs incident -> system updates database & broadcasts via WebSockets.
    try:
        incident = await fetch_one(db, """
            INSERT INTO incidents
            (source, crime_type, lat, lon,
             geoloc, severity, status, timestamp)
            VALUES ('pcr', $1, $2, $3,
                    ST_MakePoint($3,$2)::GEOGRAPHY,
                    $4, 'active', NOW())
            RETURNING id
        """, [body.incident_type, body.lat, body.lon, body.severity])

        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error("Failed to insert PCR incident", error=str(e))
        raise HTTPException(500, "Database insertion failed")

    # Broadcast live updates
    try:
        from app.api.websocket import manager
        await manager.broadcast({
            'type':      'PCR_INCIDENT',
            'incident': {
                'id':            incident['id'],
                'crime_type':    body.incident_type,
                'lat':           body.lat,
                'lon':           body.lon,
                'severity':      body.severity,
                'source':        'pcr',
                'timestamp':     None, # manager will serialize NOW()
                'location':      body.location_text
            }
        })
    except Exception as ws_err:
        logger.warning("Failed to broadcast PCR incident WebSocket", error=str(ws_err))

    return {"incident_id": incident['id'], "status": "received"}

@router.get("/")
async def get_recent_incidents(db = Depends(get_db)):
    try:
        from app.db.connection import fetch_all
        incidents = await fetch_all(db, """
            SELECT id, source, crime_type, lat, lon, severity, status, timestamp
            FROM incidents
            ORDER BY timestamp DESC
            LIMIT 20
        """)
        return {"incidents": [dict(i) for i in incidents]}
    except Exception as e:
        logger.error("Failed to fetch incidents", error=str(e))
        raise HTTPException(500, "Database fetch failed")
