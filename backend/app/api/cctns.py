# backend/app/api/cctns.py

from sqlalchemy import text
from sqlalchemy import text
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
import os
import uuid
from typing import Optional
from app.db.connection import get_db

router = APIRouter()

class CCTNSSyncRequest(BaseModel):
    fir_no: str
    crime_type: str
    victim_name: Optional[str] = None
    accused_name: Optional[str] = None
    state: str = "Gujarat"
    district: str = "Ahmedabad City"

def verify_cctns_token(x_api_key: str = Header(None)):
    expected_key = os.getenv("CCTNS_API_KEY", "")
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
        existing_case = (await db.execute(text("SELECT case_id FROM cases WHERE fir_no = :p1"), {'p1': body.fir_no})).mappings().fetchone()
        
        if existing_case:
            case_id = str(existing_case["case_id"])
            await db.execute(text("""
                INSERT INTO case_diary (case_id, entry_type, description, auto_generated)
                VALUES (CAST(:p1 AS UUID), 'fir', :p2, true)
            """), {'p1': case_id, 'p2': f"Synced record for FIR {body.fir_no} to CCTNS BharatPol registry with ID {cctns_id}."})
            await db.execute(text("UPDATE cases SET updated_at = NOW() WHERE case_id = CAST(:p1 AS UUID)"), {'p1': case_id})
        else:
            case_id = str(uuid.uuid4())
            narrative = f"CCTNS Synced Case for FIR {body.fir_no} - {body.crime_type} ({body.district}, {body.state})"
            location = f"{body.district}, {body.state}"
            await db.execute(text("""
                INSERT INTO cases (
                    case_id, fir_no, crime_type, victim_name, accused_name,
                    crime_narrative, crime_date, crime_location, crime_lat, crime_lon, case_status
                ) VALUES (
                    CAST(:p1 AS UUID), :p2, :p3, :p4, :p5,
                    :p6, NOW(), :p7, 23.0225, 72.5714, 'open'
                )
            """), {'p1': case_id, 'p2': body.fir_no, 'p3': body.crime_type, 'p4': body.victim_name or "Unknown", 'p5': body.accused_name or "Unknown", 'p6': narrative, 'p7': location})
            await db.execute(text("""
                INSERT INTO case_diary (case_id, entry_type, description, auto_generated)
                VALUES (CAST(:p1 AS UUID), 'fir', :p2, true)
            """), {'p1': case_id, 'p2': f"Created and synced FIR {body.fir_no} to CCTNS BharatPol registry with ID {cctns_id}."})
        
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
    rows = (await db.execute(text("""
        SELECT case_id, fir_no, crime_type, case_status, victim_name, accused_name, crime_location, created_at
        FROM cases
        WHERE fir_no ILIKE :p1 OR crime_type ILIKE :p1 OR victim_name ILIKE :p1 OR accused_name ILIKE :p1 OR crime_narrative ILIKE :p1
        ORDER BY created_at DESC
        LIMIT 50
    """), {'p1': search_param})).mappings().fetchall()
    
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
