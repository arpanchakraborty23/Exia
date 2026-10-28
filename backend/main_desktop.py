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

# Safe stream sink for PyInstaller GUI mode (when console=False sys.stdout/stderr are None)
class SafeWriter:
    def write(self, s):
        pass
    def flush(self):
        pass
    def isatty(self):
        return False

if sys.stdout is None:
    sys.stdout = SafeWriter()
if sys.stderr is None:
    sys.stderr = SafeWriter()

APPDATA_DIR = Path(os.environ.get("APPDATA", Path.home())) / "Exia"
try:
    APPDATA_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    APPDATA_DIR = Path.home() / ".exia"
    try:
        APPDATA_DIR.mkdir(parents=True, exist_ok=True)
    except Exception:
        APPDATA_DIR = Path(".")

DESKTOP_LOG = APPDATA_DIR / "exia_desktop.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
)
logger = logging.getLogger("exia_desktop")
try:
    file_handler = logging.FileHandler(DESKTOP_LOG, encoding="utf-8", mode="a")
    file_handler.setFormatter(logging.Formatter("%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"))
    logger.addHandler(file_handler)
except Exception:
    pass

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
from src.services import seed_database_if_empty

# Track setup state in memory
IS_CONFIGURED: bool = is_system_configured()


def _background_seed():
    """Seeds default records in a background thread so ASGI startup is instantaneous."""
    try:
        time.sleep(0.5)
        seed_database_if_empty()
    except Exception as e:
        logger.warning("Auto-seed error in background: %s", e)


@asynccontextmanager
async def lifespan(application: FastAPI):
    logger.info("Initializing Exia Desktop Application...")
    # Seed in background so we NEVER block ASGI startup or lifespan!
    threading.Thread(target=_background_seed, daemon=True).start()
    yield
    logger.info("Exia Desktop Application stopped.")


app = FastAPI(
    title="Exia Desktop",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

@app.get("/api/docs", include_in_schema=False)
def api_docs_redirect():
    return RedirectResponse(url="/docs")

@app.get("/api/openapi.json", include_in_schema=False)
def api_openapi_redirect():
    return RedirectResponse(url="/openapi.json")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_origins=[
        "http://127.0.0.1:12568",
        "http://localhost:12568",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "null",
    ],
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
        if bundled.exists() and (bundled / "index.html").exists():
            return bundled

    # 2. Local backend/dist (only if it contains a real static export)
    backend_dist = BACKEND_DIR / "dist"
    if backend_dist.exists() and (backend_dist / "index.html").exists():
        return backend_dist

    # 3. Next.js static export: frontend/out (next build with output: 'export')
    frontend_out = BACKEND_DIR.parent / "frontend" / "out"
    if frontend_out.exists() and (frontend_out / "index.html").exists():
        return frontend_out

    # 4. Development frontend/dist fallback
    frontend_dist = BACKEND_DIR.parent / "frontend" / "dist"
    if frontend_dist.exists() and (frontend_dist / "index.html").exists():
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
    # Allow API endpoints, docs, and schema to pass through to FastAPI native handlers
    clean_strip = full_path.lstrip("/")
    if (
        clean_strip.startswith("api")
        or clean_strip.startswith("docs")
        or clean_strip.startswith("redoc")
        or clean_strip.startswith("openapi")
    ):
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Not Found"})

    # If system is not configured yet, present the setup pre-flight page
    global IS_CONFIGURED
    if not IS_CONFIGURED:
        IS_CONFIGURED = is_system_configured()

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


DESKTOP_PORT = 12568


def find_available_port(preferred_port: int = 12568, max_tries: int = 10) -> int:
    import socket
    for p in range(preferred_port, preferred_port + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    return preferred_port


def _start_uvicorn(port: int = DESKTOP_PORT):
    """Runs Uvicorn server in a background daemon thread."""
    import uvicorn

    try:
        config = uvicorn.Config(
            app=app,
            host="127.0.0.1",
            port=port,
            log_level="warning",
            loop="asyncio",
        )
        server = uvicorn.Server(config)
        server.install_signal_handlers = lambda: None
        server.run()
    except Exception as e:
        logger.exception("Fatal error in Uvicorn background server thread: %s", e)


def _wait_for_server(url: str, timeout: float = 20.0) -> bool:
    """Waits for local server to report healthy status."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=0.8) as res:
                if res.status == 200:
                    return True
        except Exception:
            time.sleep(0.1)
    return False


def main():
    """Desktop Application Entrypoint."""
    global DESKTOP_PORT

    # Determine available port
    DESKTOP_PORT = find_available_port(12568)

    # Set Windows AppUserModelID so taskbar groups properly with its own icon
    if sys.platform == "win32":
        try:
            import ctypes
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("exia.desktop.app")
        except Exception:
            pass

    logger.info("Starting Exia Desktop Service on http://127.0.0.1:%d", DESKTOP_PORT)

    # 1. Start local ASGI server on specified port
    server_thread = threading.Thread(target=_start_uvicorn, args=(DESKTOP_PORT,), daemon=True)
    server_thread.start()

    # 2. Wait until healthy
    health_url = f"http://127.0.0.1:{DESKTOP_PORT}/api/health"
    server_ready = _wait_for_server(health_url, timeout=20.0)

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
            icon_path = str(c.resolve())
            break

    # 4. If server failed to start, present diagnostic screen instead of ERR_CONNECTION_REFUSED
    if not server_ready or not server_thread.is_alive():
        logger.error("Failed to start local background server within timeout.")
        error_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Exia - Startup Error</title>
<style>
body {{ background: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
.card {{ background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; max-width: 540px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
h2 {{ color: #ef4444; margin-top: 0; }}
p {{ color: #a1a1aa; line-height: 1.5; font-size: 14px; }}
code {{ background: #27272a; padding: 6px 10px; border-radius: 6px; font-size: 13px; color: #38bdf8; display: block; margin: 12px 0; word-break: break-all; text-align: left; }}
button {{ background: #2563eb; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 16px; }}
button:hover {{ background: #1d4ed8; }}
</style>
</head>
<body>
<div class="card">
  <h2>Unable to Start Exia Service</h2>
  <p>The local Exia background service could not bind to port {DESKTOP_PORT} within 20 seconds.</p>
  <p>Diagnostic details have been recorded in your desktop log file:</p>
  <code>{DESKTOP_LOG}</code>
  <button onclick="location.reload()">Retry Connection</button>
</div>
</body>
</html>"""
        try:
            import webview
            webview.create_window(
                title="Exia - Startup Error",
                html=error_html,
                width=640,
                height=480,
                background_color="#09090b",
            )
            webview.start(icon=icon_path)
        except Exception:
            pass
        sys.exit(1)

    # 5. Launch Native Desktop Window (WebView2)
    try:
        import webview

        width = 1280
        height = 820
        x = None
        y = None

        try:
            screens = webview.screens
            if screens:
                primary = screens[0]
                x = max(0, int((primary.width - width) / 2))
                y = max(0, int((primary.height - height) / 2))
        except Exception as e:
            logger.debug("Failed to calculate center coordinates: %s", e)

        logger.info("Opening native Edge WebView2 desktop window centered on port %d...", DESKTOP_PORT)
        window = webview.create_window(
            title="Exia",
            url=f"http://127.0.0.1:{DESKTOP_PORT}",
            width=width,
            height=height,
            x=x,
            y=y,
            min_size=(960, 640),
            background_color="#09090b",
        )
        webview.start(icon=icon_path)
        logger.info("Exia desktop window closed by operator. Exiting.")
        sys.exit(0)

    except ImportError:
        logger.warning("pywebview is not installed. Falling back to default browser.")
        import webbrowser
        webbrowser.open(f"http://127.0.0.1:{DESKTOP_PORT}")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            sys.exit(0)


if __name__ == "__main__":
    main()
