from app.db.connection import get_db, fetch_one, fetch_all, execute

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import structlog

router = APIRouter()
logger = structlog.get_logger()

class CCTVAlertRequest(BaseModel):
    camera_id:    str
    camera_name:  Optional[str] = None
    source:       str   # 'iccc' or 'samraksha_model'
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
    # Note: ICCC webhook doesn't use JWT, uses API key
    # Add API key validation middleware for this endpoint
):
    if body.source not in ('iccc', 'samraksha_model'):
        raise HTTPException(400, "source must be 'iccc' or 'samraksha_model'")

    if body.alert_type not in (
        'crowd_density', 'loitering', 'anomaly', 'anpr'
    ):
        raise HTTPException(400, "Invalid alert_type")

    matched_case_id = None
    if body.plate_no:
        background_tasks.add_task(
            check_anpr_match, body.plate_no, body.camera_id, db
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
    camera_id: str,
    db
):
    matched = await fetch_one(db, """
        SELECT c.case_id, c.fir_no, c.crime_type
        FROM cases c
        WHERE c.case_status IN ('open','arrested')
          AND c.case_id IN (
              SELECT case_id FROM cctv_alerts
              WHERE plate_no = $1 AND matched_case IS NULL
          )
        LIMIT 1
    """, [plate_no])

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