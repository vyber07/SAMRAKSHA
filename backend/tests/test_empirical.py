import pytest
import uuid
import re
import httpx
from unittest.mock import patch, AsyncMock, MagicMock
from app.db.connection import convert_query, fetch_one, fetch_all, execute
from app.services.routing import optimize_patrol_routes
from app.services.translation import translator_service
from app.api.assistant import simple_keyword_answer, query_assistant, AssistantQuery

def test_convert_query_parameter_formatting_and_casts():
    """Verify convert_query correctly formats $1..$N parameters and preserves SQL typecasts."""
    # 1. Test >9 parameters ($10, $11, $24)
    query_24 = "INSERT INTO cases (c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17, c18, c19, c20, c21, c22, c23, c24) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)"
    params_24 = list(range(1, 25))
    q_out, p_out = convert_query(query_24, params_24)
    
    assert ":p10" in q_out
    assert ":p24" in q_out
    assert "$10" not in q_out
    assert "$24" not in q_out
    assert p_out["p10"] == 10
    assert p_out["p24"] == 24

    # 2. Test typecasts like $1::uuid, $2::timestamp, $3::geography, ::INTEGER, ::uuid[]
    query_cast = "SELECT * FROM cases WHERE id = $1::uuid AND created_at > $2::timestamp AND zone_code = $3::INTEGER AND tags = $4::uuid[]"
    params_cast = [str(uuid.uuid4()), "2026-01-01T00:00:00Z", 10, [str(uuid.uuid4())]]
    q_cast_out, p_cast_out = convert_query(query_cast, params_cast)
    
    assert ":p1::uuid" in q_cast_out
    assert ":p2::timestamp" in q_cast_out
    assert ":p3::INTEGER" in q_cast_out
    assert ":p4::uuid[]" in q_cast_out
    assert p_cast_out["p1"] == params_cast[0]

@pytest.mark.asyncio
async def test_error_recovery_llm_missing_service(async_client, sho_headers):
    """Verify assistant query degrades gracefully when Llama.cpp LLM service is unavailable."""
    original_post = httpx.AsyncClient.post
    async def mock_post(self, url, *args, **kwargs):
        if "llamacpp" in str(url) or "8080" in str(url) or "completion" in str(url):
            raise httpx.ConnectError("Connection refused to llamacpp:8080")
        return await original_post(self, url, *args, **kwargs)

    with patch.object(httpx.AsyncClient, "post", mock_post):
        res = await async_client.post(
            "/api/v1/assistant/query",
            json={"mode": "all_cases", "question": "What cases involve theft or evidence?"},
            headers=sho_headers
        )
        assert res.status_code == 200
        data = res.json()
        assert data["source"] == "fallback"
        assert len(data["answer"]) > 0

@pytest.mark.asyncio
async def test_error_recovery_osrm_missing_service():
    """Verify patrol routing degrades gracefully when OSRM routing server is down."""
    units = [
        {"id": "u1", "unit_name": "PCR-1", "current_lat": 23.0225, "current_lon": 72.5714, "status": "active"}
    ]
    hotspots = [
        {"ward": "Ward 1", "risk_score": 80, "lat": 23.0300, "lon": 72.5800}
    ]
    
    with patch("httpx.AsyncClient.get", side_effect=httpx.ConnectTimeout("OSRM request timed out")):
        routes = await optimize_patrol_routes(units, hotspots)
        assert len(routes) == 1
        assert "road_path" in routes[0]
        assert len(routes[0]["road_path"]) >= 2  # Straight line fallback

@pytest.mark.asyncio
async def test_error_recovery_translation_missing_services():
    """Verify translation service falls back from IndicTrans2 -> Llama.cpp -> Glossary."""
    original_post = httpx.AsyncClient.post
    async def mock_post(self, url, *args, **kwargs):
        if "llamacpp" in str(url) or "chat/completions" in str(url):
            raise httpx.ConnectError("Llama.cpp offline")
        return await original_post(self, url, *args, **kwargs)

    with patch.object(httpx.AsyncClient, "post", mock_post):
        res = await translator_service.translate("FIR filed at Police Station for Theft", target_lang="hi", source_lang="en")
        assert "Prathamik Suchna Report" in res
        assert "Police Thana" in res

@pytest.mark.asyncio
async def test_uuid_null_safety_in_case_details(async_client, sho_headers, db_session):
    """Empirically test GET /api/v1/cases/{case_id} when case io_id is NULL in DB."""
    # Create a test case with NULL io_id directly in DB
    case_id = str(uuid.uuid4())
    fir_no = f"TEST/2026/{uuid.uuid4().hex[:4].upper()}"
    
    # Get sho's ps_id
    sho_record = await fetch_one(db_session, "SELECT ps_id FROM officers WHERE role = 'sho' LIMIT 1")
    ps_id = str(sho_record['ps_id'])
    
    await execute(db_session, """
        INSERT INTO cases (case_id, fir_no, ps_id, io_id, crime_type, crime_narrative, crime_date, crime_location, crime_lat, crime_lon)
        VALUES ($1, $2, $3, NULL, 'Theft', 'Test narrative', NOW(), 'Test loc', 23.0225, 72.5714)
    """, [case_id, fir_no, ps_id])
    await db_session.commit()

    # Call GET /api/v1/cases/{case_id}
    res = await async_client.get(f"/api/v1/cases/{case_id}", headers=sho_headers)
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}: {res.text}"
    case_data = res.json()
    assert case_data["case_id"] == case_id
    assert case_data["io_name"] == "Unknown"

@pytest.mark.asyncio
async def test_null_ps_id_officer_uuid_casting(async_client, db_session):
    """Empirically test queries when an officer has ps_id = NULL in DB (e.g. Headquarters / Admin)."""
    admin_record = await fetch_one(db_session, "SELECT id, badge_no FROM officers WHERE role = 'admin' LIMIT 1")
    if admin_record:
        # Set ps_id to NULL for admin officer
        await execute(db_session, "UPDATE officers SET ps_id = NULL WHERE id = $1", [admin_record['id']])
        await db_session.commit()

        from app.api.auth import create_access_token
        admin_token = create_access_token(str(admin_record['id']), 'admin', None)

        res = await async_client.get("/api/v1/cases", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200, f"Expected 200 OK for admin officer with NULL ps_id, got {res.status_code}: {res.text}"
