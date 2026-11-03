import logging

from fastapi import APIRouter, status, HTTPException, Depends, Query

from src.services import AccessTokenBearer, SessionServices
from src.constants import (
    SessionListResponse,
    SessionDetailSchema,
    EndSessionResponse,
    AnalyticsMetricsResponse,
)


# Initialize Services
logger = logging.getLogger(__name__)
access_token_bearer = AccessTokenBearer()
session_services = SessionServices()


# Sessions route
session_route = APIRouter(prefix="/api", tags=["Sessions"])


def _get_user_id(token_data: dict) -> str:
    token_user = (token_data or {}).get("user") or {}
    user_id = token_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token"
        )
    return user_id


@session_route.get("/analytics", response_model=AnalyticsMetricsResponse, status_code=status.HTTP_200_OK)
async def get_analytics(token_data: dict = Depends(access_token_bearer)):
    """Aggregated voice session metrics and telemetry for analytics view."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/analytics] Computing session analytics for user_id=%s", user_id)
        analytics = await session_services.get_analytics(user_id)
        logger.info("[GET /api/analytics] Successfully computed analytics for user_id=%s", user_id)
        return analytics
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/analytics] Failed to get analytics: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analytics",
        )


@session_route.get("/sessions", response_model=SessionListResponse, status_code=status.HTTP_200_OK)
async def list_sessions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    token_data: dict = Depends(access_token_bearer),
):
    """Paginated voice session history of the authenticated user."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/sessions] Listing voice sessions for user_id=%s (page=%d, limit=%d)", user_id, page, limit)
        sessions = await session_services.list_sessions(user_id, page=page, limit=limit)
        session_list = getattr(sessions, "sessions", []) or []
        logger.info("[GET /api/sessions] Retrieved %d session(s) for user_id=%s", len(session_list), user_id)
        return sessions
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/sessions] Failed to list sessions: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list sessions",
        )


@session_route.get("/sessions/{session_id}", response_model=SessionDetailSchema, status_code=status.HTTP_200_OK)
async def get_session(session_id: str, token_data: dict = Depends(access_token_bearer)):
    """Single session detail."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/sessions/%s] Fetching session detail for user_id=%s", session_id, user_id)
        session = await session_services.get_session(user_id, session_id)
        logger.info("[GET /api/sessions/%s] Retrieved session detail for user_id=%s", session_id, user_id)
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/sessions/%s] Failed to get session: %s", session_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get session",
        )


@session_route.post("/sessions/{session_id}/end", response_model=EndSessionResponse, status_code=status.HTTP_200_OK)
async def end_session(session_id: str, token_data: dict = Depends(access_token_bearer)):
    """Mark a voice session as ended (called on LiveKit disconnect)."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[POST /api/sessions/%s/end] Ending voice session for user_id=%s", session_id, user_id)
        result = await session_services.end_session(user_id, session_id)
        logger.info("[POST /api/sessions/%s/end] Session successfully marked as ended for user_id=%s", session_id, user_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[POST /api/sessions/%s/end] Failed to end session: %s", session_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to end session",
        )
