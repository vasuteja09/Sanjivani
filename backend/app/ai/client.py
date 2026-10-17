import json
import logging
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
from app.core.config import get_settings
from app.core.security import redact_secrets
from app.ai.prompts import (
    EXPLAIN_SYSTEM_PROMPT,
    EXPLAIN_USER_TEMPLATE,
    FIX_SYSTEM_PROMPT,
    FIX_USER_TEMPLATE
)

logger = logging.getLogger(__name__)
settings = get_settings()

class AIService:
    def __init__(self):
        self.settings = get_settings()

    def is_configured(self) -> bool:
        return bool(self.settings.AI_API_KEY and self.settings.AI_API_KEY.strip())

    async def explain_finding(self, finding: Dict[str, Any], language: str = "python") -> Dict[str, Any]:
        """
        Generates an AI-assisted explanation or falls back to rule-based explanation if AI is not configured.
        """
        if not self.is_configured():
            return self._generate_fallback_explanation(finding, "AI API key is not configured in backend .env")

        try:
            client = AsyncOpenAI(
                api_key=self.settings.AI_API_KEY,
                base_url=self.settings.AI_BASE_URL,
                timeout=15.0
            )

            sanitized_evidence = redact_secrets(finding.get("evidence", ""))
            user_prompt = EXPLAIN_USER_TEMPLATE.format(
                language=language,
                rule_id=finding.get("rule_id", "N/A"),
                title=finding.get("title", "Security Finding"),
                severity=finding.get("severity", "MEDIUM"),
                cwe=finding.get("cwe") or "Unknown CWE",
                description=finding.get("description", ""),
                evidence=sanitized_evidence
            )

            response = await client.chat.completions.create(
                model=self.settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": EXPLAIN_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=800
            )

            content = response.choices[0].message.content
            parsed = json.loads(content)

            return {
                "finding_id": finding.get("id"),
                "ai_available": True,
                "vulnerability_explanation": parsed.get("vulnerability_explanation", finding.get("description", "")),
                "impact": parsed.get("impact", "Potential security weakness if left unmitigated."),
                "remediation_approach": parsed.get("remediation_approach", finding.get("recommendation", "")),
                "safe_code_example": parsed.get("safe_code_example"),
                "limitations": parsed.get("limitations", "Verify behavior within your application runtime environment."),
                "disclaimer": "This explanation was generated with AI assistance. Review before implementing in production.",
                "fallback_reason": None
            }

        except Exception as e:
            logger.warning(f"AI service call failed: {e}")
            return self._generate_fallback_explanation(finding, f"AI service unreachable: {str(e)[:120]}")

    async def suggest_fix(self, finding: Dict[str, Any], source_context: str) -> Dict[str, Any]:
        """
        Generates safe code suggestion or provides a rule-based safe pattern if AI is offline.
        """
        sanitized_context = redact_secrets(source_context)

        if not self.is_configured():
            return self._generate_fallback_fix(finding, sanitized_context, "AI API key not configured")

        try:
            client = AsyncOpenAI(
                api_key=self.settings.AI_API_KEY,
                base_url=self.settings.AI_BASE_URL,
                timeout=20.0
            )

            user_prompt = FIX_USER_TEMPLATE.format(
                title=finding.get("title", "Security Issue"),
                rule_id=finding.get("rule_id", "N/A"),
                severity=finding.get("severity", "MEDIUM"),
                description=finding.get("description", ""),
                source_context=sanitized_context
            )

            response = await client.chat.completions.create(
                model=self.settings.AI_MODEL,
                messages=[
                    {"role": "system", "content": FIX_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=1000
            )

            content = response.choices[0].message.content
            parsed = json.loads(content)

            return {
                "finding_id": finding.get("id"),
                "ai_available": True,
                "original_snippet": sanitized_context,
                "suggested_code": parsed.get("suggested_code", ""),
                "explanation_of_changes": parsed.get("explanation_of_changes", "Remediated vulnerable pattern."),
                "limitations": parsed.get("limitations", "Ensure all calling functions conform to the updated signature."),
                "disclaimer": "AI-suggested remediation. Test and review code changes before deployment.",
                "fallback_reason": None
            }

        except Exception as e:
            logger.warning(f"AI fix suggestion failed: {e}")
            return self._generate_fallback_fix(finding, sanitized_context, f"AI service unreachable: {str(e)[:120]}")

    def _generate_fallback_explanation(self, finding: Dict[str, Any], reason: str) -> Dict[str, Any]:
        rule_id = finding.get("rule_id", "")
        title = finding.get("title", "Security Finding")
        rec = finding.get("recommendation") or "Review code for unvalidated user inputs and unsafe API calls."

        explanations = {
            "B608": "Dynamic string concatenation in SQL expressions bypasses parser syntax validation and allows untrusted inputs to alter database logic.",
            "B605": "os.system() spawns a system shell (e.g., /bin/sh or cmd.exe) which executes command strings with shell meta-character expansion.",
            "B602": "subprocess calls with shell=True delegate execution to the OS shell, allowing attackers to inject arbitrary terminal commands.",
            "B105": "Hardcoding credentials or API keys directly into application source code risks leakage through version control, logs, and compiled artifacts.",
            "B106": "Passing credentials as plaintext function arguments exposes secrets to memory inspection and diagnostic logs.",
            "B113": "HTTP requests without explicit timeouts can hang indefinitely if the remote server fails to respond, causing Denial of Service.",
        }

        impacts = {
            "B608": "Unauthorized data exfiltration, database tampering, privilege escalation, or authentication bypass.",
            "B605": "Arbitrary command execution on the host server under the application's operating system privileges.",
            "B602": "Host system takeover, lateral movement across the infrastructure, and sensitive file compromise.",
            "B105": "Compromised credentials enabling unauthorized access to databases, cloud resources, or payment gateways.",
            "B106": "Secret exposure across internal monitoring, error reporting, and process argument listings.",
            "B113": "Thread exhaustion and complete denial of service for the host application.",
        }

        return {
            "finding_id": finding.get("id"),
            "ai_available": False,
            "vulnerability_explanation": explanations.get(rule_id, f"Static analysis flagged {title}: {finding.get('description', '')}"),
            "impact": impacts.get(rule_id, "Potential security risk or compliance violation in production."),
            "remediation_approach": rec,
            "safe_code_example": None,
            "limitations": "Deterministic explanation provided via built-in security rule database.",
            "disclaimer": "Rule-based static explanation. Configure an AI API key in Settings to enable dynamic AI explanations.",
            "fallback_reason": reason
        }

    def _generate_fallback_fix(self, finding: Dict[str, Any], context: str, reason: str) -> Dict[str, Any]:
        rule_id = finding.get("rule_id", "")
        
        fallback_code = context
        explanation = "Rule-based fix guidance: " + (finding.get("recommendation") or "Apply safe API patterns.")

        if rule_id == "B608":
            fallback_code = (
                "# Safer Parameterized Query Pattern\n"
                "cursor.execute('SELECT * FROM users WHERE id = ?', (user_input_id,))\n"
            )
            explanation = "Replaced string formatting with a parameterized query placeholder (?) to neutralize SQL injection."
        elif rule_id in ["B605", "B602"]:
            fallback_code = (
                "# Safe Subprocess Pattern (shell=False)\n"
                "import subprocess\n"
                "subprocess.run(['command_name', arg1], shell=False, check=True)\n"
            )
            explanation = "Invoked subprocess with shell=False and passed arguments as a structured list to block shell injection."
        elif rule_id in ["B105", "B106"]:
            fallback_code = (
                "# Environment Variable Secret Retrieval Pattern\n"
                "import os\n"
                "API_KEY = os.environ.get('API_KEY', '')\n"
            )
            explanation = "Removed hardcoded secret string and retrieved it dynamically from environment variables."

        return {
            "finding_id": finding.get("id"),
            "ai_available": False,
            "original_snippet": context,
            "suggested_code": fallback_code,
            "explanation_of_changes": explanation,
            "limitations": "Deterministic template provided. Configure AI API key for contextual code synthesis.",
            "disclaimer": "Rule-based template suggestion. Always review and test before deployment.",
            "fallback_reason": reason
        }

ai_service = AIService()
