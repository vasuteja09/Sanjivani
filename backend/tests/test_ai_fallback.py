from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ai_fallback_explanation():
    # 1. Create a scan with an SQL injection finding
    code = (
        "import sqlite3\n"
        "def find_user(username):\n"
        "    return sqlite3.connect('test.db').execute('SELECT * FROM users WHERE u = ' + username).fetchall()\n"
    )
    scan_res = client.post(
        "/api/scans",
        json={"code": code, "file_name": "ai_test.py", "language": "python"}
    )
    assert scan_res.status_code == 200
    scan = scan_res.json()
    assert len(scan["findings"]) >= 1
    finding_id = scan["findings"][0]["id"]

    # 2. Call explain endpoint without AI key
    explain_res = client.post(f"/api/findings/{finding_id}/explain")
    assert explain_res.status_code == 200
    data = explain_res.json()
    assert data["finding_id"] == finding_id
    assert "vulnerability_explanation" in data
    assert len(data["vulnerability_explanation"]) > 10
    assert "impact" in data
    assert "remediation_approach" in data
    assert "disclaimer" in data
    # When no key is provided, ai_available should be False with fallback
    assert data["ai_available"] is False
    assert data["fallback_reason"] is not None

    # 3. Call suggest-fix endpoint
    fix_res = client.post(
        f"/api/findings/{finding_id}/suggest-fix",
        json={"source_context": "execute('SELECT * FROM users WHERE u = ' + username)"}
    )
    assert fix_res.status_code == 200
    fix_data = fix_res.json()
    assert fix_data["finding_id"] == finding_id
    assert "suggested_code" in fix_data
    assert len(fix_data["suggested_code"]) > 5
    assert "explanation_of_changes" in fix_data

    # Cleanup test scan
    client.delete(f"/api/scans/{scan['id']}")
