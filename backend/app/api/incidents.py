from sqlalchemy import text
from sqlalchemy import text
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import os
from app.db.connection import get_db, fetch_one, execute
from app.api.auth import get_current_officer

router = APIRouter()
security = HTTPBearer(auto_error=False)

async def verify_incident_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    x_api_token: Optional[str] = Header(None, alias="X-API-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db = Depends(get_db)
):
    valid_tokens = set(filter(None, [
        os.getenv("PCR_WEBHOOK_TOKEN"),
        os.getenv("INCIDENT_WEBHOOK_KEY"),
        os.getenv("REPORT_TOKEN"),
    ]))
    if (x_api_key and x_api_key in valid_tokens) or (x_api_token and x_api_token in valid_tokens):
        return True

    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif authorization:
        if authorization.startswith("Bearer "):
            token = authorization.split(" ", 1)[1]
        else:
            token = authorization

    if token:
        if token in valid_tokens:
            return True
        try:
            officer = await get_current_officer(token, db)
            if officer:
                return officer
        except Exception:
            pass

    raise HTTPException(status_code=401, detail="Authentication failed: Valid JWT token or API Key/Token required")

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

class ReportIncident(BaseModel):
    type: str
    location: str
    severity: str
    description: str = ""
    lat: Optional[float] = None
    lon: Optional[float] = None

@router.post("/report")
async def report_incident(
    body: ReportIncident,
    db = Depends(get_db),
    auth_check = Depends(verify_incident_auth)
):
    sev_map = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
    severity_int = sev_map.get(body.severity.lower(), 2)
    
    if body.lat is not None and body.lon is not None:
        lat, lon = body.lat, body.lon
    else:
        ps = (await db.execute(text("SELECT lat, lon FROM police_stations WHERE ward ILIKE :p1 OR name ILIKE :p1 LIMIT 1"), {'p1': f"%{body.location}%"})).mappings().fetchone()
        if ps and ps.get('lat') is not None and ps.get('lon') is not None:
            lat = float(ps['lat'])
            lon = float(ps['lon'])
        else:
            lat = 23.0225
            lon = 72.5714
    
    incident_id = (await db.execute(text("""
        INSERT INTO incidents
        (source, crime_type, lat, lon, geoloc, severity, status, ward)
        VALUES ('manual', :p1, :p2, :p3, ST_MakePoint(:p3,:p2)::GEOGRAPHY, :p4, 'active', :p5)
        RETURNING id
    """), {'p1': body.type, 'p2': lat, 'p3': lon, 'p4': severity_int, 'p5': body.location})).mappings().fetchone()
    await db.commit()
    
    from app.api.websocket import manager
    await manager.broadcast({
        'type': 'NEW_INCIDENT',
        'payload': {
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
        "time": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        "description": body.description
    }
@router.get("/sla_breaches")
async def get_sla_breaches(
    db = Depends(get_db),
    auth_check = Depends(verify_incident_auth)
):
    from app.db.connection import fetch_all
    breaches = (await db.execute(text("""
        SELECT id, crime_type, lat, lon, severity, timestamp
        FROM incidents
        WHERE status = 'active'
          AND timestamp < NOW() - INTERVAL '15 minutes'
        ORDER BY timestamp ASC
    """), {})).mappings().fetchall()
    return {"breaches": breaches}
