import re
from pathlib import Path

# Common patterns for credentials/secrets to redact
SECRET_PATTERNS = [
    # AWS / Generic key patterns
    r'(?i)(AKIA[0-9A-Z]{16})',
    r'(?i)(wJalrXUtnFEMI/[A-Za-z0-9+/=]{30,})',
    # OpenAI and similar keys
    r'sk-[a-zA-Z0-9]{20,}',
    r'Bearer\s+[a-zA-Z0-9\-_.]+',
    # Generic password assignments in quotes
    r'(?i)(password\s*=\s*["\'])([^"\']{4,})(["\'])',
    r'(?i)(secret\s*=\s*["\'])([^"\']{4,})(["\'])',
    r'(?i)(api[_-]?key\s*=\s*["\'])([^"\']{4,})(["\'])',
    r'(?i)(token\s*=\s*["\'])([^"\']{4,})(["\'])',
]

def redact_secrets(text: str) -> str:
    """
    Redacts sensitive credentials, passwords, and tokens before persistence or AI transmission.
    """
    if not text:
        return text

    sanitized = text

    # Redact exact key patterns
    sanitized = re.sub(r'sk-[a-zA-Z0-9]{16,}', '[REDACTED_API_KEY]', sanitized)
    sanitized = re.sub(r'(?i)AKIA[0-9A-Z]{16}', '[REDACTED_AWS_KEY]', sanitized)
    sanitized = re.sub(r'(?i)wJalrXUtnFEMI/[A-Za-z0-9+/=]{30,}', '[REDACTED_AWS_SECRET]', sanitized)

    # Redact assignment patterns
    sanitized = re.sub(
        r'(?i)(password\s*=\s*["\'])([^"\']+)(["\'])',
        r'\1[REDACTED_PASSWORD]\3',
        sanitized
    )
    sanitized = re.sub(
        r'(?i)(secret\s*=\s*["\'])([^"\']+)(["\'])',
        r'\1[REDACTED_SECRET]\3',
        sanitized
    )
    sanitized = re.sub(
        r'(?i)(api[_-]?key\s*=\s*["\'])([^"\']+)(["\'])',
        r'\1[REDACTED_KEY]\3',
        sanitized
    )

    return sanitized

def sanitize_filename(filename: str) -> str:
    """
    Prevents path traversal attacks and cleans uploaded filenames.
    """
    # Extract only the base name (no slashes, dots, path traversal)
    clean_name = Path(filename).name
    # Strip any directory traversal sequence
    clean_name = re.sub(r'[\\/]', '', clean_name)
    clean_name = re.sub(r'^\.+', '', clean_name)
    if not clean_name:
        return "unnamed_source.py"
    return clean_name
