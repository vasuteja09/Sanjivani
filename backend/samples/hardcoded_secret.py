# Educational Demonstration Sample - Hardcoded Secrets & Credentials
# Purpose: Demonstrates risk of exposing production API keys and database credentials in source code.

import requests

# VULNERABILITY: Hardcoded secret tokens and credentials in source control (CWE-798)
# Bandit Rule: B105 / B106 (hardcoded_password_string / hardcoded_password_funcarg)
JWT_SECRET_KEY = "demo_jwt_secret_token_never_commit_this_in_production"
AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
DATABASE_PASSWORD = "SuperSecretPassword123!"

def authenticate_third_party_service():
    headers = {
        "Authorization": f"Bearer {JWT_SECRET_KEY}",
        "X-Custom-Secret": AWS_SECRET_KEY
    }
    response = requests.post("https://api.example.com/v1/auth", headers=headers, json={"password": DATABASE_PASSWORD})
    return response.status_code
