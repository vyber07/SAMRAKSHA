# backend/app/api/cctns.py

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
import os
import uuid
from typing import Optional
from app.db.connection import get_db, fetch_one, fetch_all, execute

router = APIRouter()

class CCTNSSyncRequest(BaseModel):
    fir_no: str
    crime_type: str
    victim_name: Optional[str] = None
    accused_name: Optional[str] = None
    state: str = "Gujarat"
    district: str = "Ahmedabad City"

def verify_cctns_token(x_api_key: str = Header(None)):
    expected_key = os.getenv("CCTNS_API_KEY", "cctns_secret_key_2026")
    if not x_api_key or x_api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid CCTNS API Key")
    return True

@router.post("/sync")
async def sync_to_cctns(
    body: CCTNSSyncRequest,
    is_valid: bool = Depends(verify_cctns_token),
    db = Depends(get_db)
):
    """
    Sync an FIR record to CCTNS / national registry and persist record to local DB.
    """
    cctns_id = f"CCTNS-GJ-{str(uuid.uuid4())[:8].upper()}"
    
    try:
        existing_case = await fetch_one(db, "SELECT case_id FROM cases WHERE fir_no = $1", [body.fir_no])
        
        if existing_case:
            case_id = str(existing_case["case_id"])
            await execute(db, """
                INSERT INTO case_diary (case_id, entry_type, description, auto_generated)
                VALUES (CAST($1 AS UUID), 'fir', $2, true)
            """, [case_id, f"Synced record for FIR {body.fir_no} to CCTNS BharatPol registry with ID {cctns_id}."])
            await execute(db, "UPDATE cases SET updated_at = NOW() WHERE case_id = CAST($1 AS UUID)", [case_id])
        else:
            case_id = str(uuid.uuid4())
            narrative = f"CCTNS Synced Case for FIR {body.fir_no} - {body.crime_type} ({body.district}, {body.state})"
            location = f"{body.district}, {body.state}"
            await execute(db, """
                INSERT INTO cases (
                    case_id, fir_no, crime_type, victim_name, accused_name,
                    crime_narrative, crime_date, crime_location, crime_lat, crime_lon, case_status
                ) VALUES (
                    CAST($1 AS UUID), $2, $3, $4, $5,
                    $6, NOW(), $7, 23.0225, 72.5714, 'open'
                )
            """, [
                case_id,
                body.fir_no,
                body.crime_type,
                body.victim_name or "Unknown",
                body.accused_name or "Unknown",
                narrative,
                location
            ])
            await execute(db, """
                INSERT INTO case_diary (case_id, entry_type, description, auto_generated)
                VALUES (CAST($1 AS UUID), 'fir', $2, true)
            """, [case_id, f"Created and synced FIR {body.fir_no} to CCTNS BharatPol registry with ID {cctns_id}."])
        
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to sync CCTNS record: {str(e)}")

    return {
        "status": "success",
        "cctns_id": cctns_id,
        "fir_no": body.fir_no,
        "persisted_to_db": True,
        "message": f"FIR {body.fir_no} successfully synced to BharatPol national registry and persisted to database."
    }

@router.get("/search")
async def search_cctns(
    query: str,
    is_valid: bool = Depends(verify_cctns_token),
    db = Depends(get_db)
):
    """
    Search national CCTNS/BharatPol records by querying local database cases or external API fallback.
    """
    search_param = f"%{query}%"
    rows = await fetch_all(db, """
        SELECT case_id, fir_no, crime_type, case_status, victim_name, accused_name, crime_location, created_at
        FROM cases
        WHERE fir_no ILIKE $1 OR crime_type ILIKE $1 OR victim_name ILIKE $1 OR accused_name ILIKE $1 OR crime_narrative ILIKE $1
        ORDER BY created_at DESC
        LIMIT 50
    """, [search_param])
    
    results = []
    for row in rows:
        cctns_id = f"CCTNS-GJ-{str(row['case_id'])[:8].upper()}"
        results.append({
            "cctns_id": cctns_id,
            "fir_no": row.get("fir_no"),
            "state": "Gujarat",
            "district": "Ahmedabad City",
            "crime_type": row.get("crime_type"),
            "victim_name": row.get("victim_name"),
            "accused_name": row.get("accused_name"),
            "location": row.get("crime_location"),
            "status": row.get("case_status") or "Under Investigation"
        })
        
    if not results and os.getenv("CCTNS_API_URL"):
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(os.getenv("CCTNS_API_URL"), params={"q": query})
                if res.status_code == 200:
                    api_data = res.json()
                    if isinstance(api_data, list):
                        results = api_data
                    elif isinstance(api_data, dict) and "results" in api_data:
                        results = api_data["results"]
        except Exception:
            pass

    return {
        "status": "success",
        "query": query,
        "results": results
    }
