import json
import logging
import os
import subprocess
import sys
import tempfile

logger = logging.getLogger(__name__)


class BanditScanner:
    """Run Bandit to identify potential Python security issues."""

    def __init__(self):
        self.python_executable = sys.executable

    def is_available(self):
        """Check whether Bandit is installed and working."""
        try:
            process = subprocess.run(
                [
                    self.python_executable,
                    "-m",
                    "bandit",
                    "--version",
                ],
                capture_output=True,
                text=True,
                timeout=10,
            )

            return process.returncode == 0

        except (subprocess.TimeoutExpired, OSError) as exc:
            logger.warning("Bandit availability check failed: %s", exc)
            return False

    def scan(self, code):
        """Scan Python source code and return structured findings."""
        temp_path = None

        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".py",
                encoding="utf-8",
                delete=False,
            ) as temp_file:
                temp_file.write(code)
                temp_path = temp_file.name

            process = subprocess.run(
                [
                    self.python_executable,
                    "-m",
                    "bandit",
                    "-f",
                    "json",
                    "-q",
                    temp_path,
                ],
                capture_output=True,
                text=True,
                timeout=30,
            )

            # Bandit can return a non-zero exit code when findings exist.
            # Therefore, parse its JSON output instead of treating every
            # non-zero return code as a scanner failure.
            if not process.stdout.strip():
                logger.error(
                    "Bandit produced no JSON output. stderr: %s",
                    process.stderr,
                )
                return {
                    "success": False,
                    "findings": [],
                    "error": "Bandit did not return scan results.",
                }

            try:
                report = json.loads(process.stdout)
            except json.JSONDecodeError:
                logger.error(
                    "Could not parse Bandit JSON output. stderr: %s",
                    process.stderr,
                )
                return {
                    "success": False,
                    "findings": [],
                    "error": "Invalid JSON returned by Bandit.",
                }

            findings = []

            for result in report.get("results", []):
                findings.append(
                    {
                        "test_id": result.get("test_id"),
                        "test_name": result.get("test_name"),
                        "issue_text": result.get("issue_text"),
                        "issue_severity": result.get("issue_severity"),
                        "issue_confidence": result.get("issue_confidence"),
                        "line_number": result.get("line_number"),
                        "filename": result.get("filename"),
                        "more_info": result.get("more_info"),
                    }
                )

            return {
                "success": True,
                "findings": findings,
                "metrics": report.get("metrics", {}),
            }

        except subprocess.TimeoutExpired:
            logger.warning("Bandit scan timed out.")
            return {
                "success": False,
                "findings": [],
                "error": "Bandit scan timed out.",
            }

        except OSError as exc:
            logger.exception("Could not execute Bandit.")
            return {
                "success": False,
                "findings": [],
                "error": str(exc),
            }

        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except OSError:
                    logger.warning(
                        "Could not remove temporary file: %s",
                        temp_path,
                    )