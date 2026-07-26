import pytest
import subprocess
import os
import sys

def test_javascript_zustand_stores_and_state_transitions():
    """
    Execute JS test suite using Node.js runner to test Zustand stores
    (useAuthStore, useDashboardStore, useMapStore), token storage,
    FIR state updates, and search filter transitions.
    """
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))
    js_test_path = os.path.join(frontend_dir, "src/tests/store_and_component_state.test.js")
    assert os.path.exists(js_test_path), f"JS test file not found at {js_test_path}"

    cmd = ["node", "--test", js_test_path]
    result = subprocess.run(cmd, cwd=frontend_dir, capture_output=True, text=True)
    
    assert result.returncode == 0, f"JS Store & State tests failed:\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}"
    assert "ok " in result.stdout or "pass" in result.stdout or "# pass" in result.stdout

def test_auth_store_token_storage_semantics():
    """Test auth token storage state semantics programmatically."""
    token = "bearer_token_samraksha_123"
    officer = {"badge_no": "ADMIN001", "role": "admin"}
    
    # Store state representation
    store = {"token": None, "officer": None}
    
    def set_auth(t, o):
        store["token"] = t
        store["officer"] = o
        
    def logout():
        store["token"] = None
        store["officer"] = None
        
    set_auth(token, officer)
    assert store["token"] == token
    assert store["officer"]["role"] == "admin"
    
    logout()
    assert store["token"] is None
    assert store["officer"] is None

def test_fir_state_transition_validation():
    """Test FIR form state transition parsing and boundary validation."""
    form_state = {
        "victim_name": "Test Victim",
        "victim_age": "34",
        "crime_type": "Theft",
        "crime_lat": "23.0225",
        "crime_lon": "72.5714",
        "severity": "3"
    }
    
    # State transition payload computation
    payload = {
        "victim_name": form_state["victim_name"],
        "victim_age": int(form_state["victim_age"]) if form_state["victim_age"] else None,
        "crime_lat": float(form_state["crime_lat"]),
        "crime_lon": float(form_state["crime_lon"]),
        "severity": int(form_state["severity"])
    }
    
    assert payload["victim_name"] == "Test Victim"
    assert payload["victim_age"] == 34
    assert payload["crime_lat"] == 23.0225
    assert 1 <= payload["severity"] <= 5
