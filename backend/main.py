"""
LifeSync AI — FastAPI Backend Application
Intelligent Personal Life Operations Assistant
HACK2SKILL Prompt Wars — Winning Proposal

Architecture: Service-oriented, async, mock-testable, SOLID principles.
Security: OAuth 2.0 minimal scopes, JWT sessions, no external data storage.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import time

from config import settings
from routers.auth_router import router as auth_router
from routers.dashboard_router import router as dashboard_router
from routers.feature_routers import (
    email_router,
    calendar_router,
    ai_router,
    tasks_router,
)
from routers.drive_router import router as drive_router
from routers.finance_router import router as finance_router
from routers.maps_router import router as maps_router
from routers.fit_router import router as fit_router
from routers.docs_router import router as docs_router
from routers.review_router import router as review_router
from routers.forms_router import router as forms_router

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("lifesync")

# ── Rate limiting ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="LifeSync AI API",
    description="""Built by Shanmukh Datta — 2026

**LifeSync AI** — Intelligent Personal Life Operations Assistant

Powered by 10 Google APIs + Google Gemini AI.
Built for HACK2SKILL Prompt Wars.

## Features
- 🧠 Proactive AI briefings with Gemini
- 📧 Gmail intelligence: action extraction, smart replies, inbox zero
- 📅 Calendar co-pilot: conflict detection, focus blocking, backplanning
- 📁 Drive intelligence: pre-meeting doc surfacing
- ✅ Tasks: natural language creation, priority scoring
- 💡 AI command engine: multi-step workflow chaining

## Auth
All endpoints require Bearer JWT token from `/api/auth/login` flow.
In development/mock mode, auth is bypassed automatically.
""",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── Rate limiting error handler ───────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Request timing middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - start) * 1000
    response.headers["X-Process-Time-Ms"] = f"{duration:.2f}"
    return response

# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "path": str(request.url)},
    )

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(email_router)
app.include_router(calendar_router)
app.include_router(ai_router)
app.include_router(tasks_router)
app.include_router(drive_router)
app.include_router(finance_router)
app.include_router(maps_router)
app.include_router(fit_router)
app.include_router(docs_router)
app.include_router(review_router)
app.include_router(forms_router)

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for deployment monitoring."""
    from config import settings as s
    return {
        "status": "healthy",
        "app": s.app_name,
        "version": s.app_version,
        "environment": s.environment,
        "mock_mode": not bool(s.google_client_id and s.gemini_api_key),
        "apis_configured": {
            "google_oauth": bool(s.google_client_id),
            "gemini_ai": bool(s.gemini_api_key),
        },
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "LifeSync AI API — Not just an assistant. A life operating system.",
        "docs": "/api/docs",
        "health": "/api/health",
    }

# ── Dev server entry point ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower(),
    )
