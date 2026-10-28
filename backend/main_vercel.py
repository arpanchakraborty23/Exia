"""
Exia — Vercel Serverless Production Entrypoint.

This module initializes the FastAPI application optimized specifically for
Vercel serverless functions, exposing the ASGI `app` instance with CORS,
REST routes, and static SPA fallback routing.
"""

import logging
import mimetypes
import time
from contextlib import asynccontextmanager
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response

from src.routes.auth import auth_route
from src.routes.token import api_router
from src.routes.mcp import mcp_route
from src.routes.prompts import prompt_route
from src.routes.model_config import model_route
from src.routes.sessions import session_route

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
)
logger = logging.getLogger("exia_vercel")

API_VERSION = "1.0.0"
API_TITLE = "Exia - Home Assistant API (Vercel)"


@asynccontextmanager
async def lifespan(application: FastAPI):
    logger.info("Initializing Exia Vercel Serverless Application...")
    yield


app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Register REST Routers
app.include_router(auth_route)
app.include_router(api_router)
app.include_router(mcp_route)
app.include_router(prompt_route)
app.include_router(model_route)
app.include_router(session_route)


@app.get("/api/health", tags=["Health"], status_code=status.HTTP_200_OK)
def health_check() -> Dict[str, str]:
    return {"status": "ok", "target": "vercel"}


# Static SPA routing
BACKEND_DIR = Path(__file__).resolve().parent
BACKEND_DIST = BACKEND_DIR / "dist"
FRONTEND_DIST = BACKEND_DIR.parent / "ui" / "web" / "dist"


def get_static_build_dir() -> Path | None:
    if BACKEND_DIST.exists():
        return BACKEND_DIST
    if FRONTEND_DIST.exists():
        return FRONTEND_DIST
    return None


MIME_TYPE_MAP = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
}


@lru_cache(maxsize=512)
def get_cached_static_file(file_path_str: str, mtime: float) -> tuple[bytes, str, str]:
    path = Path(file_path_str)
    content = path.read_bytes()
    media_type = MIME_TYPE_MAP.get(path.suffix.lower())
    if not media_type:
        guessed, _ = mimetypes.guess_type(path.name)
        media_type = guessed or "application/octet-stream"
    etag = f'"{hash((file_path_str, mtime, len(content)))}"'
    return content, media_type, etag


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend_spa(request: Request, full_path: str):
    if full_path.startswith("api") or full_path in ("docs", "redoc", "openapi.json"):
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Not Found"})

    build_dir = get_static_build_dir()
    if not build_dir:
        return RedirectResponse(url="/api/docs")

    clean_path = full_path.lstrip("/")
    file_to_serve: Path | None = None
    is_html = False

    if clean_path:
        candidate = (build_dir / clean_path).resolve()
        if candidate.is_file() and (candidate == build_dir or build_dir in candidate.parents):
            file_to_serve = candidate
            is_html = candidate.suffix.lower() == ".html"

    if not file_to_serve:
        index_file = build_dir / "index.html"
        if index_file.is_file():
            file_to_serve = index_file
            is_html = True

    if not file_to_serve or not file_to_serve.is_file():
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Frontend index.html not found"})

    mtime = file_to_serve.stat().st_mtime
    content, media_type, etag = get_cached_static_file(str(file_to_serve), mtime)

    if request.headers.get("if-none-match") == etag:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)

    cache_control = "no-cache, must-revalidate" if is_html else "public, max-age=31536000, immutable"
    return Response(content=content, media_type=media_type, headers={"ETag": etag, "Cache-Control": cache_control})
