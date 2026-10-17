import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

SAMPLES_DIR = Path(__file__).resolve().parent.parent.parent / "samples"

SAMPLE_CATALOG = [
    {
        "id": "insecure_sql",
        "file_name": "insecure_sql.py",
        "title": "SQL Injection Vector",
        "category": "SQL Injection (B608)",
        "language": "python",
        "description": "Demonstrates untrusted user input directly concatenated into a raw SQL query string."
    },
    {
        "id": "hardcoded_secret",
        "file_name": "hardcoded_secret.py",
        "title": "Hardcoded Credentials & Tokens",
        "category": "Secret Exposure (B105/B106)",
        "language": "python",
        "description": "Demonstrates sensitive API keys and database passwords hardcoded in source code."
    },
    {
        "id": "unsafe_command",
        "file_name": "unsafe_command.py",
        "title": "Unsafe Shell Command Execution",
        "category": "Command Injection (B602/B605)",
        "language": "python",
        "description": "Demonstrates dangerous invocations of os.system() and subprocess with shell=True."
    },
    {
        "id": "safer_example",
        "file_name": "safer_example.py",
        "title": "Safer Remediated Implementation",
        "category": "Clean / Secure Pattern",
        "language": "python",
        "description": "Demonstrates parameterized SQL queries, environment variables, and shell=False subprocess execution."
    }
]

@router.get("/samples")
def list_samples():
    return SAMPLE_CATALOG

@router.get("/samples/{sample_id}")
def get_sample_content(sample_id: str):
    target = next((s for s in SAMPLE_CATALOG if s["id"] == sample_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Educational sample not found")

    file_path = SAMPLES_DIR / target["file_name"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample file missing from disk")

    content = file_path.read_text(encoding="utf-8")
    return {
        **target,
        "code": content
    }
