# Educational Demonstration Sample - Safer Implementation
# Purpose: Demonstrates parameterized queries, environment variables, and safe subprocess invocation.

import os
import sqlite3
import subprocess
from pathlib import Path

# Safe Practice 1: Secrets loaded from environment variables, not hardcoded
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "")
API_KEY = os.getenv("API_KEY", "")

def get_user_profile_safe(user_id: int):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # Safe Practice 2: Parameterized query prevents SQL injection
    query = "SELECT id, username, email, role FROM users WHERE id = ?"
    cursor.execute(query, (user_id,))
    
    user = cursor.fetchone()
    conn.close()
    return user

def process_user_report_safe(filename: str):
    # Safe Practice 3: Validate filename against path traversal
    safe_name = Path(filename).name
    report_path = Path("reports") / safe_name
    
    # Safe Practice 4: shell=False, pass arguments as a structured array
    result = subprocess.run(
        ["echo", "Processing", str(report_path)],
        shell=False,
        capture_output=True,
        text=True,
        check=True
    )
    return result.stdout
