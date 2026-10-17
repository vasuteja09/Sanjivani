import uuid
from typing import List, Dict, Any
from app.core.security import redact_secrets

RULE_METADATA = {
    "B608": {
        "title": "Potential SQL Injection (String Query)",
        "category": "SQL Injection",
        "cwe": "CWE-89: Improper Neutralization of Special Elements used in an SQL Command",
        "recommendation": "Use parameterized queries or ORM query builders instead of raw string concatenation. Never concatenate untrusted user inputs directly into SQL statements."
    },
    "B605": {
        "title": "Starting Process With a Shell",
        "category": "Command Injection",
        "cwe": "CWE-78: Improper Neutralization of Special Elements used in an OS Command",
        "recommendation": "Avoid using os.system(). Use the subprocess module with shell=False and pass arguments as a list of validated tokens."
    },
    "B602": {
        "title": "Subprocess Invocation with shell=True",
        "category": "Command Injection",
        "cwe": "CWE-78: Improper Neutralization of Special Elements used in an OS Command",
        "recommendation": "Set shell=False when calling subprocess methods (e.g., subprocess.run(['cmd', arg], shell=False)). Validate and sanitize all external inputs."
    },
    "B105": {
        "title": "Hardcoded Password String Detected",
        "category": "Hardcoded Secret",
        "cwe": "CWE-798: Use of Hard-coded Credentials",
        "recommendation": "Store secrets, credentials, and tokens in environment variables or a secure secret manager (e.g., AWS Secrets Manager, HashiCorp Vault), not in source code."
    },
    "B106": {
        "title": "Hardcoded Password in Function Argument",
        "category": "Hardcoded Secret",
        "cwe": "CWE-798: Use of Hard-coded Credentials",
        "recommendation": "Do not pass hardcoded credentials into function arguments. Retrieve values dynamically from environment variables using os.getenv()."
    },
    "B113": {
        "title": "HTTP Request Without Timeout",
        "category": "Denial of Service",
        "cwe": "CWE-400: Uncontrolled Resource Consumption",
        "recommendation": "Always specify a timeout parameter (e.g., requests.get(url, timeout=10)) to prevent thread exhaustion if the target host hangs."
    },
    "B404": {
        "title": "Subprocess Module Import Warning",
        "category": "Process Execution",
        "cwe": "CWE-78: OS Command Injection",
        "recommendation": "Audit all usages of subprocess functions in this file. Ensure inputs are never passed through a shell interpreter."
    },
    "B607": {
        "title": "Process Started with Partial Executable Path",
        "category": "Untrusted Search Path",
        "cwe": "CWE-426: Untrusted Search Path",
        "recommendation": "Use the full absolute path to the executable (e.g. /usr/bin/echo or shutil.which()) to prevent binary hijacking."
    },
    "B101": {
        "title": "Assert Used in Production Logic",
        "category": "Logic / Error Handling",
        "cwe": "CWE-617: Reachable Assertion",
        "recommendation": "Do not use assert statements for runtime data validation or authorization checks, as Python strips assertions when run with optimization flags (-O)."
    },
    "B307": {
        "title": "Use of Possibly Insecure Function eval()",
        "category": "Code Injection",
        "cwe": "CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code",
        "recommendation": "Avoid eval() and exec(). Use ast.literal_eval() for safe literal evaluation or parse structured formats like JSON using json.loads()."
    }
}

def normalize_bandit_results(raw_results: List[Dict[str, Any]], scan_id: str, original_filename: str) -> List[Dict[str, Any]]:
    normalized_list = []

    for r in raw_results:
        test_id = r.get("test_id", "UNKNOWN")
        meta = RULE_METADATA.get(test_id, {})

        severity = r.get("issue_severity", "MEDIUM").upper()
        if severity not in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]:
            severity = "MEDIUM"

        # Determine CWE
        cwe_info = r.get("issue_cwe")
        cwe_str = None
        if isinstance(cwe_info, dict) and "id" in cwe_info:
            cwe_str = f"CWE-{cwe_info['id']}"
        elif meta.get("cwe"):
            cwe_str = meta["cwe"]

        title = meta.get("title") or r.get("test_name", "Security Finding").replace("_", " ").title()
        category = meta.get("category", "General Security")
        recommendation = meta.get("recommendation") or "Review code against secure programming standards and avoid unchecked inputs."

        # Format line range
        line_num = r.get("line_number")
        line_range = r.get("line_range")
        start_line = line_num
        end_line = line_range[-1] if (line_range and len(line_range) > 0) else line_num

        # Redact raw code snippet evidence
        raw_code = r.get("code", "")
        sanitized_evidence = redact_secrets(raw_code)

        normalized_finding = {
            "id": f"find_{uuid.uuid4().hex[:12]}",
            "scan_id": scan_id,
            "rule_id": test_id,
            "title": title,
            "severity": severity,
            "category": category,
            "file_path": original_filename,
            "start_line": start_line,
            "end_line": end_line,
            "cwe": cwe_str,
            "confidence": r.get("issue_confidence", "MEDIUM"),
            "scanner_name": "Bandit",
            "description": r.get("issue_text", ""),
            "recommendation": recommendation,
            "evidence": sanitized_evidence
        }
        normalized_list.append(normalized_finding)

    # Sort findings by start line
    normalized_list.sort(key=lambda x: (x["start_line"] or 0))
    return normalized_list
