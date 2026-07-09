from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import structlog
from datetime import datetime

from app.db.connection import get_db, fetch_one, fetch_all
from app.api.auth import get_current_officer

router = APIRouter()
logger = structlog.get_logger()

@router.get("/summary")
async def get_dashboard_summary(
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    firs_today = await fetch_one(db, """
        SELECT COUNT(*) as count FROM cases
        WHERE created_at >= CURRENT_DATE
    """)

    firs_yesterday = await fetch_one(db, """
        SELECT COUNT(*) as count FROM cases
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
          AND created_at < CURRENT_DATE
    """)

    today_count     = firs_today['count'] if firs_today else 0
    yesterday_count = firs_yesterday['count'] if firs_yesterday else 0
    change_pct = 0
    if yesterday_count > 0:
        change_pct = round((today_count - yesterday_count) / yesterday_count * 100)

    active_alerts = await fetch_one(db, """
        SELECT COUNT(*) as count FROM cctv_alerts
        WHERE ts > NOW() - INTERVAL '2 hours'
    """)

    patrol_active = await fetch_one(db, """
        SELECT COUNT(*) as count FROM patrol_units
        WHERE status IN ('available','deployed','responding')
    """)

    high_risk = await fetch_one(db, """
        SELECT COUNT(DISTINCT ward) as count
        FROM zone_risk_scores
        WHERE risk_score >= 80
          AND hour_slot = EXTRACT(HOUR FROM NOW())::INTEGER
    """)

    # Fallback if zone_risk_scores is empty
    high_risk_count = high_risk['count'] if (high_risk and high_risk['count'] > 0) else 0
    if high_risk_count == 0:
        # Fallback to checking active hotspots
        hotspots = await fetch_one(db, """
            SELECT COUNT(DISTINCT ward) as count FROM incidents 
            WHERE timestamp > NOW() - INTERVAL '7 days' AND severity >= 4
        """)
        high_risk_count = hotspots['count'] if hotspots else 1

    return {
        "firs_today":         today_count,
        "firs_today_change":  change_pct,
        "active_alerts":      active_alerts['count'] if active_alerts else 0,
        "patrol_active":      patrol_active['count'] if patrol_active else 0,
        "high_risk_zones":    high_risk_count,
    }

@router.get("/trends")
async def get_trends(
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    hourly = await fetch_all(db, """
        SELECT EXTRACT(HOUR FROM timestamp)::INTEGER as hour,
               COUNT(*) as count
        FROM incidents
        WHERE timestamp > NOW() - INTERVAL '90 days'
        GROUP BY hour ORDER BY hour
    """)

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
    """)

    by_type = await fetch_all(db, """
        SELECT crime_type as type, COUNT(*) as count
        FROM incidents
        WHERE timestamp > NOW() - INTERVAL '90 days'
        GROUP BY crime_type
        ORDER BY count DESC
        LIMIT 8
    """)

    monthly = await fetch_all(db, """
        SELECT TO_CHAR(DATE_TRUNC('month', timestamp), 'Mon YY') as month,
               COUNT(*) as count
        FROM incidents
        WHERE timestamp > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', timestamp)
        ORDER BY DATE_TRUNC('month', timestamp)
    """)

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
    officer = Depends(get_current_officer)
):
    if officer['role'] not in ('sho', 'dcp', 'admin'):
        raise HTTPException(403, "Access denied")

    from app.services.prediction import FESTIVAL_CALENDAR

    festival = FESTIVAL_CALENDAR.get(body.event)
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

        base_risk = float(base['base_risk']) if (base and base['base_risk'] is not None) else 30.0

        crowd_factor = min(body.crowd_size / 50000.0, 4.0)
        sim_risk = min(base_risk * crowd_factor, 100.0)

        # find likely crime from festival key
        likely_crime = "theft"
        max_multiplier = 0.0
        for k, v in festival.items():
            if isinstance(v, (int, float)) and v > max_multiplier:
                max_multiplier = v
                likely_crime = k

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
