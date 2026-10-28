"""
Exia — FastAPI Server Gateway.

The single API server for all UI clients (Web, Android/Capacitor, Windows/Tauri).
The Backend is the ONLY writer of all UI data to MongoDB; the voice agent
never receives UI data and reads user data from the database directly.

Run standalone:
    uvicorn main:app --host 0.0.0.0 --port 8000
    # or: python main.py
"""

import logging
import mimetypes
import os
import sys
import threading
import time
from contextlib import asynccontextmanager
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

# Ensure backend root directory is in sys.path for Vercel Serverless
_BACKEND_DIR = Path(__file__).resolve().parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response

from src.routes.auth import auth_route
from src.routes.mcp import mcp_route
from src.routes.model_config import model_route
from src.routes.prompts import prompt_route
from src.routes.sessions import session_route
from src.routes.token import api_router
from src.services import seed_database_if_empty

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
)
logger = logging.getLogger("exia")


def _background_seed():
    """Seeds default records in a background thread so ASGI startup is instantaneous."""
    try:
        time.sleep(0.5)
        seed_database_if_empty()
    except Exception as e:
        logger.warning("Auto-seed error in background: %s", e)


@asynccontextmanager
async def lifespan(application: FastAPI):
    logger.info("Initializing Exia API server...")
    # Seed in background so we NEVER block ASGI startup or lifespan!
    threading.Thread(target=_background_seed, daemon=True).start()
    yield
    logger.info("Exia API server stopped.")


app = FastAPI(
    title="Exia API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


@app.get("/api/docs", include_in_schema=False)
def api_docs_redirect():
    return RedirectResponse(url="/docs", status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@app.get("/api/openapi.json", include_in_schema=False)
def api_openapi_json_redirect():
    return RedirectResponse(url="/openapi.json", status_code=status.HTTP_307_TEMPORARY_REDIRECT)


# ------------------------------------------------------------------------------
# CORS — default dev origins + shell origins (Capacitor / Tauri) + CORS_ORIGINS env
# ------------------------------------------------------------------------------

_DEFAULT_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:12568",
    "http://localhost:12568",
    # Capacitor Android shell
    "https://localhost",
    "capacitor://localhost",
    # Tauri Windows shell
    "tauri://localhost",
    "http://tauri.localhost",
]

_EXTRA_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_origins=_DEFAULT_ORIGINS + _EXTRA_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin")
    if request.method == "OPTIONS":
        response = Response(status_code=status.HTTP_204_NO_CONTENT)
    else:
        try:
            response = await call_next(request)
        except Exception as e:
            logger.exception("Error processing request: %s", e)
            response = JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": str(e)},
            )

    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
        response.headers["Access-Control-Allow-Headers"] = "*"

    return response


# ------------------------------------------------------------------------------
# Standard REST Routers
# ------------------------------------------------------------------------------

app.include_router(auth_route)
app.include_router(api_router)
app.include_router(mcp_route)
app.include_router(prompt_route)
app.include_router(model_route)
app.include_router(session_route)


@app.get("/api/health", tags=["Health"], status_code=status.HTTP_200_OK)
def health_check() -> Dict[str, str]:
    return {"status": "ok", "target": "server"}


# ------------------------------------------------------------------------------
# Static File & SPA Resolver (serves the built ui/web export when present)
# ------------------------------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parent


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




if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "8000")),
    )
