from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
import uuid
import structlog
import json

from app.db.connection import get_db, fetch_one, fetch_all, execute
from app.api.auth import get_current_officer

router = APIRouter()
logger = structlog.get_logger()

# Helper endpoints for FIR numbering
async def get_ps_code(db, ps_id: str) -> str:
    ps = await fetch_one(db, "SELECT name FROM police_stations WHERE id = $1", [ps_id])
    if not ps:
        return "GEN"
    # Take first 3 letters uppercase
    name = ps['name'].upper().replace("POLICE STATION", "").strip()
    return name[:3]

async def next_fir_number(db, ps_id: str, year: int) -> int:
    """Atomic FIR sequence — uses fir_sequences table with row-level lock."""
    result = await fetch_one(db, "SELECT next_fir_number($1, $2) AS seq", [ps_id, year])
    return result['seq']

async def get_ps_name(db, ps_id: str) -> str:
    ps = await fetch_one(db, "SELECT name FROM police_stations WHERE id = $1", [ps_id])
    return ps['name'] if ps else "Unknown Station"

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

    # Manual section overrides from officer — if provided, use instead of AI suggestion
    bns_sections:   Optional[List[str]] = None
    bnss_sections:  Optional[List[str]] = None
    bsa_sections:   Optional[List[str]] = None
    ipc_crossref:   Optional[List[str]] = None
    other_sections: Optional[List[str]] = None

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

class CaseUpdate(BaseModel):
    case_status: Optional[str] = None
    evidence_items: Optional[List[dict]] = None
    witnesses: Optional[List[dict]] = None
    accused_name: Optional[str] = None
    accused_address: Optional[str] = None
    accused_age: Optional[int] = None
    arrest_date: Optional[datetime] = None

@router.get("")
async def list_cases(
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")
    
    if officer['role'] in ('io', 'sho'):
        cases = await fetch_all(db, """
            SELECT c.*, ps.name as ps_name FROM cases c
            LEFT JOIN police_stations ps ON c.ps_id = ps.id
            WHERE c.ps_id = $1 ORDER BY c.created_at DESC
        """, [str(officer['ps_id'])])
    else:
        cases = await fetch_all(db, """
            SELECT c.*, ps.name as ps_name FROM cases c
            LEFT JOIN police_stations ps ON c.ps_id = ps.id
            ORDER BY c.created_at DESC
        """)
    return cases

@router.post("/create")
async def create_fir(
    body: FIRCreateRequest,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Constables cannot create FIRs")

    year = body.crime_date.year
    ps_id = str(officer['ps_id'])
    ps_code = await get_ps_code(db, ps_id)
    seq = await next_fir_number(db, ps_id, year)
    fir_no = f"{ps_code}/{year}/{str(seq).zfill(4)}"

    from app.services.legal_intel import suggest_sections, get_ipc_crossref
    ai_sections = suggest_sections(body.crime_narrative)
    ai_crossref  = get_ipc_crossref(ai_sections)

    # Use officer-edited sections if provided, otherwise use AI suggestions
    final_bns   = body.bns_sections   if body.bns_sections   is not None else ai_sections.get('bns', [])
    final_bnss  = body.bnss_sections  if body.bnss_sections  is not None else ai_sections.get('bnss', [])
    final_bsa   = body.bsa_sections   if body.bsa_sections   is not None else ai_sections.get('bsa', [])
    final_ipc   = body.ipc_crossref   if body.ipc_crossref   is not None else ai_crossref
    sections    = ai_sections  # keep for return value

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
                bns_sections, bnss_sections, bsa_sections, ipc_crossref
            ) VALUES (
                $1,$2,$3,$4,
                $5,$6,$7,
                $8,$9,$10,
                $11,$12,$13,
                $14,$15,$16,
                $17,$18,
                $19,$20,
                ST_MakePoint($20,$19)::GEOGRAPHY,
                $21,$22,$23,$24
            )
        """, [
            case_id, fir_no, ps_id, str(officer['id']),
            body.victim_name, body.victim_address, body.victim_phone,
            body.victim_age, body.victim_gender, body.victim_injury,
            body.accused_name, body.accused_address, body.accused_age,
            body.crime_type, body.crime_code, body.crime_narrative,
            body.crime_date, body.crime_location,
            body.crime_lat, body.crime_lon,
            final_bns, final_bnss, final_bsa, final_ipc
        ])

        # Log incident
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

        ps_name = await get_ps_name(db, ps_id)
        # Log diary
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

        # Log audit
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

    # Broadcast live updates
    try:
        from app.api.websocket import manager
        await manager.broadcast({
            'type':      'NEW_FIR',
            'case_id':   case_id,
            'fir_no':    fir_no,
            'ward':      body.ward,
            'crime_type': body.crime_type,
            'lat':        body.crime_lat,
            'lon':        body.crime_lon,
            'case_status': 'open',
            'crime_date': body.crime_date.isoformat(),
        })
    except Exception as ws_err:
        logger.warning("Failed to broadcast WebSocket update", error=str(ws_err))

    return {
        "case_id":          case_id,
        "fir_no":           fir_no,
        "suggested_sections": sections,
    }

@router.get("/search")
async def search_cases(
    q: str,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    if officer['role'] in ('io', 'sho'):
        where = "AND c.ps_id = $2"
        params = [q, str(officer['ps_id'])]
    else:
        where = ""
        params = [q]

    results = await fetch_all(db, f"""
        SELECT c.case_id, c.fir_no, c.victim_name, c.accused_name,
               c.crime_type, c.crime_date, c.case_status, c.ward, ps.name as ps_name
        FROM cases c
        LEFT JOIN police_stations ps ON c.ps_id = ps.id
        WHERE (c.fir_no ILIKE '%' || $1 || '%'
           OR c.victim_name ILIKE '%' || $1 || '%'
           OR c.accused_name ILIKE '%' || $1 || '%'
           OR c.crime_narrative ILIKE '%' || $1 || '%')
        {where}
        ORDER BY c.crime_date DESC
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
        "SELECT c.*, ps.name as ps_name FROM cases c "
        "LEFT JOIN police_stations ps ON c.ps_id = ps.id "
        "WHERE c.case_id = $1",
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

    return case

@router.patch("/{case_id}")
async def update_case(
    case_id: str,
    body: CaseUpdate,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    old_case = await fetch_one(db, "SELECT * FROM cases WHERE case_id = $1", [case_id])
    if not old_case:
        raise HTTPException(404, "Case not found")

    if officer['role'] == 'io' and str(old_case['ps_id']) != str(officer['ps_id']):
        raise HTTPException(403, "Access denied")

    updates = []
    params = []
    idx = 1

    fields = ['case_status', 'evidence_items', 'witnesses', 'accused_name', 'accused_address', 'accused_age', 'arrest_date']
    
    for f in fields:
        val = getattr(body, f)
        if val is not None:
            old_val = old_case[f]
            if f in ('evidence_items', 'witnesses'):
                new_str = json.dumps(val)
                old_str = json.dumps(old_val) if old_val else '[]'
            else:
                new_str = str(val)
                old_str = str(old_val) if old_val is not None else ''

            if new_str != old_str:
                if f in ('evidence_items', 'witnesses'):
                    updates.append(f"{f} = ${idx}")
                    params.append(val) # jsonb parameter
                else:
                    updates.append(f"{f} = ${idx}")
                    params.append(val)
                idx += 1

                # Audit
                await execute(db, """
                    INSERT INTO case_audit (case_id, officer_id, action, field_name, old_value, new_value)
                    VALUES ($1, $2, 'update', $3, $4, $5)
                """, [case_id, str(officer['id']), f, old_str, new_str])

                # Timeline logging
                if f == 'case_status' and val == 'arrested':
                    await execute(db, """
                        INSERT INTO case_diary (case_id, entry_type, description, officer_id, auto_generated)
                        VALUES ($1, 'arrest', $2, $3, TRUE)
                    """, [case_id, f"Accused {old_case['accused_name'] or body.accused_name or 'Accused'} marked as arrested", str(officer['id'])])

                if f == 'evidence_items':
                    await execute(db, """
                        INSERT INTO case_diary (case_id, entry_type, description, officer_id, auto_generated)
                        VALUES ($1, 'seizure', $2, $3, TRUE)
                    """, [case_id, f"Evidence locker updated (count: {len(val)})", str(officer['id'])])

    if updates:
        params.append(case_id)
        query = f"UPDATE cases SET {', '.join(updates)}, updated_at = NOW() WHERE case_id = ${idx}"
        await execute(db, query, params)
        await db.commit()

    return {"status": "success"}

@router.get("/{case_id}/diary")
async def get_case_diary(
    case_id: str,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    entries = await fetch_all(db, """
        SELECT cd.*, o.name as officer_name FROM case_diary cd
        LEFT JOIN officers o ON cd.officer_id = o.id
        WHERE cd.case_id = $1
        ORDER BY cd.ts DESC
    """, [case_id])
    return entries

@router.post("/{case_id}/diary")
async def add_diary_note(
    case_id: str,
    body: dict,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    desc = body.get('description')
    entry_type = body.get('entry_type', 'note')
    location = body.get('location')

    result = await fetch_one(db, """
        INSERT INTO case_diary (case_id, entry_type, description, officer_id, location, auto_generated)
        VALUES ($1, $2, $3, $4, $5, FALSE)
        RETURNING id, ts
    """, [case_id, entry_type, desc, str(officer['id']), location])

    await db.commit()

    return {
        "id": result['id'],
        "case_id": case_id,
        "entry_type": entry_type,
        "description": desc,
        "officer_name": officer['name'],
        "location": location,
        "auto_generated": False,
        "ts": result['ts']
    }

@router.get("/{case_id}/audit")
async def get_case_audit(
    case_id: str,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] not in ('sho', 'dcp', 'admin'):
        raise HTTPException(403, "Access denied")

    audits = await fetch_all(db, """
        SELECT ca.*, o.name as officer_name, o.badge_no FROM case_audit ca
        LEFT JOIN officers o ON ca.officer_id = o.id
        WHERE ca.case_id = $1
        ORDER BY ca.changed_at DESC
    """, [case_id])
    return audits

create_fir_handler = APIRouter()
create_fir_handler.post("/create")(create_fir)
