from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scan import Finding, Scan
from app.schemas.finding import (
    AIExplainResponse,
    AIFixRequest,
    AIFixResponse
)
from app.ai.client import ai_service

router = APIRouter()

@router.post("/findings/{finding_id}/explain", response_model=AIExplainResponse)
async def explain_finding(
    finding_id: str,
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding record not found")

    finding_dict = {
        "id": finding.id,
        "rule_id": finding.rule_id,
        "title": finding.title,
        "severity": finding.severity,
        "cwe": finding.cwe,
        "description": finding.description,
        "recommendation": finding.recommendation,
        "evidence": finding.evidence
    }

    scan = db.query(Scan).filter(Scan.id == finding.scan_id).first()
    language = scan.language if scan else "python"

    result = await ai_service.explain_finding(finding_dict, language=language)
    return AIExplainResponse(**result)

@router.post("/findings/{finding_id}/suggest-fix", response_model=AIFixResponse)
async def suggest_fix(
    finding_id: str,
    request: AIFixRequest,
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding record not found")

    if not request.source_context or not request.source_context.strip():
        raise HTTPException(status_code=400, detail="Source code context must be provided to suggest a fix")

    finding_dict = {
        "id": finding.id,
        "rule_id": finding.rule_id,
        "title": finding.title,
        "severity": finding.severity,
        "description": finding.description,
        "recommendation": finding.recommendation,
        "evidence": finding.evidence
    }

    result = await ai_service.suggest_fix(finding_dict, source_context=request.source_context)
    return AIFixResponse(**result)
