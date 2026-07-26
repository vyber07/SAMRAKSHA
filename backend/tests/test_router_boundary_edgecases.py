import pytest
import uuid
from datetime import datetime, timezone

# ─── 1. AUTH MODULE ───────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_auth_valid_login(async_client):
    """Valid login returns 200 with JWT token."""
    res = await async_client.post("/auth/login", json={
        "badge_no": "ADMIN001",
        "password": "password123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

@pytest.mark.asyncio
async def test_auth_invalid_credentials_rejected_401(async_client):
    """Unauthenticated/invalid login attempt returns 401."""
    res = await async_client.post("/auth/login", json={
        "badge_no": "NON_EXISTENT_BADGE",
        "password": "wrong_password"
    })
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_auth_invalid_payload_rejected_422(async_client):
    """Empty or missing fields login payload returns 422 validation error."""
    res1 = await async_client.post("/auth/login", json={})
    assert res1.status_code == 422

    res2 = await async_client.post("/auth/login", json={"badge_no": "ADMIN001"})
    assert res2.status_code == 422

    res3 = await async_client.post("/auth/login", json={"badge_no": 12345, "password": True})
    assert res3.status_code == 422

@pytest.mark.asyncio
async def test_auth_logout_unauthenticated_rejected_401(async_client):
    """Logout without valid authorization header returns 401."""
    res = await async_client.post("/auth/logout")
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_auth_logout_authenticated_200(async_client, admin_headers):
    """Logout with valid authorization header returns 200."""
    res = await async_client.post("/auth/logout", headers=admin_headers)
    assert res.status_code == 200


# ─── 2. CASES MODULE ──────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_cases_create_valid_payload_200(async_client, io_headers):
    """Valid FIR creation returns 200."""
    payload = {
        "victim_name": "Anita Roy",
        "victim_address": "505 Navrangpura, Ahmedabad",
        "victim_phone": "9876500000",
        "victim_age": 30,
        "victim_gender": "female",
        "victim_injury": False,
        "crime_type": "theft",
        "crime_code": 303,
        "crime_narrative": "Wallet stolen near Navrangpura crossroads.",
        "crime_date": datetime.now(timezone.utc).isoformat(),
        "crime_location": "Navrangpura Crossroads",
        "crime_lat": 23.0300,
        "crime_lon": 72.5600,
        "ward": "Navrangpura",
        "severity": 3
    }
    res = await async_client.post("/cases/create", json=payload, headers=io_headers)
    assert res.status_code == 200
    assert "case_id" in res.json()

@pytest.mark.asyncio
async def test_cases_create_unauthenticated_rejected_401(async_client):
    """FIR creation without authentication header returns 401."""
    payload = {"victim_name": "Test", "crime_narrative": "Test"}
    res = await async_client.post("/cases/create", json=payload)
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_cases_create_invalid_payloads_rejected_422(async_client, io_headers):
    """FIR creation with empty, missing, or out-of-boundary parameters returns 422."""
    # 1. Empty body
    res1 = await async_client.post("/cases/create", json={}, headers=io_headers)
    assert res1.status_code == 422

    # 2. Missing mandatory victim_name
    res2 = await async_client.post("/cases/create", json={
        "victim_address": "Address",
        "crime_narrative": "Narrative"
    }, headers=io_headers)
    assert res2.status_code == 422

    # 3. Invalid latitude type / boundary
    res3 = await async_client.post("/cases/create", json={
        "victim_name": "Test",
        "victim_address": "Test",
        "crime_narrative": "Test",
        "crime_lat": "not_a_float",
        "crime_lon": 72.5714
    }, headers=io_headers)
    assert res3.status_code == 422

    # 4. Severity out of allowed boundary (must be 1..5)
    res4 = await async_client.post("/cases/create", json={
        "victim_name": "Test",
        "victim_address": "Test",
        "crime_narrative": "Test",
        "severity": 99
    }, headers=io_headers)
    assert res4.status_code == 422

@pytest.mark.asyncio
async def test_cases_list_authenticated_200_unauth_401(async_client, sho_headers):
    """Listing cases authenticated returns 200, unauthenticated returns 401."""
    res_unauth = await async_client.get("/cases")
    assert res_unauth.status_code == 401

    res_auth = await async_client.get("/cases?page=1&limit=10", headers=sho_headers)
    assert res_auth.status_code == 200

@pytest.mark.asyncio
async def test_cases_list_invalid_boundary_params_422(async_client, sho_headers):
    """Listing cases with invalid data types for page/limit returns 422."""
    res1 = await async_client.get("/cases?page=invalid_page&limit=10", headers=sho_headers)
    assert res1.status_code == 422

    res2 = await async_client.get("/cases?page=1&limit=invalid_limit", headers=sho_headers)
    assert res2.status_code == 422

@pytest.mark.asyncio
async def test_cases_search_auth_and_unauth(async_client, dcp_headers):
    """Search endpoint authenticated returns 200, unauthenticated returns 401."""
    res_unauth = await async_client.get("/cases/search?q=theft")
    assert res_unauth.status_code == 401

    res_auth = await async_client.get("/cases/search?q=theft", headers=dcp_headers)
    assert res_auth.status_code == 200

@pytest.mark.asyncio
async def test_cases_diary_entry_auth_unauth_invalid(async_client, io_headers):
    """Case diary endpoint auth/unauth and invalid payload tests."""
    case_id = str(uuid.uuid4())

    # Unauthenticated -> 401
    res_unauth = await async_client.post(f"/cases/{case_id}/diary", json={"description": "note"})
    assert res_unauth.status_code == 401

    # Empty payload -> 422
    res_invalid = await async_client.post(f"/cases/{case_id}/diary", json={}, headers=io_headers)
    assert res_invalid.status_code == 422


# ─── 3. PATROL MODULE ─────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_patrol_routes_auth_200_unauth_401(async_client, sho_headers):
    """Patrol routes endpoint returns 200 when authenticated, 401 when unauthenticated."""
    res_unauth = await async_client.get("/patrol/routes")
    assert res_unauth.status_code == 401

    res_auth = await async_client.get("/patrol/routes", headers=sho_headers)
    assert res_auth.status_code == 200

@pytest.mark.asyncio
async def test_patrol_create_unit_auth_unauth_invalid(async_client, sho_headers):
    """Patrol unit creation endpoint verification."""
    payload = {
        "unit_no": f"PATROL_{str(uuid.uuid4())[:4]}",
        "officer_name": "Patrol Officer",
        "vehicle": "car",
        "current_lat": 23.0225,
        "current_lon": 72.5714,
        "status": "available"
    }

    # Unauthenticated -> 401
    res_unauth = await async_client.post("/patrol/units", json=payload)
    assert res_unauth.status_code == 401

    # Valid -> 200
    res_auth = await async_client.post("/patrol/units", json=payload, headers=sho_headers)
    assert res_auth.status_code == 200

    # Invalid empty body -> 422
    res_invalid = await async_client.post("/patrol/units", json={}, headers=sho_headers)
    assert res_invalid.status_code == 422


# ─── 4. CCTV MODULE ───────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_cctv_endpoints_auth_unauth(async_client, dcp_headers):
    """CCTV GET endpoints auth/unauth check."""
    for endpoint in ["/cctv", "/cctv/cameras", "/cctv/anomalies"]:
        res_unauth = await async_client.get(endpoint)
        assert res_unauth.status_code == 401, f"{endpoint} unauth should be 401"

        res_auth = await async_client.get(endpoint, headers=dcp_headers)
        assert res_auth.status_code == 200, f"{endpoint} auth should be 200"

@pytest.mark.asyncio
async def test_cctv_alert_valid_and_invalid_payloads(async_client):
    """CCTV alert post accepts valid alert and rejects invalid payload with 422."""
    valid_payload = {
        "camera_id": "CAM_TEST_01",
        "source": "iccc",
        "alert_type": "crowd_density",
        "confidence": 0.92,
        "lat": 23.0225,
        "lon": 72.5714
    }
    valid_headers = {"X-API-Key": "iccc_api_key_2026"}

    res_valid = await async_client.post("/cctv/alert", json=valid_payload, headers=valid_headers)
    assert res_valid.status_code == 200

    # Empty payload -> 422
    res_empty = await async_client.post("/cctv/alert", json={}, headers=valid_headers)
    assert res_empty.status_code == 422

    # Missing mandatory camera_id -> 422
    res_bad = await async_client.post("/cctv/alert", json={"source": "iccc"}, headers=valid_headers)
    assert res_bad.status_code == 422


# ─── 5. ANALYTICS MODULE ──────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_analytics_endpoints_auth_unauth(async_client, dcp_headers):
    """Analytics summary, trends, resource status auth/unauth check."""
    endpoints = ["/analytics/summary", "/analytics/trends", "/analytics/resource_status", "/analytics/hotspot_surge"]
    for ep in endpoints:
        res_unauth = await async_client.get(ep)
        assert res_unauth.status_code == 401, f"{ep} unauth should be 401"

        res_auth = await async_client.get(ep, headers=dcp_headers)
        assert res_auth.status_code == 200, f"{ep} auth should be 200"

@pytest.mark.asyncio
async def test_analytics_simulate_valid_unauth_invalid(async_client, dcp_headers):
    """Analytics simulate endpoint valid (200), unauth (401), invalid (422)."""
    valid_payload = {"event": "Rath Yatra", "crowd_size": 50000}

    # Unauthenticated -> 401
    res_unauth = await async_client.post("/analytics/simulate", json=valid_payload)
    assert res_unauth.status_code == 401

    # Valid -> 200
    res_valid = await async_client.post("/analytics/simulate", json=valid_payload, headers=dcp_headers)
    assert res_valid.status_code == 200

    # Invalid empty body -> 422
    res_invalid = await async_client.post("/analytics/simulate", json={}, headers=dcp_headers)
    assert res_invalid.status_code == 422


# ─── 6. INCIDENTS MODULE ──────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_incidents_pcr_valid_unauth_invalid(async_client):
    """PCR incident endpoint valid (200), unauth (401), invalid payload (422)."""
    valid_payload = {
        "incident_type": "chain_snatching",
        "location_text": "SG Highway",
        "lat": 23.0450,
        "lon": 72.5250,
        "severity": 4
    }
    valid_headers = {"X-API-Key": "pcr_webhook_token_2026"}

    # 1. Unauthenticated -> 401
    res_unauth = await async_client.post("/incident/pcr", json=valid_payload)
    assert res_unauth.status_code == 401

    # 2. Valid -> 200
    res_valid = await async_client.post("/incident/pcr", json=valid_payload, headers=valid_headers)
    assert res_valid.status_code == 200

    # 3. Invalid payload (missing required lat/lon) -> 422
    res_invalid = await async_client.post("/incident/pcr", json={"incident_type": "test"}, headers=valid_headers)
    assert res_invalid.status_code == 422

@pytest.mark.asyncio
async def test_incidents_report_valid_unauth_invalid(async_client):
    """Report incident endpoint valid (200), unauth (401), invalid payload (422)."""
    valid_payload = {
        "type": "theft",
        "location": "Ellisbridge",
        "severity": "medium",
        "description": "Bike theft reported."
    }
    valid_headers = {"X-API-Key": "report_token_2026"}

    # 1. Unauth -> 401
    res_unauth = await async_client.post("/incident/report", json=valid_payload)
    assert res_unauth.status_code == 401

    # 2. Valid -> 200
    res_valid = await async_client.post("/incident/report", json=valid_payload, headers=valid_headers)
    assert res_valid.status_code == 200

    # 3. Invalid empty body -> 422
    res_invalid = await async_client.post("/incident/report", json={}, headers=valid_headers)
    assert res_invalid.status_code == 422

@pytest.mark.asyncio
async def test_incidents_sla_breaches_auth_unauth(async_client, sho_headers):
    """SLA breaches endpoint auth/unauth check."""
    res_unauth = await async_client.get("/incident/sla_breaches")
    assert res_unauth.status_code == 401

    res_auth = await async_client.get("/incident/sla_breaches", headers=sho_headers)
    assert res_auth.status_code == 200


# ─── 7. DOCS MODULE ───────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_docs_generate_valid_unauth_invalid(async_client, sho_headers, io_headers):
    """Docs generation endpoint valid (200), unauth (401), invalid payload (422)."""
    create_res = await async_client.post("/cases/create", json={
        "victim_name": "Doc Boundary Test Victim",
        "victim_address": "Test Address",
        "crime_type": "theft",
        "crime_narrative": "Narrative for doc boundary test",
        "crime_date": datetime.now(timezone.utc).isoformat(),
        "crime_location": "Test Location",
        "crime_lat": 23.0225,
        "crime_lon": 72.5714,
        "severity": 3
    }, headers=io_headers)
    assert create_res.status_code == 200
    case_id = create_res.json()["case_id"]

    valid_gen_payload = {
        "case_id": case_id,
        "doc_type": "chargesheet",
        "language": "en"
    }

    # 1. Unauthenticated -> 401
    res_unauth = await async_client.post("/docs/generate", json=valid_gen_payload)
    assert res_unauth.status_code == 401

    # 2. Valid -> 200
    res_valid = await async_client.post("/docs/generate", json=valid_gen_payload, headers=sho_headers)
    assert res_valid.status_code == 200

    # 3. Empty payload -> 422
    res_empty = await async_client.post("/docs/generate", json={}, headers=sho_headers)
    assert res_empty.status_code == 422

@pytest.mark.asyncio
async def test_docs_list_auth_unauth(async_client, sho_headers, io_headers):
    """Listing docs authenticated (200) vs unauthenticated (401)."""
    # Create case
    create_res = await async_client.post("/cases/create", json={
        "victim_name": "Doc List Test Victim",
        "victim_address": "Test Address",
        "crime_type": "theft",
        "crime_narrative": "Narrative for doc list test",
        "crime_date": datetime.now(timezone.utc).isoformat(),
        "crime_location": "Test Location",
        "crime_lat": 23.0225,
        "crime_lon": 72.5714,
        "severity": 3
    }, headers=io_headers)
    assert create_res.status_code == 200
    case_id = create_res.json()["case_id"]

    res_unauth = await async_client.get(f"/docs?case_id={case_id}")
    assert res_unauth.status_code == 401

    res_auth = await async_client.get(f"/docs?case_id={case_id}", headers=sho_headers)
    assert res_auth.status_code == 200


# ─── 8. ADMIN & ASSISTANT MODULES ─────────────────────────────────────────────
@pytest.mark.asyncio
async def test_admin_officers_auth_unauth_invalid(async_client, admin_headers):
    """Admin officers endpoints auth/unauth/invalid payload check."""
    # Unauth list -> 401
    res_unauth = await async_client.get("/admin/officers")
    assert res_unauth.status_code == 401

    # Auth list -> 200
    res_auth = await async_client.get("/admin/officers", headers=admin_headers)
    assert res_auth.status_code == 200

    # Invalid empty officer creation -> 422
    res_invalid = await async_client.post("/admin/officers", json={}, headers=admin_headers)
    assert res_invalid.status_code == 422

@pytest.mark.asyncio
async def test_assistant_query_valid_unauth_invalid(async_client, io_headers):
    """Assistant query endpoint valid (200), unauth (401), invalid payload (422)."""
    valid_payload = {"mode": "all_cases", "question": "What are recent hotspots?"}

    # Unauth -> 401
    res_unauth = await async_client.post("/assistant/query", json=valid_payload)
    assert res_unauth.status_code == 401

    # Valid -> 200
    res_valid = await async_client.post("/assistant/query", json=valid_payload, headers=io_headers)
    assert res_valid.status_code == 200

    # Invalid empty payload -> 422
    res_invalid = await async_client.post("/assistant/query", json={}, headers=io_headers)
    assert res_invalid.status_code == 422
