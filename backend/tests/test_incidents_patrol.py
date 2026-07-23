import pytest
from app.db.connection import execute, AsyncSessionLocal

@pytest.mark.asyncio
async def test_create_pcr_incident(async_client):
    """Test receiving PCR emergency webhook incident."""
    payload = {
        "incident_type": "snatching",
        "location_text": "Navrangpura Bus Stand",
        "lat": 23.0395,
        "lon": 72.5660,
        "severity": 4,
        "caller_phone": "9998887776"
    }
    headers = {"X-API-Key": "pcr_webhook_token_2026"}

    response = await async_client.post("/incident/pcr", json=payload, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "incident_id" in data
    assert data["status"] == "received"

@pytest.mark.asyncio
async def test_create_report_incident(async_client):
    """Test reporting an incident manually."""
    payload = {
        "type": "assault",
        "location": "Vastrapur Lake",
        "severity": "high",
        "description": "Scuffle between two groups.",
        "lat": 23.0370,
        "lon": 72.5300
    }
    headers = {"X-API-Key": "report_token_2026"}

    response = await async_client.post("/incident/report", json=payload, headers=headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "id" in data
    assert data["type"] == "assault"
    assert data["severity"] == "high"

@pytest.mark.asyncio
async def test_sla_breach_detection(async_client):
    """Test SLA breach detection endpoint for unaddressed active incidents older than 15 minutes."""
    # Insert an old active incident directly into database to trigger SLA breach
    async with AsyncSessionLocal() as db:
        await execute(db, """
            INSERT INTO incidents (source, crime_type, lat, lon, geoloc, severity, timestamp, status)
            VALUES ('pcr', 'robbery', 23.02, 72.57, ST_MakePoint(72.57, 23.02)::GEOGRAPHY, 4, NOW() - INTERVAL '30 minutes', 'active')
        """)
        await db.commit()

    response = await async_client.get("/incident/sla_breaches")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "breaches" in data
    assert isinstance(data["breaches"], list)
    assert len(data["breaches"]) >= 1

@pytest.mark.asyncio
async def test_patrol_routing_generation(async_client, sho_headers):
    """Test OR-Tools VRP patrol route optimization endpoint."""
    response = await async_client.get("/patrol/routes", headers=sho_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "routes" in data
    assert "units" in data
    assert "hotspots" in data
    assert "computed_at" in data
    assert isinstance(data["routes"], list)
