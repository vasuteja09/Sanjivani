from pydantic import BaseModel, ConfigDict
from typing import Optional

class FindingBase(BaseModel):
    rule_id: Optional[str] = None
    title: str
    severity: str
    category: Optional[str] = None
    file_path: Optional[str] = None
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    cwe: Optional[str] = None
    confidence: Optional[str] = None
    scanner_name: Optional[str] = "Bandit"
    description: Optional[str] = None
    recommendation: Optional[str] = None
    evidence: Optional[str] = None

class FindingCreate(FindingBase):
    id: str
    scan_id: str

class FindingResponse(FindingBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    scan_id: str

class AIExplainResponse(BaseModel):
    finding_id: str
    ai_available: bool
    vulnerability_explanation: str
    impact: str
    remediation_approach: str
    safe_code_example: Optional[str] = None
    limitations: Optional[str] = None
    disclaimer: str = "This explanation is AI-assisted. Always verify security fixes in your specific runtime environment."
    fallback_reason: Optional[str] = None

class AIFixRequest(BaseModel):
    source_context: str

class AIFixResponse(BaseModel):
    finding_id: str
    ai_available: bool
    original_snippet: str
    suggested_code: str
    explanation_of_changes: str
    limitations: Optional[str] = None
    disclaimer: str = "AI-suggested remediation. Test and review code changes before deployment."
    fallback_reason: Optional[str] = None
