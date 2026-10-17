import pytest
from app.scanners.bandit_scanner import BanditScanner
from app.scanners.normalizer import normalize_bandit_results
from app.core.security import redact_secrets

@pytest.mark.asyncio
async def test_bandit_scanner_available():
    scanner = BanditScanner()
    assert await scanner.is_available() is True

@pytest.mark.asyncio
async def test_bandit_detects_sql_injection():
    scanner = BanditScanner()
    code = (
        "import sqlite3\n"
        "def query_user(user_id):\n"
        "    query = 'SELECT * FROM users WHERE id = ' + user_id\n"
        "    sqlite3.connect('test.db').execute(query)\n"
    )
    raw = await scanner.scan_code(code, "test_sql.py", "python")
    assert len(raw) > 0
    rule_ids = [r.get("test_id") for r in raw]
    assert "B608" in rule_ids

    normalized = normalize_bandit_results(raw, "test_scan_1", "test_sql.py")
    assert len(normalized) > 0
    sql_finding = next(f for f in normalized if f["rule_id"] == "B608")
    assert sql_finding["category"] == "SQL Injection"
    assert sql_finding["severity"] in ["MEDIUM", "HIGH"]
    assert "CWE-89" in (sql_finding["cwe"] or "")

def test_secret_redaction():
    leak = "API_KEY = 'sk-1234567890abcdefghijklmnop'\npassword = 'SuperSecretPassword123!'"
    redacted = redact_secrets(leak)
    assert "sk-1234567890" not in redacted
    assert "SuperSecretPassword123!" not in redacted
    assert "[REDACTED" in redacted
