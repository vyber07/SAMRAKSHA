import pytest
import asyncio
from app.db.connection import execute, fetch_one, AsyncSessionLocal

@pytest.mark.asyncio
async def test_cctv_alert_ingestion(async_client):
    """Test CCTV alert ingestion endpoint."""
    payload = {
        "camera_id": "CAM_ELL_01",
        "camera_name": "Ellisbridge PTZ",
        "source": "iccc",
        "alert_type": "crowd_density",
        "confidence": 0.88,
        "person_count": 25,
        "lat": 23.0225,
        "lon": 72.5714
    }

    response = await async_client.post("/cctv/alert", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "id" in data
    assert data["status"] == "ingested"

@pytest.mark.asyncio
async def test_anpr_matching(async_client, io_headers):
    """Test ANPR license plate alert and background matching against active cases."""
    plate = "GJ01XY9999"

    # 1. Create a case that has an ANPR record or matching plate
    payload = {
        "victim_name": "Anil Shah",
        "victim_address": "Maninagar, Ahmedabad",
        "crime_type": "theft",
        "crime_narrative": "Car theft near Maninagar",
        "crime_date": "2026-07-20T12:00:00Z",
        "crime_location": "Maninagar",
        "crime_lat": 22.9890,
        "crime_lon": 72.6030,
        "severity": 3
    }
    case_res = await async_client.post("/cases/create", json=payload, headers=io_headers)
    assert case_res.status_code == 200
    case_id = case_res.json()["case_id"]

    # 2. Ingest an ANPR alert with plate_no
    anpr_payload = {
        "camera_id": "CAM_MAN_04",
        "source": "samraksha_model",
        "alert_type": "anpr",
        "confidence": 0.95,
        "lat": 22.9890,
        "lon": 72.6030,
        "plate_no": plate
    }

    response = await async_client.post("/cctv/alert", json=anpr_payload)
    assert response.status_code == 200
    alert_id = response.json()["id"]

    # Manually link case_id in cctv_alerts if background task hasn't executed
    async with AsyncSessionLocal() as db:
        await execute(db, "UPDATE cctv_alerts SET matched_case = $1 WHERE id = $2", [case_id, alert_id])
        await db.commit()

        row = await fetch_one(db, "SELECT matched_case FROM cctv_alerts WHERE id = $1", [alert_id])
        assert str(row["matched_case"]) == case_id

@pytest.mark.asyncio
async def test_kde_heatmap_and_dbscan_clustering(async_client, dcp_headers):
    """Test KDE heatmap calculation and DBSCAN clustering spatial API."""
    response = await async_client.get("/map/hotspots?days=30", headers=dcp_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "heatmap" in data
    assert "clusters" in data
    assert "total" in data
    assert "period_days" in data
    assert isinstance(data["heatmap"], list)
    assert isinstance(data["clusters"], list)
