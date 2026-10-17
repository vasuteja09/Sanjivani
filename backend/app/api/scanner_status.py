from fastapi import APIRouter
from app.schemas.scan import ScannerStatusResponse
from app.scanners.bandit_scanner import BanditScanner
from app.core.config import get_settings

router = APIRouter()
bandit = BanditScanner()
settings = get_settings()

@router.get("/scanner/status", response_model=ScannerStatusResponse)
async def get_scanner_status():
    available = await bandit.is_available()
    version = await bandit.get_version() if available else "Unavailable"

    return ScannerStatusResponse(
        scanner_available=available,
        scanner_name="Bandit Security Linter",
        scanner_version=version,
        supported_languages=["python"],
        max_upload_size_mb=settings.MAX_UPLOAD_SIZE_MB,
        scan_timeout_seconds=settings.SCAN_TIMEOUT_SECONDS
    )
