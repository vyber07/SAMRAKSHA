from app.db.connection import get_db, fetch_one, fetch_all, execute
from app.api.auth import get_current_officer

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import structlog

from app.api import auth

router = APIRouter()
logger = structlog.get_logger()

@router.get("/summary")
async def get_dashboard_summary(
    db = Depends(get_db),
    officer = Depends(auth.require_permission('analytics_view'))
):
    firs_today = await fetch_one(db, """
        SELECT COUNT(*) as count FROM cases
        WHERE created_at >= CURRENT_DATE
    """, [])

    firs_yesterday = await fetch_one(db, """
        SELECT COUNT(*) as count FROM cases
        WHERE created_at >= NOW() - INTERVAL '2 days'
          AND created_at < NOW() - INTERVAL '1 day'
    """, [])

    today_count     = firs_today['count']
    yesterday_count = firs_yesterday['count']
    change_pct = 0
    if yesterday_count > 0:
        change_pct = round(
            (today_count - yesterday_count) / yesterday_count * 100
        )

    active_alerts = await fetch_one(db, """
        SELECT COUNT(*) as count FROM cctv_alerts
        WHERE ts > NOW() - INTERVAL '2 hours'
    """, [])

    patrol_active = await fetch_one(db, """
        SELECT COUNT(*) as count FROM patrol_units
        WHERE status IN ('available','deployed','responding')
    """, [])

    high_risk = await fetch_one(db, """
        SELECT COUNT(DISTINCT ward) as count
        FROM zone_risk_scores
        WHERE risk_score >= 80
          AND hour_slot = EXTRACT(HOUR FROM NOW())::INTEGER
    """, [])

    return {
        "firs_today":         today_count,
        "firs_today_change":  change_pct,
        "active_alerts":      active_alerts['count'],
        "patrol_active":      patrol_active['count'],
        "high_risk_zones":    high_risk['count'],
    }

@router.get("/trends")
async def get_trends(
    db = Depends(get_db),
    officer = Depends(auth.require_permission('analytics_view'))
):

    hourly = await fetch_all(db, """
        SELECT EXTRACT(HOUR FROM timestamp)::INTEGER as hour,
               COUNT(*) as count
        FROM incidents
        WHERE timestamp > NOW() - INTERVAL '90 days'
        GROUP BY hour ORDER BY hour
    """, [])

    weekly = await fetch_all(db, """
        SELECT
            CASE EXTRACT(DOW FROM timestamp)
                WHEN 0 THEN 'Sun' WHEN 1 THEN 'Mon'
                WHEN 2 THEN 'Tue' WHEN 3 THEN 'Wed'
                WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri'
                WHEN 6 THEN 'Sat'
            END as day,
            COUNT(*) as count
        FROM incidents
        WHERE timestamp > NOW() - INTERVAL '90 days'
        GROUP BY EXTRACT(DOW FROM timestamp), day
        ORDER BY EXTRACT(DOW FROM timestamp)
    """, [])

    by_type = await fetch_all(db, """
        SELECT crime_type as type, COUNT(*) as count
        FROM incidents
        WHERE timestamp > NOW() - INTERVAL '90 days'
        GROUP BY crime_type
        ORDER BY count DESC
        LIMIT 8
    """, [])

    monthly = await fetch_all(db, """
        SELECT TO_CHAR(DATE_TRUNC('month', timestamp), 'Mon YY') as month,
               COUNT(*) as count
        FROM incidents
        WHERE timestamp > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', timestamp)
        ORDER BY DATE_TRUNC('month', timestamp)
    """, [])

    return {
        "hourly":  hourly,
        "weekly":  weekly,
        "by_type": by_type,
        "monthly": monthly,
    }

class SimulateRequest(BaseModel):
    event:      str
    crowd_size: int = 50000

@router.post("/simulate")
async def simulate_event(
    body: SimulateRequest,
    db = Depends(get_db),
    officer = Depends(auth.require_permission('analytics_view'))
):

    from app.services.prediction import FESTIVAL_CALENDAR

    festival = FESTIVAL_CALENDAR.get(body.event) or FESTIVAL_CALENDAR.get(body.event.lower().replace(' ', '_'))
    if not festival:
        raise HTTPException(400, f"Unknown event: {body.event}")

    affected_wards = [
        'Jamalpur', 'Kalupur', 'Ambawadi',
        'Ellisbridge', 'Satellite', 'Maninagar'
    ]

    hotspots = []
    total_units = 0

    for ward in affected_wards:
        base = await fetch_one(db, """
            SELECT AVG(risk_score) as base_risk
            FROM zone_risk_scores
            WHERE ward = $1
        """, [ward])

        base_risk = float(base['base_risk'] or 30)

        crowd_factor = min(body.crowd_size / 50000, 4.0)
        sim_risk = min(base_risk * crowd_factor, 100)

        likely_crime = max(
            festival.items(),
            key=lambda x: x[1] if isinstance(x[1], (int,float)) else 0
        )[0]

        units = max(1, int(sim_risk / 20))
        total_units += units

        hotspots.append({
            'zone':         ward,
            'sim_risk':     round(sim_risk, 1),
            'units_needed': units,
            'likely_crime': likely_crime,
        })

    hotspots.sort(key=lambda x: x['sim_risk'], reverse=True)

    return {
        "event":                body.event,
        "crowd_size":           body.crowd_size,
        "total_units_needed":   total_units,
        "doc_templates_needed": len([h for h in hotspots if h['sim_risk'] > 50]),
        "hotspots":             hotspots,
    }
@router.get("/resource_status")
async def get_resource_status(
    db = Depends(get_db),
    officer = Depends(auth.require_permission('analytics_view'))
):
    units = await fetch_all(db, """
        SELECT status, COUNT(*) as count 
        FROM patrol_units 
        GROUP BY status
    """, [])
    
    total = sum([u['count'] for u in units if u['status'] != 'unavailable'])
    if total == 0:
        return {"engaged_pct": 0, "available_pct": 0, "breakdown": units}
    
    engaged = sum([u['count'] for u in units if u['status'] in ('deployed', 'responding')])
    available = sum([u['count'] for u in units if u['status'] == 'available'])
    
    return {
        "engaged_pct": round((engaged / total) * 100, 1),
        "available_pct": round((available / total) * 100, 1),
        "breakdown": units
    }

@router.get("/hotspot_surge")
async def get_hotspot_surge(
    db = Depends(get_db),
    officer = Depends(auth.require_permission('analytics_view'))
):
    surges = await fetch_all(db, """
        SELECT ward, hour_slot, risk_score
        FROM zone_risk_scores
        WHERE hour_slot >= EXTRACT(HOUR FROM NOW())::INTEGER
          AND hour_slot <= EXTRACT(HOUR FROM NOW())::INTEGER + 3
          AND risk_score >= 70
        ORDER BY risk_score DESC
        LIMIT 10
    """, [])
    return {"surges": surges}

@router.get("/pattern_matches")
async def get_pattern_matches(
    db = Depends(get_db),
    officer = Depends(auth.require_permission('analytics_view'))
):
    alerts = await fetch_all(db, """
        SELECT id, alert_type as type, 
               'Confidence: ' || confidence || ' ' || source as description,
               confidence, ts as timestamp
        FROM cctv_alerts
        ORDER BY ts DESC
        LIMIT 5
    """, [])
    
    return {"patterns": alerts}
