import uuid
import time
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.scan import Scan, Finding
from app.schemas.scan import (
    ScanSubmitRequest,
    ScanDetailResponse,
    ScanSummaryResponse,
    RescanRequest,
    RescanComparisonResponse
)
from app.scanners.bandit_scanner import BanditScanner
from app.scanners.normalizer import normalize_bandit_results
from app.core.security import sanitize_filename
from app.core.config import get_settings

router = APIRouter()
bandit_scanner = BanditScanner()
settings = get_settings()

async def _process_and_save_scan(
    code_content: str,
    file_name: str,
    target_language: str,
    db: Session
) -> Scan:
    # Validate non-empty code
    if not code_content.strip():
        raise HTTPException(
            status_code=400,
            detail="Source code cannot be empty."
        )

    # Validate language
    if target_language != "python":
        raise HTTPException(
            status_code=422,
            detail=f"Language '{target_language}' is not currently configured. Supported language: Python (Bandit)."
        )

    # Check scanner availability
    if not await bandit_scanner.is_available():
        raise HTTPException(
            status_code=503,
            detail="Bandit static analysis scanner is not installed or available on this system."
        )

    # Execute static analysis
    scan_id = f"scan_{uuid.uuid4().hex[:12]}"
    start_time = time.time()

    try:
        raw_findings = await bandit_scanner.scan_code(
            code=code_content,
            file_name=file_name,
            language=target_language
        )
    except TimeoutError as te:
        raise HTTPException(status_code=504, detail=str(te))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scanner execution failure: {str(e)}")

    duration_ms = int((time.time() - start_time) * 1000)

    # Normalize findings
    normalized_findings = normalize_bandit_results(raw_findings, scan_id, file_name)

    # Count severities
    crit_count = sum(1 for f in normalized_findings if f["severity"] == "CRITICAL")
    high_count = sum(1 for f in normalized_findings if f["severity"] == "HIGH")
    med_count = sum(1 for f in normalized_findings if f["severity"] == "MEDIUM")
    low_count = sum(1 for f in normalized_findings if f["severity"] == "LOW")
    info_count = sum(1 for f in normalized_findings if f["severity"] == "INFO")

    # Persist Scan record
    scan_record = Scan(
        id=scan_id,
        file_name=file_name,
        language=target_language,
        scanner_name="Bandit",
        scan_status="COMPLETED",
        scan_timestamp=datetime.datetime.now(datetime.timezone.utc),
        duration_ms=duration_ms,
        total_findings=len(normalized_findings),
        critical_count=crit_count,
        high_count=high_count,
        medium_count=med_count,
        low_count=low_count,
        info_count=info_count
    )
    db.add(scan_record)

    # Persist Finding records
    for nf in normalized_findings:
        finding_record = Finding(
            id=nf["id"],
            scan_id=scan_id,
            rule_id=nf["rule_id"],
            title=nf["title"],
            severity=nf["severity"],
            category=nf["category"],
            file_path=nf["file_path"],
            start_line=nf["start_line"],
            end_line=nf["end_line"],
            cwe=nf["cwe"],
            confidence=nf["confidence"],
            scanner_name=nf["scanner_name"],
            description=nf["description"],
            recommendation=nf["recommendation"],
            evidence=nf["evidence"]
        )
        db.add(finding_record)

    db.commit()
    db.refresh(scan_record)
    return scan_record

@router.post("/scans", response_model=ScanDetailResponse)
async def submit_scan_json(
    request: ScanSubmitRequest,
    db: Session = Depends(get_db)
):
    file_name = sanitize_filename(request.file_name or "snippet.py")
    target_language = (request.language or "python").lower()
    return await _process_and_save_scan(request.code, file_name, target_language, db)

@router.post("/scans/upload", response_model=ScanDetailResponse)
async def submit_scan_file(
    file: UploadFile = File(...),
    language: Optional[str] = Form("python"),
    db: Session = Depends(get_db)
):
    raw_name = file.filename or "uploaded_file.py"
    file_name = sanitize_filename(raw_name)

    if not file_name.endswith((".py", ".pyw")):
        raise HTTPException(
            status_code=415,
            detail="Unsupported file format. The initial version currently supports Python (.py) source files."
        )

    content_bytes = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed upload size of {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    try:
        code_content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not valid UTF-8 text."
        )

    target_language = (language or "python").lower()
    return await _process_and_save_scan(code_content, file_name, target_language, db)

@router.get("/scans", response_model=List[ScanSummaryResponse])
def list_scans(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    language: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Scan)
    if language:
        query = query.filter(Scan.language == language.lower())

    scans = query.order_by(desc(Scan.scan_timestamp)).offset(skip).limit(limit).all()
    return scans

@router.get("/scans/{scan_id}", response_model=ScanDetailResponse)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan report not found")
    return scan

@router.delete("/scans/{scan_id}")
def delete_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan record not found")

    db.delete(scan)
    db.commit()
    return {"message": "Scan and associated findings deleted successfully", "id": scan_id}

@router.post("/scans/{scan_id}/rescan", response_model=RescanComparisonResponse)
async def rescan_code(
    scan_id: str,
    request: RescanRequest,
    db: Session = Depends(get_db)
):
    original_scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not original_scan:
        raise HTTPException(status_code=404, detail="Original scan report not found")

    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Rescan source code cannot be empty")

    new_scan_id = f"scan_{uuid.uuid4().hex[:12]}"
    start_time = time.time()

    raw_findings = await bandit_scanner.scan_code(
        code=request.code,
        file_name=original_scan.file_name,
        language=original_scan.language
    )
    duration_ms = int((time.time() - start_time) * 1000)

    new_normalized = normalize_bandit_results(raw_findings, new_scan_id, original_scan.file_name)

    crit_count = sum(1 for f in new_normalized if f["severity"] == "CRITICAL")
    high_count = sum(1 for f in new_normalized if f["severity"] == "HIGH")
    med_count = sum(1 for f in new_normalized if f["severity"] == "MEDIUM")
    low_count = sum(1 for f in new_normalized if f["severity"] == "LOW")
    info_count = sum(1 for f in new_normalized if f["severity"] == "INFO")

    new_scan_record = Scan(
        id=new_scan_id,
        file_name=original_scan.file_name,
        language=original_scan.language,
        scanner_name="Bandit",
        scan_status="COMPLETED",
        scan_timestamp=datetime.datetime.now(datetime.timezone.utc),
        duration_ms=duration_ms,
        total_findings=len(new_normalized),
        critical_count=crit_count,
        high_count=high_count,
        medium_count=med_count,
        low_count=low_count,
        info_count=info_count
    )
    db.add(new_scan_record)

    for nf in new_normalized:
        fr = Finding(
            id=nf["id"],
            scan_id=new_scan_id,
            rule_id=nf["rule_id"],
            title=nf["title"],
            severity=nf["severity"],
            category=nf["category"],
            file_path=nf["file_path"],
            start_line=nf["start_line"],
            end_line=nf["end_line"],
            cwe=nf["cwe"],
            confidence=nf["confidence"],
            scanner_name=nf["scanner_name"],
            description=nf["description"],
            recommendation=nf["recommendation"],
            evidence=nf["evidence"]
        )
        db.add(fr)

    db.commit()
    db.refresh(new_scan_record)

    old_rules = {f.title: f.rule_id for f in original_scan.findings}
    new_rules = {f["title"]: f["rule_id"] for f in new_normalized}

    resolved = [f"{title} ({rule_id})" for title, rule_id in old_rules.items() if title not in new_rules]
    persisting = [f"{title} ({rule_id})" for title, rule_id in new_rules.items() if title in old_rules]
    new_issues = [f"{title} ({rule_id})" for title, rule_id in new_rules.items() if title not in old_rules]

    diff_message = (
        f"Rescan complete: {len(resolved)} finding(s) no longer detected by configured checks, "
        f"{len(persisting)} persisting, {len(new_issues)} new finding(s)."
    )

    return RescanComparisonResponse(
        previous_scan_id=original_scan.id,
        new_scan_id=new_scan_record.id,
        resolved_findings=resolved,
        persisting_findings=persisting,
        new_findings=new_issues,
        new_scan=new_scan_record,
        message=diff_message
    )
