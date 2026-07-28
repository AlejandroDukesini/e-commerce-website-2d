"""Application entrypoint. Run with:  python main.py  (or via uvicorn)."""
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.router import api_router
from app.core import audit
from app.core.config import settings
from app.core.headers import SecurityHeadersMiddleware
from app.core.rate_limit import limiter
from app.db.init_db import init_db

audit.configure_logging(settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables + seed demo users.
    init_db()
    audit.logger.info(
        "event=app.startup env=%s docs_enabled=%s seed_demo_users=%s",
        settings.app_env,
        not settings.is_production,
        settings.seed_demo_users,
    )
    yield
    # Shutdown: nothing to tear down for SQLite.


# Interactive docs enumerate every route, schema and auth requirement. That is
# a free reconnaissance map in production, so they are development-only.
_docs_enabled = not settings.is_production

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Backend RBAC + JWT para el template de concesionario interactivo.",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

# --- Security headers (outermost: must wrap error responses too) ---
app.add_middleware(SecurityHeadersMiddleware, enable_hsts=settings.is_production)

# --- Rate limiting wiring ---
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Log throttling events before delegating to slowapi's 429 response.

    A spike here is the primary signal for credential stuffing and scraping.
    """
    audit.log_event(
        audit.RATE_LIMITED, request, limit=str(exc.detail), level=logging.WARNING
    )
    return _rate_limit_exceeded_handler(request, exc)


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception):
    """Never leak a stack trace or ORM/driver detail to the client.

    FastAPI's default 500 page is terse, but any middleware or custom handler
    that stringifies the exception can expose file paths, SQL and library
    versions. The full traceback goes to the server log; the client gets an
    opaque message.
    """
    audit.logger.exception(
        "event=app.unhandled_exception path=%s ip=%s",
        request.url.path,
        audit.client_ip(request),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno del servidor"},
    )


# --- CORS: only the configured frontend origin(s) ---
# Methods/headers were "*". With allow_credentials the browser still requires
# an exact origin match, but an explicit allowlist keeps the preflight surface
# minimal and documents what the API actually accepts.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,
)

# --- Routes ---
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health", tags=["system"])
def health():
    """Liveness probe. Deliberately returns no version/build detail."""
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        # Auto-reload runs a file-watching supervisor and is a development
        # tool only; it must never be on in production.
        reload=not settings.is_production,
        # Don't advertise the server banner.
        server_header=False,
    )
