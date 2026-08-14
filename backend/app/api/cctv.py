from app.db.connection import get_db, fetch_one, fetch_all, execute, AsyncSessionLocal
from app.api.auth import get_current_officer

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import os
import structlog

router = APIRouter()
logger = structlog.get_logger()
security = HTTPBearer(auto_error=False)


async def verify_cctv_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    x_api_token: Optional[str] = Header(None, alias="X-API-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db = Depends(get_db)
):
    valid_keys = set(filter(None, [
        os.getenv("ICCC_API_KEY"),
        os.getenv("CCTV_API_KEY"),
        os.getenv("CCTV_WEBHOOK_KEY"),
    ]))
    if (x_api_key and x_api_key in valid_keys) or (x_api_token and x_api_token in valid_keys):
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
        if token in valid_keys:
            return True
        try:
            officer = await get_current_officer(token, db)
            if officer:
                return officer
        except Exception:
            pass

    raise HTTPException(status_code=401, detail="Authentication failed: Valid API Key or JWT token required")


@router.get("")
async def list_alerts(
    limit: int = 100,
    db = Depends(get_db),
    officer = Depends(get_current_officer),
):
    """Returns recent CCTV alert records with full fields for the frontend."""
    rows = await fetch_all(db, """
        SELECT id, camera_id, source, alert_type, confidence, person_count,
               lat, lon, ts, plate_no, matched_case AS matched_fir
        FROM cctv_alerts
        ORDER BY ts DESC
        LIMIT $1
    """, [limit])
    return rows

@router.get("/cameras")
async def list_cameras(
    db = Depends(get_db),
    officer = Depends(get_current_officer),
):
    """Returns distinct cameras with their latest alert timestamp."""
    rows = await fetch_all(db, """
        SELECT DISTINCT ON (camera_id)
            camera_id, source, lat, lon, ts AS last_alert_at
        FROM cctv_alerts
        ORDER BY camera_id, ts DESC
    """, [])
    return rows

class CCTVAlertRequest(BaseModel):
    camera_id:    str
    camera_name:  Optional[str] = None
    source:       str   # 'iccc', 'samraksha_model', 'samraksha_vision_llamacpp', 'pcr_unit'
    alert_type:   str   # 'crowd_density','loitering','anomaly','anpr'
    confidence:   float
    person_count: Optional[int] = None
    lat:          float
    lon:          float
    plate_no:     Optional[str] = None

@router.post("/alert")
async def ingest_alert(
    body: CCTVAlertRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_db),
    auth_check = Depends(verify_cctv_auth),
):
    if body.source not in ('iccc', 'samraksha_model', 'samraksha_vision_llamacpp', 'pcr_unit'):
        raise HTTPException(400, "source must be 'iccc', 'samraksha_model', 'samraksha_vision_llamacpp', or 'pcr_unit'")

    if body.alert_type not in (
        'crowd_density', 'loitering', 'anomaly', 'anpr'
    ):
        raise HTTPException(400, "Invalid alert_type")

    matched_case_id = None
    if body.plate_no:
        background_tasks.add_task(
            check_anpr_match, body.plate_no, body.camera_id
        )

    result = await fetch_one(db, """
        INSERT INTO cctv_alerts
        (camera_id, source, alert_type,
         confidence, person_count, lat, lon,
         geoloc, plate_no, matched_case)
        VALUES ($1,$2,$3,$4,$5,$6,$7,
                ST_MakePoint($7,$6)::GEOGRAPHY,
                $8,$9)
        RETURNING id
    """, [
        body.camera_id, body.source,
        body.alert_type, body.confidence, body.person_count,
        body.lat, body.lon,
        body.plate_no, matched_case_id
    ])

    await db.commit()

    from app.api.websocket import manager
    await manager.broadcast({
        'type':         'CCTV_ALERT',
        'alert': {
            'id':          result['id'],
            'camera_id':   body.camera_id,
            'source':      body.source,
            'alert_type':  body.alert_type,
            'confidence':  body.confidence,
            'lat':         body.lat,
            'lon':         body.lon,
            'plate_no':    body.plate_no,
        }
    })

    return {"id": result['id'], "status": "ingested"}

async def check_anpr_match(
    plate_no: str,
    camera_id: str
):
    async with AsyncSessionLocal() as db:
        # Search cases table for plate in evidence_items JSON or crime_narrative
        matched = await fetch_one(db, """
            SELECT c.case_id, c.fir_no, c.crime_type
            FROM cases c
            WHERE c.case_status IN ('open','arrested')
              AND (
                  c.crime_narrative ILIKE $1
                  OR c.accused_address ILIKE $1
                  OR c.evidence_items::text ILIKE $1
              )
            LIMIT 1
        """, [f"%{plate_no}%"])

        if matched:
            await execute(db, """
                UPDATE cctv_alerts
                SET matched_case = $1
                WHERE plate_no = $2
                  AND matched_case IS NULL
            """, [matched['case_id'], plate_no])

            await execute(db, """
                INSERT INTO case_diary
                (case_id, entry_type, description, auto_generated)
                VALUES ($1, 'cctv', $2, TRUE)
            """, [
                matched['case_id'],
                f"Vehicle {plate_no} spotted by camera {camera_id} "
                f"(ANPR match — auto-flagged)"
            ])

            await db.commit()

            from app.api.websocket import manager
            await manager.broadcast({
                'type':    'ANPR_MATCH',
                'fir_no':  matched['fir_no'],
                'plate':   plate_no,
                'camera':  camera_id,
            })


from app.api import auth

@router.get("/anomalies")
async def get_cctv_anomalies(
    db = Depends(get_db),
    officer = Depends(auth.require_permission('cctv_view'))
):
    from app.db.connection import fetch_all
    anomalies = await fetch_all(db, """
        SELECT id, camera_id, source, alert_type, confidence, person_count, lat, lon, ts
        FROM cctv_alerts
        ORDER BY ts DESC
        LIMIT 4
    """, [])
    return {"anomalies": anomalies}