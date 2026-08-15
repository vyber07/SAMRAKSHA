from sqlalchemy import text
from sqlalchemy import text
from app.db.connection import get_db
from app.api.auth import get_current_officer

from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta, timezone
import asyncio

router = APIRouter()

@router.get("/hotspots")
async def get_heatmap(
    days: int = Query(30, ge=1, le=365),
    crime_type: str = Query(None),
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if crime_type:
        incidents = (await db.execute(text("""
            SELECT lat, lon, severity, crime_type, timestamp
            FROM incidents
            WHERE timestamp > NOW() - (INTERVAL '1 day' * :p1)
            AND crime_type = :p2
            AND status = 'active'
        """), {'p1': days, 'p2': crime_type})).mappings().fetchall()
    else:
        incidents = (await db.execute(text("""
            SELECT lat, lon, severity, crime_type, timestamp
            FROM incidents
            WHERE timestamp > NOW() - (INTERVAL '1 day' * :p1)
            AND status = 'active'
        """), {'p1': days})).mappings().fetchall()

    if not incidents:
        return {"heatmap": [], "clusters": [], "total": 0}

    import pandas as pd
    from app.services.prediction import (
        compute_kde_heatmap,
        run_dbscan_clustering
    )

    df = pd.DataFrame(incidents)
    heatmap  = compute_kde_heatmap(df)
    clusters = run_dbscan_clustering(df)

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
    now   = datetime.now(timezone.utc)
    hour  = now.hour
    dow   = now.weekday()
    month = now.month

    scores = (await db.execute(text("""
        SELECT ward, risk_score, festival_flag
        FROM zone_risk_scores
        WHERE hour_slot = :p1 AND day_of_week = :p2
        ORDER BY risk_score DESC
    """), {'p1': hour, 'p2': dow})).mappings().fetchall()

    if not scores:
        from app.services.prediction import RiskPredictor
        predictor = RiskPredictor()

        wards = (await db.execute(text("SELECT DISTINCT ward FROM incidents WHERE ward IS NOT NULL"), {})).mappings().fetchall()

        scores = []
        for w in wards:
            if not w['ward']:
                continue
            score = await predictor.predict_zone_risk(
                w['ward'], hour, dow, month, db
            )
            scores.append({
                'ward':        w['ward'],
                'risk_score':  score,
                'festival_flag': False,
            })

    return {
        row['ward']: {
            'risk_score':   round(row['risk_score'], 1),
            'level':        risk_level(row['risk_score']),
            'festival_flag': row.get('festival_flag', False),
        }
        for row in scores
    }

def risk_level(score: float) -> str:
    if score >= 80: return 'HIGH'
    if score >= 60: return 'ELEVATED'
    if score >= 30: return 'MEDIUM'
    return 'LOW'

@router.get("/incidents")
async def get_incidents(
    lat_min: float = Query(22.5),
    lat_max: float = Query(23.5),
    lon_min: float = Query(72.0),
    lon_max: float = Query(73.2),
    hours:   int   = Query(72),
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    incidents = (await db.execute(text("""
        SELECT id, crime_type, crime_code, lat, lon,
               timestamp, severity, ward, source,
               case_id
        FROM incidents
        WHERE lat BETWEEN :p1 AND :p2
          AND lon BETWEEN :p3 AND :p4
          AND timestamp > NOW() - (INTERVAL '1 hour' * :p5)
          AND status = 'active'
        ORDER BY timestamp DESC
        LIMIT 500
    """), {'p1': lat_min, 'p2': lat_max, 'p3': lon_min, 'p4': lon_max, 'p5': hours})).mappings().fetchall()

    return incidents

@router.get("/alerts")
async def get_active_alerts(
    limit: int = Query(10, le=50),
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    alerts = (await db.execute(text("""
        SELECT ca.id, ca.camera_id, ca.source, ca.alert_type,
               ca.confidence, ca.person_count, ca.lat, ca.lon,
               ca.plate_no, ca.ts,
               c.fir_no as matched_fir
        FROM cctv_alerts ca
        LEFT JOIN cases c ON ca.matched_case = c.case_id
        WHERE ca.ts > NOW() - INTERVAL '24 hours'
        ORDER BY ca.ts DESC
        LIMIT :p1
    """), {'p1': limit})).mappings().fetchall()

    return alerts

@router.get("/cybercrime")
async def get_cybercrime_layer(
    days: int = Query(30),
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    cyber = (await db.execute(text("""
        SELECT lat, lon, ward, crime_type,
               COUNT(*) as count,
               MAX(timestamp) as latest
        FROM incidents
        WHERE source = 'cyber'
          AND timestamp > NOW() - (INTERVAL '1 day' * :p1)
        GROUP BY lat, lon, ward, crime_type
        HAVING COUNT(*) >= 2
        ORDER BY count DESC
    """), {'p1': days})).mappings().fetchall()

    return cyber