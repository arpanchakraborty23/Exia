"""
Main Application Entrypoint for Exia Home Assistant API.

This module initializes the FastAPI application, configures OpenAPI documentation
(Swagger UI, ReDoc, OpenAPI JSON specification), sets up global middleware
(CORS and HTTP request logging with latency tracking), and mounts the API routers
for authentication and LiveKit agent token management.
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import Any, Dict, List
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from src.routes.auth import auth_route
from src.routes.token import api_router
from src.routes.mcp import mcp_route
from src.routes.prompts import prompt_route
from src.routes.model_config import model_route

# ==============================================================================
# Logging Configuration
# ==============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ==============================================================================
# API Metadata & Documentation Configuration
# ==============================================================================

API_VERSION = "1.0.0"

API_TITLE = "Exia - Home Assistant API"

API_DESCRIPTION = """
# Exia Home Assistant API

Welcome to the REST API documentation for **Exia**, an intelligent, multimodal 
Home Assistant backend supporting real-time voice, video, and smart interactions.

---

## Features & Modules

* **Auth**: User account registration, sign-in authentication, JWT refresh token renewal, and password management.
* **Token**: LiveKit WebRTC room session token provisioning for real-time bidirectional agent voice/video streams.
* **Health**: Diagnostic and health check probes for uptime monitoring and infrastructure readiness.

---

## Authentication

Protected endpoints utilize **OAuth2 / HTTP Bearer** JSON Web Tokens (JWT):
1. Authenticate via `POST /api/signin` to receive an `access_token` and `refresh_token`.
2. In this documentation page, click the **Authorize** button (top right).
3. Supply your token in the format: `Bearer <your_access_token>`.
4. Subsequent API calls from Swagger UI will include the `Authorization` header automatically.

---

## Interactive Documentation Links

* **Swagger UI (Interactive API Explorer)**: [`/api/docs`](/api/docs)
* **ReDoc (Detailed Schema Reference)**: [`/api/redoc`](/api/redoc)
* **OpenAPI Schema (JSON)**: [`/api/openapi.json`](/api/openapi.json)
"""

# OpenAPI Tag Metadata for organized categorization in Swagger UI and ReDoc
TAGS_METADATA: List[Dict[str, Any]] = [
    {
        "name": "Auth",
        "description": (
            "Operations for user identity management, registration, credential "
            "authentication, JWT access token renewal, and password updates."
        ),
    },
    {
        "name": "Token",
        "description": (
            "Operations for generating LiveKit WebRTC access tokens and configuring "
            "real-time AI agent audio/video communication sessions."
        ),
    },
    {
        "name": "Health",
        "description": (
            "System telemetry and diagnostic endpoints to verify service availability."
        ),
    },
    {
        "name": "MCP",
        "description":(
            "Operations for mcp servers give access any kind of tools to Exia"
        )
    },
    {
        "name": "Prompts",
        "description": (
            "CRUD operations for user prompt directives (system personas and quick macros)."
        ),
    },
    {
        "name": "Models",
        "description": (
            "Model engine configuration for the voice agent pipeline."
        ),
    },
]

# Swagger UI interactive configuration parameters
SWAGGER_UI_PARAMETERS: Dict[str, Any] = {
    "defaultModelsExpandDepth": 1,
    "persistAuthorization": True,
    "displayRequestDuration": True,
    "docExpansion": "list",
    "filter": True,
}

# ==============================================================================
# Lifespan Event Handlers
# ==============================================================================

@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Handles application startup and shutdown lifecycle events using structured logging.
    """
    logger.info("Initializing Exia API service (Version: %s)...", API_VERSION)
    logger.info("API documentation available at /api/docs and /api/redoc")
    yield
    logger.info("Shutting down Exia API service...")

# ==============================================================================
# FastAPI Application Initialization
# ==============================================================================

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    openapi_tags=TAGS_METADATA,
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/license/mit",
    },
    contact={
        "name": "Arpan Chakraborty",
        "email": "arpanchakraborty500@gmail.com",
    },
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    swagger_ui_parameters=SWAGGER_UI_PARAMETERS,
    lifespan=lifespan,
)

# ==============================================================================
# Middleware Configuration
# ==============================================================================

def register_middleware(application: FastAPI) -> None:
    """
    Registers application-level middleware on the FastAPI instance.

    Configured middlewares:
      1. HTTP Request Logging & Latency Tracker: Logs request method, path,
         client IP, response status code, and latency in seconds.
      2. CORS Middleware: Permits Cross-Origin Resource Sharing for frontend
         web and mobile clients.
    """

    @application.middleware("http")
    async def custom_logging(request: Request, call_next):
        """
        Intercepts incoming HTTP requests to compute execution latency
        and log structured access details using Python's logging module.
        """
        start_time = time.time()

        # Process the request through subsequent middleware / route handlers
        response = await call_next(request)
        processing_time = time.time() - start_time

        client_host = request.client.host if request.client else "unknown"
        client_port = request.client.port if request.client else "unknown"

        log_msg = (
            f"{client_host}:{client_port} - {request.method} {request.url.path} "
            f"- Status: {response.status_code} - Completed in {processing_time:.4f}s"
        )

        # Categorize log levels based on HTTP status codes
        if response.status_code >= 500:
            logger.error(log_msg)
        elif response.status_code >= 400:
            logger.warning(log_msg)
        else:
            logger.info(log_msg)

        return response

    # Configure CORS to permit all origins, methods, and headers during development
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True,
    )


# Attach middleware to the FastAPI application instance
register_middleware(app)

# ==============================================================================
# Router Registration
# ==============================================================================

# Authentication & credential management routes (/api/signup, /api/signin, etc.)
app.include_router(auth_route)
logger.info("Registered router: Auth (/api/signup, /api/signin, /api/refresh_token, /api/update_password)")

# LiveKit Agent session token routes (/api/agent/token)
app.include_router(api_router)
logger.info("Registered router: Token (/api/agent/token)")

# mcps (/api/mcp)
app.include_router(mcp_route)
logger.info("Registered router: Token (/api/mcp/add)")

# prompts (/api/prompts)
app.include_router(prompt_route)
logger.info("Registered router: Prompts (/api/prompts)")

# model engine config (/api/models/config)
app.include_router(model_route)
logger.info("Registered router: Models (/api/models/config)")

# ==============================================================================
# System & Diagnostic Endpoints
# ==============================================================================

@app.get(
    "/",
    include_in_schema=False,
    summary="Root Documentation Redirect",
    description="Redirects root requests to the interactive Swagger UI API documentation.",
)
async def root() -> RedirectResponse:
    """
    Redirects incoming root `/` requests to the interactive API documentation.
    """
    logger.debug("Redirecting root request to /api/docs")
    return RedirectResponse(url="/api/docs")


@app.get(
    "/api/health",
    tags=["Health"],
    summary="Service Health Check",
    description="Checks the operational health and readiness of the Exia API server.",
    response_description="Confirmation payload indicating the server is operational.",
    status_code=status.HTTP_200_OK,
)
def read_root() -> Dict[str, str]:
    """
    Health check endpoint for container probes, load balancers, and monitoring uptime.

    Returns:
        dict: A JSON response with `{"status": "ok"}`.
    """
    logger.info("Health probe check requested - system operational")
    return {"status": "ok"}