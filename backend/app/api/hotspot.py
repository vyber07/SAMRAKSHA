from fastapi import APIRouter, Depends, Query, HTTPException
from datetime import datetime, timedelta
import asyncio
import pandas as pd
import structlog

from app.db.connection import get_db, fetch_all, fetch_one, execute
from app.api.auth import get_current_officer
from app.services.prediction import (
    compute_kde_heatmap,
    run_dbscan_clustering,
    RiskPredictor
)

router = APIRouter()
logger = structlog.get_logger()

def risk_level(score: float) -> str:
    if score >= 80: return 'HIGH'
    if score >= 60: return 'ELEVATED'
    if score >= 30: return 'MEDIUM'
    return 'LOW'

@router.get("/hotspots")
async def get_heatmap(
    days: int = Query(30, ge=1, le=365),
    crime_type: str = Query(None),
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if crime_type:
        incidents = await fetch_all(db, """
            SELECT id, lat, lon, severity, crime_type, timestamp, ward
            FROM incidents
            WHERE timestamp > NOW() - CAST($1 || ' days' AS INTERVAL)
            AND crime_type = $2
            AND status = 'active'
        """, [str(days), crime_type])
    else:
        incidents = await fetch_all(db, """
            SELECT id, lat, lon, severity, crime_type, timestamp, ward
            FROM incidents
            WHERE timestamp > NOW() - CAST($1 || ' days' AS INTERVAL)
            AND status = 'active'
        """, [str(days)])

    if not incidents:
        return {"heatmap": [], "clusters": [], "total": 0}

    df = pd.DataFrame(incidents)
    try:
        heatmap  = compute_kde_heatmap(df)
        clusters = run_dbscan_clustering(df)
    except Exception as e:
        logger.error("Failed to compute heatmap or clusters", error=str(e))
        heatmap = []
        clusters = []

    return {
        "heatmap":  heatmap,
        "clusters": clusters,
        "total":    len(incidents),
        "period_days": days,
    }

@router.get("/wards")
async def get_ward_risk(
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    now   = datetime.utcnow()
    hour  = now.hour
    dow   = now.weekday()
    month = now.month

    scores = await fetch_all(db, """
        SELECT ward, risk_score, festival_flag
        FROM zone_risk_scores
        WHERE hour_slot = $1 AND day_of_week = $2
        ORDER BY risk_score DESC
    """, [hour, dow])

    if not scores:
        predictor = RiskPredictor()
        
        # Load all incidents for historical training
        all_incidents = await fetch_all(db, """
            SELECT id, lat, lon, severity, crime_type, timestamp, ward
            FROM incidents
        """)
        if all_incidents:
            df = pd.DataFrame(all_incidents)
            predictor.train(df)

        wards_data = await fetch_all(db,
            "SELECT DISTINCT ward FROM incidents WHERE ward IS NOT NULL AND ward != ''",
            []
        )

        scores = []
        for w in wards_data:
            ward = w['ward']
            score = predictor.predict_zone_risk(ward, hour, dow, month)
            scores.append({
                'ward':        ward,
                'risk_score':  score,
                'festival_flag': False,
            })

    return {
        row['ward']: {
            'risk_score':   round(row['risk_score'], 1),
            'level':        risk_level(row['risk_score']),
            'festival_flag': row.get('festival_flag', False),
        }
        for row in scores if row.get('ward')
    }

@router.get("/incidents")
async def get_incidents(
    lat_min: float = Query(22.9),
    lat_max: float = Query(23.2),
    lon_min: float = Query(72.4),
    lon_max: float = Query(72.7),
    hours:   int   = Query(72),
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    incidents = await fetch_all(db, """
        SELECT id, crime_type, crime_code, lat, lon,
               timestamp, severity, ward, source,
               case_id
        FROM incidents
        WHERE lat BETWEEN $1 AND $2
          AND lon BETWEEN $3 AND $4
          AND timestamp > NOW() - CAST($5 || ' hours' AS INTERVAL)
          AND status = 'active'
        ORDER BY timestamp DESC
        LIMIT 500
    """, [lat_min, lat_max, lon_min, lon_max, str(hours)])

    # Format timestamps
    for inc in incidents:
        if inc.get('timestamp'):
            inc['timestamp'] = inc['timestamp'].isoformat()

    return incidents

@router.get("/alerts")
async def get_active_alerts(
    limit: int = Query(10, le=50),
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    alerts = await fetch_all(db, """
        SELECT ca.id, ca.camera_id, ca.camera_name, ca.source, ca.alert_type,
               ca.confidence, ca.person_count, ca.lat, ca.lon,
               ca.plate_no, ca.ts,
               c.fir_no as matched_fir
        FROM cctv_alerts ca
        LEFT JOIN cases c ON ca.matched_case = c.case_id
        WHERE ca.ts > NOW() - INTERVAL '24 hours'
        ORDER BY ca.ts DESC
        LIMIT $1
    """, [limit])

    for a in alerts:
        if a.get('ts'):
            a['ts'] = a['ts'].isoformat()

    return alerts

@router.get("/cybercrime")
async def get_cybercrime_layer(
    days: int = Query(30),
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    cyber = await fetch_all(db, """
        SELECT lat, lon, ward, crime_type,
               COUNT(*) as count,
               MAX(timestamp) as latest
        FROM incidents
        WHERE source = 'cyber'
          AND timestamp > NOW() - CAST($1 || ' days' AS INTERVAL)
        GROUP BY lat, lon, ward, crime_type
        HAVING COUNT(*) >= 2
        ORDER BY count DESC
    """, [str(days)])

    for c in cyber:
        if c.get('latest'):
            c['latest'] = c['latest'].isoformat()

    return cyber
