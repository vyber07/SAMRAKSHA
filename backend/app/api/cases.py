from sqlalchemy import text
from sqlalchemy import text
from app.db.connection import get_db
from app.api import auth
from app.api.auth import get_current_officer

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, field_validator
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

    @field_validator('severity')
    @classmethod
    def severity_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Severity must be 1-5')
        return v

    @field_validator('crime_lat')
    @classmethod
    def valid_lat(cls, v):
        if not 22.5 <= v <= 23.5:
            raise ValueError('Latitude out of Ahmedabad range')
        return v

    @field_validator('crime_lon')
    @classmethod
    def valid_lon(cls, v):
        if not 72.0 <= v <= 73.2:
            raise ValueError('Longitude out of Ahmedabad range')
        return v

@router.post("")
async def create_fir(
    request: Request,
    body: FIRCreateRequest,
    db = Depends(get_db),
    officer = Depends(auth.require_permission('case_create'))
):

    year    = body.crime_date.year
    ps_id_str = str(officer['ps_id']) if officer['ps_id'] else "e97fd0bc-bd71-40f3-a62c-5fc2b9d2f362"
    fir_row = (await db.execute(text("SELECT next_fir_number(CAST(:p1 AS UUID), CAST(:p2 AS INTEGER)) as fir_no"), {'p1': ps_id_str, 'p2': year})).mappings().fetchone()
    fir_no = fir_row['fir_no'] if fir_row else None
    
    if not fir_no:
        raise HTTPException(500, "FIR number generation failed")

    from app.services.legal_intel import suggest_sections
    sections = suggest_sections(body.crime_narrative)

    case_id = str(uuid.uuid4())

    try:
        await db.execute(text("""
            INSERT INTO cases (
                case_id, fir_no, ps_id, io_id,
                victim_name, victim_address, victim_phone,
                victim_age, victim_gender, victim_injury,
                accused_name, accused_address, accused_age,
                crime_type, crime_code, crime_narrative,
                crime_date, crime_location,
                crime_lat, crime_lon, ward,
                geoloc,
                bns_sections, bnss_sections, bsa_sections,
                search_vector
            ) VALUES (
                :p1, CAST(:p2 AS text), :p3, :p4,
                CAST(:p5 AS text), :p6, :p7,
                :p8, :p9, :p10,
                CAST(:p11 AS text), :p12, :p13,
                CAST(:p14 AS text), :p15, CAST(:p16 AS text),
                :p17, :p18,
                :p19, :p20, :p21,
                ST_MakePoint(:p20,:p19)::GEOGRAPHY,
                CAST(:p22 AS text[]), CAST(:p23 AS text[]), CAST(:p24 AS text[]),
                setweight(to_tsvector('english', coalesce(CAST(:p2 AS text), '')), 'A') ||
                setweight(to_tsvector('english', coalesce(CAST(:p14 AS text), '')), 'A') ||
                setweight(to_tsvector('english', coalesce(CAST(:p5 AS text), '')), 'B') ||
                setweight(to_tsvector('english', coalesce(CAST(:p11 AS text), '')), 'B') ||
                setweight(to_tsvector('english', coalesce(CAST(:p16 AS text), '')), 'C')
            )
        """), {'p1': case_id, 'p2': fir_no, 'p3': ps_id_str, 'p4': str(officer['id']), 'p5': body.victim_name, 'p6': body.victim_address, 'p7': body.victim_phone, 'p8': body.victim_age, 'p9': body.victim_gender, 'p10': body.victim_injury, 'p11': body.accused_name, 'p12': body.accused_address, 'p13': body.accused_age, 'p14': body.crime_type, 'p15': body.crime_code, 'p16': body.crime_narrative, 'p17': body.crime_date, 'p18': body.crime_location, 'p19': body.crime_lat, 'p20': body.crime_lon, 'p21': body.ward, 'p22': sections.get('bns', []), 'p23': sections.get('bnss', []), 'p24': sections.get('bsa', [])})

        await db.execute(text("""
            INSERT INTO incidents (
                case_id, source, crime_code, crime_type,
                lat, lon, geoloc, timestamp, severity, ward
            ) VALUES (
                :p1,'fir',:p2,:p3,
                :p4,:p5,ST_MakePoint(:p5,:p4)::GEOGRAPHY,
                :p6,:p7,:p8
            )
        """), {'p1': case_id, 'p2': body.crime_code, 'p3': body.crime_type, 'p4': body.crime_lat, 'p5': body.crime_lon, 'p6': body.crime_date, 'p7': body.severity, 'p8': body.ward})

        ps_row = (await db.execute(text("SELECT name FROM police_stations WHERE id = CAST(:p1 AS UUID)"), {'p1': ps_id_str})).mappings().fetchone()
        ps_name = ps_row['name'] if ps_row else "Unknown PS"

        await db.execute(text("""
            INSERT INTO case_diary (
                case_id, entry_type, description,
                officer_id, location, auto_generated
            ) VALUES (:p1,'fir',:p2,:p3,:p4,TRUE)
        """), {'p1': case_id, 'p2': f"FIR registered at {ps_name}", 'p3': str(officer['id']), 'p4': body.crime_location})

        await db.execute(text("""
            INSERT INTO case_audit (
                case_id, officer_id, action, field_name, new_value
            ) VALUES (:p1,:p2,'create','case','FIR registered')
        """), {'p1': case_id, 'p2': str(officer['id'])})

        from app.services.audit import log_activity
        try:
            await log_activity(db, str(officer['id']), "create_case", f"Officer {officer['badge_no']} registered FIR: {fir_no}", request.client.host)
        except Exception as e:
            logger.error("Audit log failed on create_fir", error=str(e))

        await db.commit()

    except Exception as e:
        await db.rollback()
        logger.error("FIR creation failed", error=str(e), case_id=case_id)
        raise HTTPException(500, "Failed to create FIR")

    from app.api.websocket import manager
    await manager.broadcast({
        'type':      'NEW_FIR',
        'payload': {
            'case_id':   case_id,
            'fir_no':    fir_no,
            'ward':      body.ward,
            'crime_type': body.crime_type,
            'lat':        body.crime_lat,
            'lon':        body.crime_lon,
        }
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

    diary_subquery = """
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'entry_type', cd.entry_type,
                    'description', cd.description,
                    'ts', cd.ts,
                    'location', cd.location
                ) ORDER BY cd.ts DESC
            )
            FROM case_diary cd
            WHERE cd.case_id = cases.case_id
        ) as diary_entries
    """

    if officer['role'] in ('io', 'sho'):
        results = (await db.execute(text(f"""
            SELECT cases.*, {diary_subquery}
            FROM cases
            WHERE ps_id = :p1
            ORDER BY created_at DESC
            LIMIT :p2 OFFSET :p3
        """), {'p1': str(officer['ps_id']), 'p2': limit, 'p3': offset})).mappings().fetchall()
        count_row = (await db.execute(text("SELECT COUNT(*) as count FROM cases WHERE ps_id = :p1"), {'p1': str(officer['ps_id'])})).mappings().fetchone()
    else:
        results = (await db.execute(text(f"""
            SELECT cases.*, {diary_subquery}
            FROM cases
            ORDER BY created_at DESC
            LIMIT :p1 OFFSET :p2
        """), {'p1': limit, 'p2': offset})).mappings().fetchall()
        count_row = (await db.execute(text("SELECT COUNT(*) as count FROM cases"), {})).mappings().fetchone()

    total_count = count_row['count'] if count_row else len(results)
    return {"items": results, "total": total_count, "page": page, "limit": limit}

@router.get("/search")
async def search_cases(
    q: str,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    if officer['role'] in ('io', 'sho'):
        where = "AND ps_id = CAST(:p2 AS UUID)"
        params = [q, str(officer['ps_id'])]
    else:
        where = ""
        params = [q]

    diary_subquery = """
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'entry_type', cd.entry_type,
                    'description', cd.description,
                    'ts', cd.ts,
                    'location', cd.location
                ) ORDER BY cd.ts DESC
            )
            FROM case_diary cd
            WHERE cd.case_id = cases.case_id
        ) as diary_entries
    """

    query = f"""
        SELECT cases.*, {diary_subquery},
               ts_rank(search_vector, plainto_tsquery('english', CAST(:p1 AS text))) AS rank
        FROM cases
        WHERE search_vector @@ plainto_tsquery('english', CAST(:p1 AS text))
        {where}
        ORDER BY rank DESC, created_at DESC
        LIMIT 20
    """
    results = (await db.execute(text(query), {f'p{i+1}': v for i, v in enumerate(params)})).mappings().fetchall()

    return results

@router.get("/{case_id}")
async def get_case(
    request: Request,
    case_id: str,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    case = (await db.execute(text("SELECT * FROM cases WHERE case_id = :p1"), {'p1': case_id})).mappings().fetchone()

    if not case:
        raise HTTPException(404, "Case not found")

    if officer['role'] in ('io', 'sho') and \
       str(case['ps_id']) != str(officer['ps_id']):
        raise HTTPException(403, "Access denied")

    await db.execute(text("""
        INSERT INTO case_audit
        (case_id, officer_id, action)
        VALUES (:p1,:p2,'view')
    """), {'p1': case_id, 'p2': str(officer['id'])})

    from app.services.audit import log_activity
    try:
        await log_activity(db, str(officer['id']), "view_case", f"Officer {officer['badge_no']} accessed case details for case: {case_id}", request.client.host)
    except Exception as e:
        logger.error("Audit log failed on view_case", error=str(e))

    await db.commit()

    io = None
    if case.get('io_id'):
        io = (await db.execute(text("SELECT name, badge_no FROM officers WHERE id = :p1"), {'p1': str(case['io_id'])})).mappings().fetchone()
    diary = (await db.execute(text("""
        SELECT entry_type, description, ts, auto_generated
        FROM case_diary WHERE case_id = :p1
        ORDER BY ts DESC LIMIT 20
    """), {'p1': case_id})).mappings().fetchall()

    case_dict = dict(case)
    case_dict['io_name'] = io['name'] if io else 'Unknown'
    case_dict['io_badge'] = io['badge_no'] if io else ''
    case_dict['diary_entries'] = [dict(d) for d in diary]

    return case_dict


class CaseStatusUpdate(BaseModel):
    status: str

@router.patch("/{case_id}/status")
async def update_case_status(case_id: str, body: CaseStatusUpdate, db = Depends(get_db), officer = Depends(get_current_officer)):
    if officer["role"] == "constable":
        raise HTTPException(403, "Access denied")
    if body.status not in ("open", "arrested", "chargesheeted", "closed"):
        raise HTTPException(422, "Invalid case status")
    case = (await db.execute(text("SELECT case_id, ps_id FROM cases WHERE case_id = :p1"), {'p1': case_id})).mappings().fetchone()
    if not case:
        raise HTTPException(404, "Case not found")
    if officer["role"] in ("io", "sho") and str(case["ps_id"]) != str(officer["ps_id"]):
        raise HTTPException(403, "Access denied")
    updated = (await db.execute(text("UPDATE cases SET case_status = :p1, updated_at = NOW() WHERE case_id = :p2 RETURNING case_id, fir_no, case_status, updated_at"), {'p1': body.status, 'p2': case_id})).mappings().fetchone()
    await db.commit()
    return updated or {"case_id": case_id, "case_status": body.status}

class CaseDiaryEntryRequest(BaseModel):
    entry_type: str
    description: str
    location: Optional[str] = None


@router.post("/{case_id}/diary")
async def add_case_diary_entry(
    case_id: str,
    body: CaseDiaryEntryRequest,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    case = (await db.execute(text("SELECT case_id, ps_id FROM cases WHERE case_id = :p1"), {'p1': case_id})).mappings().fetchone()
    if not case:
        raise HTTPException(404, "Case not found")

    if officer['role'] in ('io', 'sho') and str(case['ps_id']) != str(officer['ps_id']):
        raise HTTPException(403, "Access denied")

    entry = (await db.execute(text("""
        INSERT INTO case_diary (
            case_id, entry_type, description, officer_id, location, auto_generated
        ) VALUES (:p1, :p2, :p3, :p4, :p5, FALSE)
        RETURNING id, case_id, entry_type, description, location, ts, auto_generated
    """), {'p1': case_id, 'p2': body.entry_type, 'p3': body.description, 'p4': str(officer['id']), 'p5': body.location})).mappings().fetchone()
    await db.commit()

    if entry:
        return dict(entry)
    return {"id": None, "message": "Case diary entry failed", "case_id": case_id}