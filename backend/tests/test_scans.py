from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_submit_valid_scan_and_get():
    vulnerable_code = (
        "import os\n"
        "def run_cmd(arg):\n"
        "    os.system('cat ' + arg)\n"
    )
    # 1. Submit scan
    response = client.post(
        "/api/scans",
        json={"code": vulnerable_code, "file_name": "cmd_test.py", "language": "python"}
    )
    assert response.status_code == 200
    scan_data = response.json()
    scan_id = scan_data["id"]
    assert scan_data["file_name"] == "cmd_test.py"
    assert scan_data["total_findings"] >= 1
    assert len(scan_data["findings"]) >= 1

    # Check finding details
    finding = scan_data["findings"][0]
    assert "start_line" in finding
    assert finding["scanner_name"] == "Bandit"

    # 2. Retrieve scan by ID
    get_res = client.get(f"/api/scans/{scan_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == scan_id

    # 3. List scans
    list_res = client.get("/api/scans")
    assert list_res.status_code == 200
    scans_list = list_res.json()
    assert any(s["id"] == scan_id for s in scans_list)

    # 4. Rescan with safe code
    safe_code = (
        "import subprocess\n"
        "def run_cmd(arg):\n"
        "    subprocess.run(['cat', arg], shell=False, check=True)\n"
    )
    rescan_res = client.post(
        f"/api/scans/{scan_id}/rescan",
        json={"code": safe_code}
    )
    assert rescan_res.status_code == 200
    rescan_data = rescan_res.json()
    assert len(rescan_data["resolved_findings"]) >= 1

    # 5. Delete scan
    del_res = client.delete(f"/api/scans/{scan_id}")
    assert del_res.status_code == 200

    # 6. Verify 404 after deletion
    check_deleted = client.get(f"/api/scans/{scan_id}")
    assert check_deleted.status_code == 404

def test_submit_empty_code_rejected():
    res = client.post("/api/scans", json={"code": "   ", "language": "python"})
    assert res.status_code == 400

def test_submit_unsupported_language_rejected():
    res = client.post("/api/scans", json={"code": "console.log('hi');", "language": "javascript"})
    assert res.status_code == 422
