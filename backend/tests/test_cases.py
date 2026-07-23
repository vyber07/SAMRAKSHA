import pytest
from datetime import datetime

@pytest.mark.asyncio
async def test_create_fir(async_client, io_headers):
    """Test FIR creation with legal section suggestion."""
    payload = {
        "victim_name": "Ramesh Patel",
        "victim_address": "101 Ellisbridge Main Road, Ahmedabad",
        "victim_phone": "9876543210",
        "victim_age": 42,
        "victim_gender": "male",
        "victim_injury": True,
        "crime_type": "theft",
        "crime_code": 303,
        "crime_narrative": "Victim reported that two unknown persons on a bike stole his wallet and gold chain containing Rs. 15,000 near Ellisbridge town hall.",
        "crime_date": datetime.utcnow().isoformat(),
        "crime_location": "Near Ellisbridge Town Hall, Ahmedabad",
        "crime_lat": 23.0225,
        "crime_lon": 72.5714,
        "ward": "Ellisbridge",
        "severity": 3,
        "accused_name": "Unknown Bike Riders",
        "accused_address": "Unknown",
        "accused_age": 25,
        "language": "en"
    }

    response = await async_client.post("/cases/create", json=payload, headers=io_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "case_id" in data
    assert "fir_no" in data
    assert "suggested_sections" in data
    assert "bns" in data["suggested_sections"]

@pytest.mark.asyncio
async def test_list_cases_paginated(async_client, sho_headers):
    """Test listing cases with pagination parameters."""
    response = await async_client.get("/cases?page=1&limit=5", headers=sho_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "items" in data
    assert "page" in data
    assert data["page"] == 1
    assert data["limit"] == 5
    assert isinstance(data["items"], list)

@pytest.mark.asyncio
async def test_full_text_search_vector_query(async_client, dcp_headers):
    """Test PostgreSQL tsvector full-text search across case files."""
    response = await async_client.get("/cases/search?q=theft", headers=dcp_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    results = response.json()
    assert isinstance(results, list)

@pytest.mark.asyncio
async def test_case_diary_entry(async_client, io_headers):
    """Test adding a case diary entry to a registered case."""
    # First create a case to attach the diary entry to
    payload = {
        "victim_name": "Suresh Shah",
        "victim_address": "202 Satellite Road, Ahmedabad",
        "victim_phone": "9812345678",
        "victim_age": 35,
        "victim_gender": "male",
        "victim_injury": False,
        "crime_type": "theft",
        "crime_code": 303,
        "crime_narrative": "Mobile phone snatched while standing at bus stop.",
        "crime_date": datetime.utcnow().isoformat(),
        "crime_location": "Satellite Bus Stop, Ahmedabad",
        "crime_lat": 23.0300,
        "crime_lon": 72.5100,
        "ward": "Satellite",
        "severity": 2,
        "language": "en"
    }

    create_res = await async_client.post("/cases/create", json=payload, headers=io_headers)
    assert create_res.status_code == 200
    case_id = create_res.json()["case_id"]

    # Now post a case diary entry
    diary_payload = {
        "entry_type": "note",
        "description": "Visited crime scene, recovered CCTV footage from nearby store.",
        "location": "Satellite Bus Stop"
    }
    diary_res = await async_client.post(f"/cases/{case_id}/diary", json=diary_payload, headers=io_headers)
    assert diary_res.status_code == 200, f"Expected 200, got {diary_res.status_code}: {diary_res.text}"
    diary_data = diary_res.json()
    assert diary_data["message"] == "Case diary entry added successfully"
    assert diary_data["case_id"] == case_id

    # Verify fetching case details includes the new diary entry
    get_res = await async_client.get(f"/cases/{case_id}", headers=io_headers)
    assert get_res.status_code == 200
    case_data = get_res.json()
    assert "diary_entries" in case_data
    assert any(entry["description"] == diary_payload["description"] for entry in case_data["diary_entries"])
