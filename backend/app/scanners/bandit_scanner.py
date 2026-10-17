import sys
import os
import json
import asyncio
import tempfile
import logging
from typing import List, Dict, Any
from app.scanners.base import BaseScanner
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class BanditScanner(BaseScanner):
    def __init__(self):
        self.python_executable = sys.executable

    async def is_available(self) -> bool:
        try:
            process = await asyncio.create_subprocess_exec(
                self.python_executable, "-m", "bandit", "--version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await process.communicate()
            return process.returncode == 0 and b"bandit" in stdout.lower()
        except Exception as e:
            logger.error(f"Bandit availability check failed: {e}")
            return False

    async def get_version(self) -> str:
        try:
            process = await asyncio.create_subprocess_exec(
                self.python_executable, "-m", "bandit", "--version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await process.communicate()
            output = stdout.decode().strip()
            return output.splitlines()[0] if output else "1.9.4"
        except Exception:
            return "1.9.4"

    async def scan_code(self, code: str, file_name: str, language: str) -> List[Dict[str, Any]]:
        if language.lower() != "python":
            raise ValueError(f"Bandit scanner only supports Python, requested: {language}")

        # Securely create isolated temporary file
        fd, temp_path = tempfile.mkstemp(prefix="sanjivani_scan_", suffix=".py")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(code)

            cmd = [
                self.python_executable,
                "-m",
                "bandit",
                "-r",
                temp_path,
                "-f",
                "json",
                "-q"
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            try:
                stdout_data, stderr_data = await asyncio.wait_for(
                    process.communicate(),
                    timeout=settings.SCAN_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                try:
                    process.kill()
                except Exception:
                    pass
                raise TimeoutError(f"Static code scan timed out after {settings.SCAN_TIMEOUT_SECONDS}s")

            # Parse JSON output (Bandit returns exitcode 0 when 0 findings, 1 when findings exist)
            raw_output = stdout_data.decode("utf-8", errors="replace").strip()
            if not raw_output:
                # Check stderr for parsing/syntax errors
                err_text = stderr_data.decode("utf-8", errors="replace").strip()
                if "syntaxerror" in err_text.lower():
                    logger.warning(f"Python syntax error in submitted code: {err_text}")
                    return []
                return []

            try:
                bandit_json = json.loads(raw_output)
            except json.JSONDecodeError as jde:
                logger.error(f"Failed to parse Bandit JSON output: {jde}, stdout={raw_output[:200]}")
                return []

            results = bandit_json.get("results", [])
            return results

        finally:
            # Guarantee cleanup of temporary file
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_path}: {e}")
