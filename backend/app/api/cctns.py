from fastapi import APIRouter, Header, HTTPException, Depends
import random

router = APIRouter()

MOCK_CCTNS_TOKENS = ["CCTNS_SECURE_TOKEN_2026_KANAD", "BHARATPOL_INTEL_TOKEN_XYZ"]

def verify_cctns_auth(authorization: str = Header(None), x_cctns_token: str = Header(None)):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif x_cctns_token:
        token = x_cctns_token
        
    if not token or token not in MOCK_CCTNS_TOKENS:
        raise HTTPException(status_code=401, detail="Unauthorized CCTNS/BharatPol token")
    return token

@router.get("/suspect")
def lookup_cctns_suspect(name: str, auth = Depends(verify_cctns_auth)):
    """Mock CCTNS national crime registry lookup"""
    # Sample synthetic records
    mock_records = [
        {
            "cctns_id": "CCTNS-2023-98231",
            "name": name,
            "father_name": "Ramanbhai Patel",
            "age": 34,
            "last_known_address": "Kalupur Metro Station Road, Ahmedabad",
            "previous_convictions": [
                {"year": 2023, "ipc_sections": ["379", "411"], "status": "convicted", "sentence": "6 months"},
                {"year": 2024, "bns_sections": ["303"], "status": "acquitted"}
            ],
            "risk_score": 78
        },
        {
            "cctns_id": "CCTNS-2024-00129",
            "name": f"{name} (Alias Raju)",
            "father_name": "Unknown",
            "age": 28,
            "last_known_address": "Gomtipur Slums, Ahmedabad",
            "previous_convictions": [
                {"year": 2024, "bns_sections": ["309", "115"], "status": "under_trial"}
            ],
            "risk_score": 62
        }
    ]
    
    # Return one random match or empty list
    if len(name.strip()) < 3:
        return []
    return random.choice([mock_records, [mock_records[0]], []])

@router.get("/vehicle")
def lookup_cctns_vehicle(plate_no: str, auth = Depends(verify_cctns_auth)):
    """Mock national vehicle database lookup"""
    plates_db = {
        "GJ01AB1234": {
            "owner": "Sureshbhai Shah",
            "model": "Suzuki Swift (Black)",
            "registration_year": 2021,
            "status": "active",
            "stolen_flag": True,
            "reported_date": "2026-07-01T10:00:00Z"
        },
        "GJ01XY9999": {
            "owner": "Rameshbhai Solanki",
            "model": "Honda Activa (White)",
            "registration_year": 2018,
            "status": "scrapped",
            "stolen_flag": False
        }
    }
    
    match = plates_db.get(plate_no.upper().replace(" ",""))
    if not match:
        # Generate random matching mock info
        return {
            "owner": f"Random Owner {random.randint(100,999)}",
            "model": "Splendor Motorcycle (Silver)",
            "registration_year": random.randint(2015, 2025),
            "status": "active",
            "stolen_flag": random.choice([True, False])
        }
    return match
