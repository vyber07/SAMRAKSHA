from app.db.connection import get_db, fetch_one, fetch_all, execute
from app.api import auth
from app.api.auth import get_current_officer

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import uuid, structlog

router = APIRouter()
logger = structlog.get_logger()

class FIRCreateRequest(BaseModel):
    victim_name:    str
    victim_address: str
    victim_phone:   Optional[str] = None
    victim_age:     Optional[int] = None
    victim_gender:  Optional[str] = None
    victim_injury:  bool = False

    crime_type:      str
    crime_code:      Optional[int] = None
    crime_narrative: str
    crime_date:      datetime
    crime_location:  str
    crime_lat:       float
    crime_lon:       float
    ward:            Optional[str] = None
    severity:        int = 3

    accused_name:    Optional[str] = None
    accused_address: Optional[str] = None
    accused_age:     Optional[int] = None

    language: str = 'en'

    @validator('severity')
    def severity_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Severity must be 1-5')
        return v

    @validator('crime_lat')
    def valid_lat(cls, v):
        if not 22.5 <= v <= 23.5:
            raise ValueError('Latitude out of Ahmedabad range')
        return v

    @validator('crime_lon')
    def valid_lon(cls, v):
        if not 72.0 <= v <= 73.2:
            raise ValueError('Longitude out of Ahmedabad range')
        return v

@router.post("/create")
async def create_fir(
    body: FIRCreateRequest,
    db = Depends(get_db),
    officer = Depends(auth.require_permission('case_create'))
):

    year    = body.crime_date.year
    fir_row = await fetch_one(db,
        "SELECT next_fir_number(CAST($1 AS UUID), CAST($2 AS INTEGER)) as fir_no",
        [str(officer['ps_id']), year]
    )
    fir_no = fir_row['fir_no'] if fir_row else None
    
    if not fir_no:
        raise HTTPException(500, "FIR number generation failed")

    from app.services.legal_intel import suggest_sections
    sections = suggest_sections(body.crime_narrative)

    case_id = str(uuid.uuid4())

    try:
        await execute(db, """
            INSERT INTO cases (
                case_id, fir_no, ps_id, io_id,
                victim_name, victim_address, victim_phone,
                victim_age, victim_gender, victim_injury,
                accused_name, accused_address, accused_age,
                crime_type, crime_code, crime_narrative,
                crime_date, crime_location,
                crime_lat, crime_lon,
                geoloc,
                bns_sections, bnss_sections, bsa_sections
            ) VALUES (
                $1,$2,$3,$4,
                $5,$6,$7,
                $8,$9,$10,
                $11,$12,$13,
                $14,$15,$16,
                $17,$18,
                $19,$20,
                ST_MakePoint($20,$19)::GEOGRAPHY,
                $21,$22,$23
            )
        """, [
            case_id, fir_no, str(officer['ps_id']), str(officer['id']),
            body.victim_name, body.victim_address, body.victim_phone,
            body.victim_age, body.victim_gender, body.victim_injury,
            body.accused_name, body.accused_address, body.accused_age,
            body.crime_type, body.crime_code, body.crime_narrative,
            body.crime_date, body.crime_location,
            body.crime_lat, body.crime_lon,
            sections.get('bns', []),
            sections.get('bnss', []),
            sections.get('bsa', [])
        ])

        await execute(db, """
            INSERT INTO incidents (
                case_id, source, crime_code, crime_type,
                lat, lon, geoloc, timestamp, severity, ward
            ) VALUES (
                $1,'fir',$2,$3,
                $4,$5,ST_MakePoint($5,$4)::GEOGRAPHY,
                $6,$7,$8
            )
        """, [
            case_id, body.crime_code, body.crime_type,
            body.crime_lat, body.crime_lon,
            body.crime_date, body.severity, body.ward
        ])

        ps_row = await fetch_one(db, "SELECT name FROM police_stations WHERE id = $1", [str(officer['ps_id'])])
        ps_name = ps_row['name'] if ps_row else "Unknown PS"

        await execute(db, """
            INSERT INTO case_diary (
                case_id, entry_type, description,
                officer_id, location, auto_generated
            ) VALUES ($1,'fir',$2,$3,$4,TRUE)
        """, [
            case_id,
            f"FIR registered at {ps_name}",
            str(officer['id']),
            body.crime_location
        ])

        await execute(db, """
            INSERT INTO case_audit (
                case_id, officer_id, action, field_name, new_value
            ) VALUES ($1,$2,'create','case','FIR registered')
        """, [case_id, str(officer['id'])])

        await db.commit()

    except Exception as e:
        await db.rollback()
        logger.error("FIR creation failed", error=str(e), case_id=case_id)
        raise HTTPException(500, "Failed to create FIR")

    from app.api.websocket import manager
    await manager.broadcast({
        'type':      'NEW_FIR',
        'case_id':   case_id,
        'fir_no':    fir_no,
        'ward':      body.ward,
        'crime_type': body.crime_type,
        'lat':        body.crime_lat,
        'lon':        body.crime_lon,
    })

    return {
        "case_id":          case_id,
        "fir_no":           fir_no,
        "suggested_sections": sections,
    }

@router.get("")
async def list_cases(
    page: int = 1,
    limit: int = 20,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    offset = max(0, (page - 1) * limit)
    limit = min(limit, 100)

    if officer['role'] in ('io', 'sho'):
        results = await fetch_all(db, """
            SELECT case_id, fir_no, victim_name, accused_name,
                   crime_type, crime_date, case_status,
                   created_at, updated_at
            FROM cases
            WHERE ps_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        """, [str(officer['ps_id']), limit, offset])
    else:
        results = await fetch_all(db, """
            SELECT case_id, fir_no, victim_name, accused_name,
                   crime_type, crime_date, case_status,
                   created_at, updated_at
            FROM cases
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
        """, [limit, offset])

    return {"items": results, "page": page, "limit": limit}

@router.get("/search")
async def search_cases(
    q: str,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    if officer['role'] in ('io', 'sho'):
        where = "AND ps_id = $2"
        params = [q, str(officer['ps_id'])]
    else:
        where = ""
        params = [q]

    results = await fetch_all(db, f"""
        SELECT case_id, fir_no, victim_name, accused_name,
               crime_type, crime_date, case_status,
               ts_rank(search_vector, plainto_tsquery($1)) AS rank
        FROM cases
        WHERE search_vector @@ plainto_tsquery($1)
        {where}
        ORDER BY rank DESC
        LIMIT 20
    """, params)

    return results

@router.get("/{case_id}")
async def get_case(
    case_id: str,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    case = await fetch_one(db,
        "SELECT * FROM cases WHERE case_id = $1",
        [case_id]
    )

    if not case:
        raise HTTPException(404, "Case not found")

    if officer['role'] == 'io' and \
       str(case['ps_id']) != str(officer['ps_id']):
        raise HTTPException(403, "Access denied")

    await execute(db, """
        INSERT INTO case_audit
        (case_id, officer_id, action)
        VALUES ($1,$2,'view')
    """, [case_id, str(officer['id'])])
    await db.commit()

    io = await fetch_one(db,
        "SELECT name, badge_no FROM officers WHERE id = $1",
        [str(case['io_id'])]
    )
    diary = await fetch_all(db, """
        SELECT entry_type, description, ts, auto_generated
        FROM case_diary WHERE case_id = $1
        ORDER BY ts DESC LIMIT 20
    """, [case_id])

    case['io_name'] = io['name'] if io else 'Unknown'
    case['io_badge'] = io['badge_no'] if io else ''
    case['diary_entries'] = diary

    return case