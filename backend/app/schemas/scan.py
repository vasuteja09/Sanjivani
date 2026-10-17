import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.schemas.finding import FindingResponse

class ScanSubmitRequest(BaseModel):
    code: str
    file_name: Optional[str] = "input.py"
    language: Optional[str] = "python"

class ScanSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    file_name: str
    language: str
    scanner_name: str
    scan_status: str
    scan_timestamp: datetime.datetime
    duration_ms: int
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int

class ScanDetailResponse(ScanSummaryResponse):
    model_config = ConfigDict(from_attributes=True)

    findings: List[FindingResponse] = []

class RescanRequest(BaseModel):
    code: str

class RescanComparisonResponse(BaseModel):
    previous_scan_id: str
    new_scan_id: str
    resolved_findings: List[str]
    persisting_findings: List[str]
    new_findings: List[str]
    new_scan: ScanDetailResponse
    message: str

class ScannerStatusResponse(BaseModel):
    scanner_available: bool
    scanner_name: str
    scanner_version: str
    supported_languages: List[str]
    max_upload_size_mb: int
    scan_timeout_seconds: int

class HealthResponse(BaseModel):
    status: str
    version: str
    ai_configured: bool
    scanner_available: bool
    timestamp: datetime.datetime
