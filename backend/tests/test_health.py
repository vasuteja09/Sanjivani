from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "ai_configured" in data
    assert "scanner_available" in data
    assert data["scanner_available"] is True

def test_scanner_status():
    response = client.get("/api/scanner/status")
    assert response.status_code == 200
    data = response.json()
    assert data["scanner_available"] is True
    assert "Bandit" in data["scanner_name"]
    assert "python" in data["supported_languages"]
