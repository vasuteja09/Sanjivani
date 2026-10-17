import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.database import init_db
from app.api import health, scanner_status, samples, scans, findings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sanjivani")
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Sanjivani AI Database...")
    init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Shutting down Sanjivani AI backend.")

app = FastAPI(
    title="Sanjivani AI — Secure Code Remediation Platform",
    description="Backend API for static code security analysis and AI-assisted remediation.",
    version="1.0.0",
    lifespan=lifespan
)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# CORS configuration
origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global sanitized exception handler to avoid leaking tracebacks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the request."}
    )

# Mount API routes under /api
app.include_router(health.router, prefix="/api", tags=["System"])
app.include_router(scanner_status.router, prefix="/api", tags=["Scanner"])
app.include_router(samples.router, prefix="/api", tags=["Educational Samples"])
app.include_router(scans.router, prefix="/api", tags=["Scans"])
app.include_router(findings.router, prefix="/api", tags=["Findings"])

@app.get("/")
def root():
    return {
        "project": "Sanjivani AI",
        "tagline": "Detect Vulnerabilities. Understand Risks. Write Safer Code.",
        "status": "operational",
        "docs_url": "/docs"
    }
