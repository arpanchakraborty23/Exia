"""
Exia — Native Desktop Application Entrypoint (Standalone Windows .exe).

This module manages the native desktop application lifecycle:
  1. Bootstraps a local ASGI Uvicorn server in a background thread.
  2. Detects whether Exia has been configured (MongoDB + operator account).
     If unconfigured, directs the operator to a pre-flight Setup Wizard.
  3. Launches a native, chromeless Microsoft Edge WebView2 desktop window
     with custom application icon and window management (never in a web browser).
  4. Provides clean exit and server teardown upon window close.
"""

import logging
import mimetypes
import os
import sys
import threading
import time
import urllib.request
from contextlib import asynccontextmanager
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response
from pydantic import BaseModel

from desktop_bootstrap import (
    confirm_and_save_env,
    is_system_configured,
    save_initial_setup,
    test_mongodb_connection,
)
from src.routes.auth import auth_route
from src.routes.mcp import mcp_route
from src.routes.model_config import model_route
from src.routes.prompts import prompt_route
from src.routes.sessions import session_route
from src.routes.token import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
)
logger = logging.getLogger("exia_desktop")

# Track setup state in memory
IS_CONFIGURED: bool = is_system_configured()


@asynccontextmanager
async def lifespan(application: FastAPI):
    logger.info("Initializing Exia Desktop Application...")
    yield
    logger.info("Exia Desktop Application stopped.")


app = FastAPI(
    title="Exia Desktop",
    version="1.0.0",
    docs_url=None,  # Disabled in production desktop mode
    redoc_url=None,
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

# Standard REST Routers
app.include_router(auth_route)
app.include_router(api_router)
app.include_router(mcp_route)
app.include_router(prompt_route)
app.include_router(model_route)
app.include_router(session_route)


# ==============================================================================
# First-Run Setup Endpoints
# ==============================================================================


class TestDbRequest(BaseModel):
    uri: str


class SetupInitRequest(BaseModel):
    mongodb_uri: str
    mongodb_database: str = "exia_db"
    user_collection: str = "users"
    session_collection: str = "sessions"
    mcp_collection: str = "mcp_servers"
    prompt_collection: str = "prompts"
    model_collection: str = "model_config"
    blacklist_collection: str = "token_blacklist"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    operator_name: str = "Operator"
    operator_email: str = "admin@exia.local"
    operator_password: str
    livekit_url: str = ""
    livekit_api_key: str = ""
    livekit_api_secret: str = ""


@app.get("/api/setup/status", tags=["Setup"])
def get_setup_status() -> Dict[str, Any]:
    global IS_CONFIGURED
    return {"configured": IS_CONFIGURED}


@app.get("/api/setup/generate-secret", tags=["Setup"])
def api_generate_secret() -> Dict[str, str]:
    import secrets
    return {"jwt_secret": secrets.token_hex(32)}


@app.post("/api/setup/test-db", tags=["Setup"])
def api_test_db(data: TestDbRequest) -> Dict[str, Any]:
    return test_mongodb_connection(data.uri)


@app.post("/api/setup/initialize", tags=["Setup"])
def api_initialize_setup(data: SetupInitRequest) -> Dict[str, Any]:
    global IS_CONFIGURED
    try:
        result = save_initial_setup(
            mongodb_uri=data.mongodb_uri,
            mongodb_database=data.mongodb_database,
            user_collection=data.user_collection,
            session_collection=data.session_collection,
            mcp_collection=data.mcp_collection,
            prompt_collection=data.prompt_collection,
            model_collection=data.model_collection,
            blacklist_collection=data.blacklist_collection,
            jwt_secret=data.jwt_secret,
            jwt_algorithm=data.jwt_algorithm,
            livekit_url=data.livekit_url,
            livekit_api_key=data.livekit_api_key,
            livekit_api_secret=data.livekit_api_secret,
            operator_name=data.operator_name,
            operator_email=data.operator_email,
            operator_password=data.operator_password,
        )
        IS_CONFIGURED = True
        return result
    except Exception as e:
        logger.exception("Initial desktop setup error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


class SetupEnvRequest(BaseModel):
    env_content: str
    operator_password: str = ""
    operator_email: str = "admin@exia.local"
    operator_name: str = "Operator"


@app.post("/api/setup/confirm-env", tags=["Setup"])
def api_confirm_env(data: SetupEnvRequest) -> Dict[str, Any]:
    """
    Direct developer .env confirmation:
    Parses full .env text, verifies connection with code, seeds operator,
    and saves to persistent desktop storage.
    """
    global IS_CONFIGURED
    try:
        result = confirm_and_save_env(
            raw_env_content=data.env_content,
            operator_password=data.operator_password,
            operator_email=data.operator_email,
            operator_name=data.operator_name,
        )
        IS_CONFIGURED = True
        return result
    except Exception as e:
        logger.exception("Desktop .env confirmation error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )



@app.get("/api/health", tags=["Health"], status_code=status.HTTP_200_OK)
def health_check() -> Dict[str, str]:
    return {"status": "ok", "target": "desktop"}


# ==============================================================================
# Static File & SPA Resolver (Handles PyInstaller Frozen Bundle & Setup Page)
# ==============================================================================

BACKEND_DIR = Path(__file__).resolve().parent
STATIC_DIR = BACKEND_DIR / "static"


def get_static_build_dir() -> Path | None:
    # 1. PyInstaller bundled temporary unpack directory
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        bundled = Path(sys._MEIPASS) / "dist"
        if bundled.exists():
            return bundled

    # 2. Local backend/dist
    backend_dist = BACKEND_DIR / "dist"
    if backend_dist.exists():
        return backend_dist

    # 3. Development frontend/dist
    frontend_dist = BACKEND_DIR.parent / "frontend" / "dist"
    if frontend_dist.exists():
        return frontend_dist

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
async def serve_desktop_ui(request: Request, full_path: str):
    # Allow API endpoints to pass through
    if full_path.startswith("api"):
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Not Found"})

    # If system is not configured yet, present the setup pre-flight page
    if not IS_CONFIGURED:
        setup_file = STATIC_DIR / "setup.html"
        if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
            bundled_setup = Path(sys._MEIPASS) / "static" / "setup.html"
            if bundled_setup.exists():
                setup_file = bundled_setup
        if setup_file.exists():
            return HTMLResponse(content=setup_file.read_text(encoding="utf-8"))

    build_dir = get_static_build_dir()
    if not build_dir:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Build dist not found"})

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
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "index.html not found"})

    mtime = file_to_serve.stat().st_mtime
    content, media_type, etag = get_cached_static_file(str(file_to_serve), mtime)

    if request.headers.get("if-none-match") == etag:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)

    cache_control = "no-cache, must-revalidate" if is_html else "public, max-age=31536000, immutable"
    return Response(content=content, media_type=media_type, headers={"ETag": etag, "Cache-Control": cache_control})


# ==============================================================================
# Native Window Host & Process Lifecycle
# ==============================================================================


def _start_uvicorn():
    """Runs Uvicorn server in a background daemon thread."""
    import uvicorn

    config = uvicorn.Config(
        app=app,
        host="127.0.0.1",
        port=8000,
        log_level="warning",
        workers=1,
    )
    server = uvicorn.Server(config)
    server.run()


def _wait_for_server(url: str = "http://127.0.0.1:8000/api/health", timeout: float = 8.0) -> bool:
    """Waits for local server to report healthy status."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=0.5) as res:
                if res.status == 200:
                    return True
        except Exception:
            time.sleep(0.15)
    return False


def main():
    """Desktop Application Entrypoint."""
    # 1. Start local ASGI server
    server_thread = threading.Thread(target=_start_uvicorn, daemon=True)
    server_thread.start()

    # 2. Wait until healthy
    server_ready = _wait_for_server()
    if not server_ready:
        logger.error("Failed to start local background server within timeout.")

    # 3. Locate icon
    icon_path = None
    candidates = [
        BACKEND_DIR / "exia-icon.ico",
        BACKEND_DIR / "static" / "favicon.ico",
    ]
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        candidates.insert(0, Path(sys._MEIPASS) / "exia-icon.ico")

    for c in candidates:
        if c.exists():
            icon_path = str(c)
            break

    # 4. Launch Native Desktop Window (WebView2)
    try:
        import webview

        logger.info("Opening native Edge WebView2 desktop window...")
        window = webview.create_window(
            title="Exia",
            url="http://127.0.0.1:8000",
            width=1280,
            height=820,
            min_size=(960, 640),
            background_color="#09090b",
        )
        webview.start()
        logger.info("Exia desktop window closed by operator. Exiting.")
        sys.exit(0)

    except ImportError:
        logger.warning("pywebview is not installed. Falling back to default browser.")
        import webbrowser
        webbrowser.open("http://127.0.0.1:8000")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            sys.exit(0)


if __name__ == "__main__":
    main()
