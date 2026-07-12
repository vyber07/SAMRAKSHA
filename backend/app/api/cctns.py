# backend/app/api/cctns.py

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
import uuid
from typing import Optional

router = APIRouter()

class CCTNSSyncRequest(BaseModel):
    fir_no: str
    crime_type: str
    victim_name: Optional[str] = None
    accused_name: Optional[str] = None
    state: str = "Gujarat"
    district: str = "Ahmedabad City"

def verify_cctns_token(x_api_key: str = Header(None)):
    if not x_api_key or x_api_key != "mock_cctns_api_key_2026":
        raise HTTPException(status_code=401, detail="Invalid CCTNS API Key")
    return True

@router.post("/sync")
async def sync_to_cctns(
    body: CCTNSSyncRequest,
    is_valid: bool = Depends(verify_cctns_token)
):
    """
    Mock endpoint to simulate syncing an FIR to the national CCTNS/BharatPol database.
    """
    # Simulate processing delay
    cctns_id = f"CCTNS-GJ-{str(uuid.uuid4())[:8].upper()}"
    return {
        "status": "success",
        "cctns_id": cctns_id,
        "message": f"FIR {body.fir_no} successfully synced to BharatPol national registry."
    }

@router.get("/search")
async def search_cctns(
    query: str,
    is_valid: bool = Depends(verify_cctns_token)
):
    """
    Mock endpoint to simulate searching the national CCTNS/BharatPol database.
    """
    return {
        "status": "success",
        "results": [
            {
                "cctns_id": "CCTNS-MH-12345",
                "state": "Maharashtra",
                "crime_type": query,
                "status": "Under Investigation"
            }
        ]
    }
