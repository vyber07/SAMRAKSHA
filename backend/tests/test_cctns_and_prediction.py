import pytest
import os
import uuid
from app.services.prediction import RiskPredictor

pytestmark = pytest.mark.asyncio

async def test_cctns_auth(async_client):
    # Test missing API key
    res_no_key = await async_client.get("/cctns/search?query=test")
    assert res_no_key.status_code == 401

    # Test invalid API key
    res_bad_key = await async_client.get("/cctns/search?query=test", headers={"x-api-key": "wrong_key"})
    assert res_bad_key.status_code == 401

    # Test valid API key
    valid_key = os.getenv("CCTNS_API_KEY", "cctns_secret_key_2026")
    res_valid = await async_client.get("/cctns/search?query=test", headers={"x-api-key": valid_key})
    assert res_valid.status_code == 200

async def test_cctns_sync_persists_to_db(async_client, db_session):
    valid_key = os.getenv("CCTNS_API_KEY", "cctns_secret_key_2026")
    unique_fir = f"CCTNS/TEST/{uuid.uuid4().hex[:6]}"
    
    payload = {
        "fir_no": unique_fir,
        "crime_type": "Robbery",
        "victim_name": "Test Victim",
        "accused_name": "Test Accused",
        "state": "Gujarat",
        "district": "Ahmedabad City"
    }

    res = await async_client.post("/cctns/sync", json=payload, headers={"x-api-key": valid_key})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["fir_no"] == unique_fir
    assert data["persisted_to_db"] is True
    assert "cctns_id" in data

    # Verify record persisted to cases table in DB
    from app.db.connection import fetch_one
    case_row = await fetch_one(db_session, "SELECT * FROM cases WHERE fir_no = $1", [unique_fir])
    assert case_row is not None
    assert case_row["crime_type"] == "Robbery"
    assert case_row["victim_name"] == "Test Victim"

    # Verify record persisted to case_diary table in DB
    diary_row = await fetch_one(db_session, "SELECT * FROM case_diary WHERE case_id = CAST($1 AS UUID)", [str(case_row["case_id"])])
    assert diary_row is not None
    assert "BharatPol registry" in diary_row["description"]

async def test_cctns_search_db_lookup(async_client, db_session):
    valid_key = os.getenv("CCTNS_API_KEY", "cctns_secret_key_2026")
    search_term = f"UniqueSearchQuery_{uuid.uuid4().hex[:6]}"
    unique_fir = f"CCTNS/SEARCH/{uuid.uuid4().hex[:6]}"

    payload = {
        "fir_no": unique_fir,
        "crime_type": search_term,
        "victim_name": "Search Victim",
        "accused_name": "Search Accused",
        "state": "Gujarat",
        "district": "Ahmedabad City"
    }

    # Sync a new case
    sync_res = await async_client.post("/cctns/sync", json=payload, headers={"x-api-key": valid_key})
    assert sync_res.status_code == 200

    # Search for the created case
    search_res = await async_client.get(f"/cctns/search?query={search_term}", headers={"x-api-key": valid_key})
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["status"] == "success"
    assert len(search_data["results"]) >= 1

    matched = [r for r in search_data["results"] if r.get("fir_no") == unique_fir]
    assert len(matched) == 1
    assert matched[0]["crime_type"] == search_term
    assert matched[0]["victim_name"] == "Search Victim"
    # Ensure zero hardcoded fake CCTNS-MH-12345 search results
    assert not any(r["cctns_id"] == "CCTNS-MH-12345" for r in search_data["results"])

async def test_risk_predictor_deterministic_sparse_db(db_session):
    predictor = RiskPredictor()
    score1 = await predictor.predict_zone_risk("Navrangpura", hour=23, dow=5, month=10, db=db_session)
    assert 0.0 <= score1 <= 100.0

    # Test determinism: same parameters must yield identical score
    predictor2 = RiskPredictor()
    score2 = await predictor2.predict_zone_risk("Navrangpura", hour=23, dow=5, month=10, db=db_session)
    assert score1 == score2

async def test_risk_predictor_historical_incidents(db_session):
    from app.db.connection import execute
    ward_name = f"TestWard_{uuid.uuid4().hex[:4]}"
    
    # Insert > 10 incidents to test historical DB aggregation training branch
    for i in range(12):
        await execute(db_session, """
            INSERT INTO incidents (source, lat, lon, severity, ward, timestamp, status)
            VALUES ('fir', 23.0, 72.5, $1, $2, NOW(), 'active')
        """, [(i % 5) + 1, ward_name])

    predictor = RiskPredictor()
    score = await predictor.predict_zone_risk(ward_name, hour=14, dow=2, month=6, db=db_session)
    assert 0.0 <= score <= 100.0
    assert predictor._is_trained is True
