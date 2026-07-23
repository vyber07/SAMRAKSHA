import pytest
import uuid

@pytest.mark.asyncio
async def test_officers_crud(async_client, admin_headers, sho_officer):
    """Test Officers CRUD operations by admin."""
    badge = f"TEST_OFF_{str(uuid.uuid4())[:6].upper()}"

    # 1. List officers
    list_res = await async_client.get("/admin/officers", headers=admin_headers)
    assert list_res.status_code == 200, f"Expected 200, got {list_res.status_code}: {list_res.text}"
    officers = list_res.json()
    assert isinstance(officers, list)

    # 2. Create officer
    create_payload = {
        "badge_no": badge,
        "name": "Test Officer Sub-Inspector",
        "role": "io",
        "ps_id": str(sho_officer["ps_id"]),
        "password": "password123"
    }
    create_res = await async_client.post("/admin/officers", json=create_payload, headers=admin_headers)
    assert create_res.status_code == 200, f"Expected 200, got {create_res.status_code}: {create_res.text}"
    assert create_res.json() == {"status": "created"}

    # 3. Update officer
    update_payload = {
        "name": "Updated Test Officer Name",
        "role": "sho",
        "is_active": True
    }
    update_res = await async_client.patch(f"/admin/officers/{badge}", json=update_payload, headers=admin_headers)
    assert update_res.status_code == 200, f"Expected 200, got {update_res.status_code}: {update_res.text}"
    assert update_res.json() == {"status": "updated"}

@pytest.mark.asyncio
async def test_role_matrix_and_permission_overrides(async_client, admin_headers, io_officer):
    """Test retrieving permission catalog and setting permission overrides for an officer."""
    # 1. Get permission catalog
    perm_res = await async_client.get("/admin/permissions", headers=admin_headers)
    assert perm_res.status_code == 200, f"Expected 200, got {perm_res.status_code}: {perm_res.text}"
    permissions = perm_res.json()
    assert isinstance(permissions, list)
    assert len(permissions) >= 1

    badge = io_officer["badge_no"]

    # 2. Get initial officer permission overrides
    off_perm_res = await async_client.get(f"/admin/officers/{badge}/permissions", headers=admin_headers)
    assert off_perm_res.status_code == 200

    # 3. Set permission override
    overrides_payload = [
        {"permission_key": "doc_generate", "granted": True},
        {"permission_key": "analytics_view", "granted": True}
    ]
    set_perm_res = await async_client.put(f"/admin/officers/{badge}/permissions", json=overrides_payload, headers=admin_headers)
    assert set_perm_res.status_code == 200
    assert set_perm_res.json() == {"status": "permissions updated"}

    # 4. Verify permission overrides were applied
    verify_res = await async_client.get(f"/admin/officers/{badge}/permissions", headers=admin_headers)
    assert verify_res.status_code == 200
    current_overrides = verify_res.json()
    keys = [o["permission_key"] for o in current_overrides]
    assert "doc_generate" in keys
    assert "analytics_view" in keys

@pytest.mark.asyncio
async def test_audit_log_recording(async_client, admin_headers):
    """Test retrieving system audit log recordings."""
    response = await async_client.get("/admin/audit", headers=admin_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    logs = response.json()
    assert isinstance(logs, list)
