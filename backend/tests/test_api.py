import os
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ["SECRET_KEY"] = "super-secret-test-key-for-samraksha-api"
os.environ["ENVIRONMENT"] = "testing"

from app.api.auth import router as auth_router

app = FastAPI()
app.include_router(auth_router, prefix="/api/v1/auth")

client = TestClient(app)

def test_login_no_body():
    response = client.post("/api/v1/auth/login")
    assert response.status_code == 422  # Unprocessable Entity because body is missing

def test_logout_no_token():
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 401  # Not authenticated
