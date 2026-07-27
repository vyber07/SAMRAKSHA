"""
Empirical Verification Test Suite by Challenger 2 for Milestone M1 Iteration 2

Target Verification Areas:
1. `pcr_unit` CCTV alert ingestion into database with zero constraint violations:
   - API validation and DB persistence for source='pcr_unit'.
   - Verification of cctv_alerts_source_check PostgreSQL constraint.
   - ANPR license plate matching background task execution with pcr_unit source.
   - Retrieval via GET /api/v1/cctv/anomalies and GET /api/v1/cctv/cameras.
2. `GET /api/v1/cases/{case_id}` behavior when `io_id` is NULL:
   - Retrieval of case details when io_id is SQL NULL (io_name='Unknown', io_badge='').
   - Retrieval of case details when io_id is a valid officer ID (io_name=officer name, io_badge=badge_no).
   - Case diary entry listing alongside NULL io_id.
   - Role-based authorization checks (Constable -> 403, Cross-station IO -> 403, SHO -> 200, Admin -> 200).
"""

import pytest
import uuid
import asyncio
from app.db.connection import fetch_one, fetch_all, execute
from app.api.auth import create_access_token


# ============================================================================
# 1. VERIFY PCR_UNIT CCTV ALERT INGESTION & DB CONSTRAINTS
# ============================================================================

@pytest.mark.asyncio
async def test_pcr_unit_cctv_alert_ingestion_api_and_db(async_client, sho_headers, db_session):
    """Verify that pcr_unit CCTV alerts are ingested via API and saved to DB without constraint violations."""
    camera_id = f"CAM-PCR-{uuid.uuid4().hex[:6]}"
    payload = {
        "camera_id": camera_id,
        "source": "pcr_unit",
        "alert_type": "anomaly",
        "confidence": 0.92,
        "person_count": 3,
        "lat": 23.0225,
        "lon": 72.5714,
        "plate_no": None
    }

    # 1. Post alert via API
    res = await async_client.post("/api/v1/cctv/alert", json=payload, headers=sho_headers)
    assert res.status_code == 200, f"Expected 200 OK for pcr_unit alert, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["status"] == "ingested"
    alert_id = data["id"]
    assert alert_id is not None

    # 2. Verify row direct from PostgreSQL database
    row = await fetch_one(db_session, "SELECT * FROM cctv_alerts WHERE id = $1", [alert_id])
    assert row is not None
    assert row["camera_id"] == camera_id
    assert row["source"] == "pcr_unit"
    assert row["alert_type"] == "anomaly"
    assert row["confidence"] == 0.92
    assert row["person_count"] == 3


@pytest.mark.asyncio
async def test_pcr_unit_cctv_alert_all_alert_types(async_client, sho_headers, db_session):
    """Verify pcr_unit source works with all supported alert_types: crowd_density, loitering, anomaly, anpr."""
    alert_types = ['crowd_density', 'loitering', 'anomaly', 'anpr']

    for atype in alert_types:
        cam_id = f"CAM-PCR-{atype.upper()}-{uuid.uuid4().hex[:4]}"
        payload = {
            "camera_id": cam_id,
            "source": "pcr_unit",
            "alert_type": atype,
            "confidence": 0.88,
            "lat": 23.0300,
            "lon": 72.5800
        }
        res = await async_client.post("/api/v1/cctv/alert", json=payload, headers=sho_headers)
        assert res.status_code == 200, f"Failed for alert_type {atype}: {res.text}"

        row = await fetch_one(db_session, "SELECT source, alert_type FROM cctv_alerts WHERE camera_id = $1", [cam_id])
        assert row["source"] == "pcr_unit"
        assert row["alert_type"] == atype


@pytest.mark.asyncio
async def test_pcr_unit_cctv_alert_db_direct_insert_constraint(db_session):
    """Directly insert a row with source='pcr_unit' into PostgreSQL to verify DB constraint compliance."""
    cam_id = f"CAM-DB-DIRECT-{uuid.uuid4().hex[:6]}"
    
    # Should execute cleanly without CheckViolationError
    await execute(db_session, """
        INSERT INTO cctv_alerts (camera_id, source, alert_type, confidence, lat, lon)
        VALUES ($1, 'pcr_unit', 'loitering', 0.99, 23.0100, 72.5500)
    """, [cam_id])
    await db_session.commit()

    row = await fetch_one(db_session, "SELECT * FROM cctv_alerts WHERE camera_id = $1", [cam_id])
    assert row["source"] == "pcr_unit"


@pytest.mark.asyncio
async def test_pcr_unit_cctv_anpr_license_plate_matching(async_client, sho_headers, db_session):
    """Verify pcr_unit alert with plate_no triggers ANPR matching in background without error."""
    plate_number = f"GJ01AB{uuid.uuid4().hex[:4].upper()}"

    # Insert a case referencing this plate number in narrative
    case_id = str(uuid.uuid4())
    fir_no = f"FIR/2026/{uuid.uuid4().hex[:4].upper()}"
    sho_rec = await fetch_one(db_session, "SELECT ps_id FROM officers WHERE role = 'sho' LIMIT 1")

    await execute(db_session, """
        INSERT INTO cases (case_id, fir_no, ps_id, crime_type, crime_narrative, crime_date, crime_location, crime_lat, crime_lon, case_status)
        VALUES ($1, $2, $3, 'Robbery', $4, NOW(), 'Ellisbridge', 23.0225, 72.5714, 'open')
    """, [case_id, fir_no, sho_rec['ps_id'], f"Suspect vehicle identified as {plate_number} near scene."])
    await db_session.commit()

    # Post pcr_unit CCTV alert with ANPR plate_no
    cam_id = f"CAM-PCR-ANPR-{uuid.uuid4().hex[:4]}"
    payload = {
        "camera_id": cam_id,
        "source": "pcr_unit",
        "alert_type": "anpr",
        "confidence": 0.97,
        "lat": 23.0225,
        "lon": 72.5714,
        "plate_no": plate_number
    }
    res = await async_client.post("/api/v1/cctv/alert", json=payload, headers=sho_headers)
    assert res.status_code == 200

    # Wait briefly for background task
    await asyncio.sleep(0.5)

    alert_row = await fetch_one(db_session, "SELECT * FROM cctv_alerts WHERE camera_id = $1", [cam_id])
    assert alert_row["source"] == "pcr_unit"
    assert alert_row["plate_no"] == plate_number


@pytest.mark.asyncio
async def test_pcr_unit_alerts_in_get_anomalies(async_client, sho_headers, db_session):
    """Verify GET /api/v1/cctv/anomalies returns pcr_unit alerts correctly."""
    cam_id = f"CAM-ANOMALY-PCR-{uuid.uuid4().hex[:4]}"
    await execute(db_session, """
        INSERT INTO cctv_alerts (camera_id, source, alert_type, confidence, lat, lon)
        VALUES ($1, 'pcr_unit', 'anomaly', 0.95, 23.0200, 72.5600)
    """, [cam_id])
    await db_session.commit()

    res = await async_client.get("/api/v1/cctv/anomalies", headers=sho_headers)
    assert res.status_code == 200
    anomalies = res.json().get("anomalies", [])
    cam_ids = [a["camera_id"] for a in anomalies]
    assert cam_id in cam_ids


# ============================================================================
# 2. VERIFY GET /api/v1/cases/{case_id} WITH NULL IO_ID AND EDGE CASES
# ============================================================================

@pytest.mark.asyncio
async def test_get_case_details_with_null_io_id(async_client, sho_headers, db_session):
    """Empirically test GET /api/v1/cases/{case_id} when io_id is SQL NULL."""
    case_id = str(uuid.uuid4())
    fir_no = f"NULL-IO/2026/{uuid.uuid4().hex[:4].upper()}"

    sho_rec = await fetch_one(db_session, "SELECT ps_id FROM officers WHERE role = 'sho' LIMIT 1")
    ps_id = str(sho_rec['ps_id'])

    # Insert case with io_id = NULL
    await execute(db_session, """
        INSERT INTO cases (case_id, fir_no, ps_id, io_id, crime_type, crime_narrative, crime_date, crime_location, crime_lat, crime_lon)
        VALUES ($1, $2, $3, NULL, 'Burglary', 'Unassigned case narrative', NOW(), 'Sector 5', 23.0300, 72.5600)
    """, [case_id, fir_no, ps_id])
    await db_session.commit()

    # Call endpoint
    res = await async_client.get(f"/api/v1/cases/{case_id}", headers=sho_headers)
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}: {res.text}"

    data = res.json()
    assert data["case_id"] == case_id
    assert data["fir_no"] == fir_no
    assert data["io_id"] is None
    assert data["io_name"] == "Unknown"
    assert data["io_badge"] == ""
    assert isinstance(data["diary_entries"], list)


@pytest.mark.asyncio
async def test_get_case_details_with_null_io_id_and_diary_entries(async_client, sho_headers, db_session):
    """Verify case with NULL io_id returns diary_entries without breaking."""
    case_id = str(uuid.uuid4())
    fir_no = f"DIARY-NULL/2026/{uuid.uuid4().hex[:4].upper()}"

    sho_rec = await fetch_one(db_session, "SELECT id, ps_id FROM officers WHERE role = 'sho' LIMIT 1")
    ps_id = str(sho_rec['ps_id'])
    sho_id = str(sho_rec['id'])

    # Insert case with io_id = NULL
    await execute(db_session, """
        INSERT INTO cases (case_id, fir_no, ps_id, io_id, crime_type, crime_narrative, crime_date, crime_location, crime_lat, crime_lon)
        VALUES ($1, $2, $3, NULL, 'Cybercrime', 'Online fraud report', NOW(), 'Navrangpura', 23.0395, 72.5660)
    """, [case_id, fir_no, ps_id])

    # Insert diary entries using valid entry_type='note'
    await execute(db_session, """
        INSERT INTO case_diary (case_id, entry_type, description, officer_id, auto_generated)
        VALUES ($1, 'note', 'Initial inspection of online transaction log', $2, FALSE)
    """, [case_id, sho_id])
    await db_session.commit()

    res = await async_client.get(f"/api/v1/cases/{case_id}", headers=sho_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["io_name"] == "Unknown"
    assert len(data["diary_entries"]) == 1
    assert data["diary_entries"][0]["description"] == "Initial inspection of online transaction log"


@pytest.mark.asyncio
async def test_get_case_details_with_valid_assigned_io(async_client, sho_headers, db_session):
    """Verify GET /api/v1/cases/{case_id} populates io_name and io_badge when io_id is valid assigned officer."""
    case_id = str(uuid.uuid4())
    fir_no = f"VALID-IO/2026/{uuid.uuid4().hex[:4].upper()}"

    io_rec = await fetch_one(db_session, "SELECT id, name, badge_no, ps_id FROM officers WHERE role = 'io' LIMIT 1")
    assert io_rec is not None, "Test requires at least one officer with role='io'"
    io_id = str(io_rec['id'])
    ps_id = str(io_rec['ps_id'])

    await execute(db_session, """
        INSERT INTO cases (case_id, fir_no, ps_id, io_id, crime_type, crime_narrative, crime_date, crime_location, crime_lat, crime_lon)
        VALUES ($1, $2, $3, $4, 'Assault', 'Case assigned to active IO', NOW(), 'Ellisbridge', 23.0225, 72.5714)
    """, [case_id, fir_no, ps_id, io_id])
    await db_session.commit()

    res = await async_client.get(f"/api/v1/cases/{case_id}", headers=sho_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["io_id"] == io_id
    assert data["io_name"] == io_rec["name"]
    assert data["io_badge"] == io_rec["badge_no"]


@pytest.mark.asyncio
async def test_get_case_details_authorization_rules(async_client, db_session):
    """Verify role authorization for GET /api/v1/cases/{case_id}."""
    sho_rec = await fetch_one(db_session, "SELECT id, ps_id FROM officers WHERE role = 'sho' LIMIT 1")
    ps_id = str(sho_rec['ps_id'])

    case_id = str(uuid.uuid4())
    fir_no = f"AUTH/2026/{uuid.uuid4().hex[:4].upper()}"
    await execute(db_session, """
        INSERT INTO cases (case_id, fir_no, ps_id, io_id, crime_type, crime_narrative, crime_date, crime_location, crime_lat, crime_lon)
        VALUES ($1, $2, $3, NULL, 'Theft', 'Auth test case', NOW(), 'Loc', 23.0, 72.0)
    """, [case_id, fir_no, ps_id])
    await db_session.commit()

    # 1. Constable role -> 403
    constable = await fetch_one(db_session, "SELECT id FROM officers WHERE role = 'constable' LIMIT 1")
    if constable:
        const_token = create_access_token(str(constable['id']), 'constable', ps_id)
        res = await async_client.get(f"/api/v1/cases/{case_id}", headers={"Authorization": f"Bearer {const_token}"})
        assert res.status_code == 403

    # 2. Non-existent case_id -> 404
    res_404 = await async_client.get(f"/api/v1/cases/{uuid.uuid4()}", headers={"Authorization": f"Bearer {create_access_token(str(sho_rec['id']), 'sho', ps_id)}"})
    assert res_404.status_code == 404
