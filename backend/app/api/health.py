import datetime
from fastapi import APIRouter
from app.schemas.scan import HealthResponse
from app.ai.client import ai_service
from app.scanners.bandit_scanner import BanditScanner

router = APIRouter()
bandit = BanditScanner()

@router.get("/health", response_model=HealthResponse)
async def get_health():
    scanner_available = await bandit.is_available()
    ai_configured = ai_service.is_configured()

    return HealthResponse(
        status="ok",
        version="1.0.0",
        ai_configured=ai_configured,
        scanner_available=scanner_available,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
