import pytest
import time
import httpx

@pytest.mark.asyncio
async def test_login_admin_success(async_client):
    """Test successful login with ADMIN001 credentials."""
    response = await async_client.post("/auth/login", json={
        "badge_no": "ADMIN001",
        "password": "password123"
    })
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["officer"]["badge_no"] == "ADMIN001"
    assert data["officer"]["role"] == "admin"

@pytest.mark.asyncio
async def test_login_dcp_success(async_client):
    """Test successful login with DCP001 credentials."""
    response = await async_client.post("/auth/login", json={
        "badge_no": "DCP001",
        "password": "password123"
    })
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["officer"]["badge_no"] == "DCP001"
    assert data["officer"]["role"] == "dcp"

@pytest.mark.asyncio
async def test_login_invalid_badge(async_client):
    """Test login attempt with non-existent badge number."""
    response = await async_client.post("/auth/login", json={
        "badge_no": "NONEXISTENT_BADGE_999",
        "password": "password123"
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json().get("detail", "")

@pytest.mark.asyncio
async def test_login_invalid_password(async_client):
    """Test login attempt with wrong password for existing badge."""
    response = await async_client.post("/auth/login", json={
        "badge_no": "ADMIN001",
        "password": "wrong_password_xyz"
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json().get("detail", "")

@pytest.mark.asyncio
async def test_login_timing_safety(async_client):
    """
    Test timing safety: non-existent badge vs existing badge with wrong password.
    Both should execute dummy bcrypt calculation and exhibit comparable execution time.
    """
    t0 = time.perf_counter()
    res1 = await async_client.post("/auth/login", json={
        "badge_no": "NONEXISTENT_BADGE_000",
        "password": "wrongpassword123"
    })
    t_invalid_badge = time.perf_counter() - t0

    t0 = time.perf_counter()
    res2 = await async_client.post("/auth/login", json={
        "badge_no": "ADMIN001",
        "password": "wrongpassword123"
    })
    t_invalid_password = time.perf_counter() - t0

    assert res1.status_code == 401
    assert res2.status_code == 401
    
    # Both executions run bcrypt hash, so their execution times should be within the same order of magnitude.
    # We verify neither returns instantly (0ms vs 100ms).
    ratio = max(t_invalid_badge, t_invalid_password) / max(min(t_invalid_badge, t_invalid_password), 0.001)
    assert ratio < 10.0, f"Timing discrepancy detected: {t_invalid_badge:.4f}s vs {t_invalid_password:.4f}s"

@pytest.mark.asyncio
async def test_token_logout_blacklisting(async_client):
    """Test logging out and verifying token blacklisting in Redis."""
    # 1. Login to get a fresh token
    login_res = await async_client.post("/auth/login", json={
        "badge_no": "ADMIN001",
        "password": "password123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Logout with token
    logout_res = await async_client.post("/auth/logout", headers=headers)
    assert logout_res.status_code == 200
    assert logout_res.json() == {"message": "Logged out"}

    # 3. Attempt to use revoked token again
    revoked_res = await async_client.post("/auth/logout", headers=headers)
    assert revoked_res.status_code == 401
    assert "revoked" in revoked_res.json().get("detail", "").lower() or "invalid" in revoked_res.json().get("detail", "").lower()
