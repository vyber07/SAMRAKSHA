from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import structlog

from app.db.connection import get_db, fetch_one, execute
from app.api.auth import get_current_officer

router = APIRouter()
logger = structlog.get_logger()

class CCTVAlertRequest(BaseModel):
    camera_id:    str
    camera_name:  Optional[str] = None
    source:       str
    alert_type:   str
    confidence:   float
    person_count: Optional[int] = None
    lat:          float
    lon:          float
    plate_no:     Optional[str] = None

@router.post("/alert")
async def ingest_alert(
    body: CCTVAlertRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    if body.source not in ('iccc', 'samraksha_model'):
        raise HTTPException(400, "source must be 'iccc' or 'samraksha_model'")

    if body.alert_type not in (
        'crowd_density', 'loitering', 'anomaly', 'anpr'
    ):
        raise HTTPException(400, "Invalid alert_type")

    matched_case_id = None

    result = await fetch_one(db, """
        INSERT INTO cctv_alerts
        (camera_id, camera_name, source, alert_type,
         confidence, person_count, lat, lon,
         geoloc, plate_no, matched_case, ts)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
                ST_MakePoint($8,$7)::GEOGRAPHY,
                $9,$10, NOW())
        RETURNING id, ts
    """, [
        body.camera_id, body.camera_name, body.source,
        body.alert_type, body.confidence, body.person_count,
        body.lat, body.lon,
        body.plate_no, matched_case_id
    ])

    await db.commit()

    if body.plate_no:
        background_tasks.add_task(
            check_anpr_match, body.plate_no, body.camera_id, result['id']
        )

    # Schedule DCP escalation simulation (escalates after 15s representing 15 minutes in demo mode)
    if body.confidence > 0.90 or body.alert_type in ('crowd_density', 'anomaly'):
        background_tasks.add_task(
            simulate_dcp_escalation, result['id'], body.camera_name or body.camera_id, body.alert_type
        )

    # WebSocket update
    try:
        from app.api.websocket import manager
        await manager.broadcast({
            'type':         'CCTV_ALERT',
            'alert': {
                'id':            result['id'],
                'camera_id':     body.camera_id,
                'camera_name':   body.camera_name,
                'source':        body.source,
                'alert_type':    body.alert_type,
                'confidence':    body.confidence,
                'lat':           body.lat,
                'lon':           body.lon,
                'plate_no':      body.plate_no,
                'ts':            result['ts'].isoformat() if result.get('ts') else None
            }
        })
    except Exception as ws_err:
        logger.warning("Failed to broadcast CCTV alert WebSocket", error=str(ws_err))

    return {"id": result['id'], "status": "ingested"}

async def simulate_dcp_escalation(alert_id: int, camera_name: str, alert_type: str):
    import asyncio
    # Sleep 15 seconds to simulate 15 minutes in demo mode
    await asyncio.sleep(15)
    try:
        from app.api.websocket import manager
        await manager.broadcast({
            'type': 'DCP_ESCALATION',
            'alert_id': alert_id,
            'camera': camera_name,
            'alert_type': alert_type,
            'message': f"CRITICAL: alert '{alert_type.replace('_',' ')}' at {camera_name} unaddressed for 15 minutes. Escalated to DCP."
        })
    except Exception as ws_err:
        logger.warning("Failed to broadcast DCP escalation WebSocket", error=str(ws_err))


async def check_anpr_match(
    plate_no: str,
    camera_id: str,
    alert_id: int
):
    # Fetch DB connection manually as it runs in background task
    db_gen = get_db()
    db = await db_gen.__anext__()
    try:
        # Check if plate matches an open case with accused or vehicle details in the database
        matched = await fetch_one(db, """
            SELECT case_id, fir_no, crime_type
            FROM cases
            WHERE case_status IN ('open','arrested')
              AND crime_narrative ILIKE '%' || $1 || '%'
            LIMIT 1
        """, [plate_no])

        if matched:
            await execute(db, """
                UPDATE cctv_alerts
                SET matched_case = $1
                WHERE id = $2
            """, [matched['case_id'], alert_id])

            await execute(db, """
                INSERT INTO case_diary
                (case_id, entry_type, description, auto_generated, ts)
                VALUES ($1, 'cctv', $2, TRUE, NOW())
            """, [
                matched['case_id'],
                f"Vehicle ({plate_no}) identified by camera {camera_id} (ANPR Match)"
            ])

            await db.commit()

            from app.api.websocket import manager
            await manager.broadcast({
                'type':    'ANPR_MATCH',
                'fir_no':  matched['fir_no'],
                'plate':   plate_no,
                'camera':  camera_id,
            })
    except Exception as e:
        logger.error("Error in ANPR background task", error=str(e))
    finally:
        try:
            await db_gen.aclose()
        except Exception:
            pass
