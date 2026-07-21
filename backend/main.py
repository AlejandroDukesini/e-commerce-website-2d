"""Application entrypoint. Run with:  python main.py  (or via uvicorn)."""
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables + seed demo users.
    init_db()
    yield
    # Shutdown: nothing to tear down for SQLite.


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Backend RBAC + JWT para el template de concesionario interactivo.",
    lifespan=lifespan,
)

# --- Rate limiting wiring ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# --- CORS: only allow the Vite dev origin ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---
app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": settings.app_name}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
