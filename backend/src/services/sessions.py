import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status

from .db import MongoServices
from src.constants import get_settings

# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_iso(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _to_epoch(value) -> float | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.timestamp()
    try:
        return datetime.fromisoformat(str(value)).timestamp()
    except Exception:
        return None


class SessionServices:
    """Read/history views over agent voice sessions (history screen)."""

    def __init__(self):
        self.db = MongoServices(
            url=settings.mongodb_uri,
            db=settings.mongodb_database,
            collection=settings.mongodb_session_collection or "sessions",
        )

    @staticmethod
    def _to_summary(doc: dict) -> dict:
        started = _to_iso(doc.get("created_at"))
        ended = _to_iso(doc.get("ended_at"))
        status_value = doc.get("status") or ("ended" if ended else "active")
        duration = None
        start_epoch = _to_epoch(doc.get("created_at"))
        end_epoch = _to_epoch(doc.get("ended_at"))
        if start_epoch is not None and end_epoch is not None:
            duration = max(0, int(end_epoch - start_epoch))

        conversation = doc.get("conversation")
        if isinstance(conversation, list):
            message_count = len(conversation)
        elif isinstance(conversation, dict):
            message_count = len(conversation)
        else:
            message_count = 0

        return {
            "id": doc.get("session_id"),
            "user_id": doc.get("user_id"),
            "room_name": doc.get("room_name") or "unlisted",
            "started_at": started,
            "ended_at": ended,
            "status": status_value,
            "duration_seconds": duration,
            "model_used": doc.get("model_used"),
            "message_count": message_count,
            "preview_text": doc.get("session_summary"),
        }

    async def list_sessions(self, user_id: str, page: int = 1, limit: int = 10) -> dict:
        try:
            page = max(1, page)
            limit = min(max(1, limit), 100)
            total = self.db.count_documents({"user_id": user_id})
            docs = self.db.find_many(
                {"user_id": user_id},
                projection={"_id": 0, "token": 0},
                sort=[("created_at", -1)],
                skip=(page - 1) * limit,
                limit=limit,
            )
            return {
                "sessions": [self._to_summary(d) for d in (docs or [])],
                "total": total,
            }
        except Exception as e:
            logger.exception("Failed to list sessions: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list sessions",
            )

    async def get_session(self, user_id: str, session_id: str) -> dict:
        try:
            doc = self.db.find_one(
                {"user_id": user_id, "session_id": session_id},
                {"_id": 0, "token": 0},
            )
            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Session '{session_id}' not found",
                )
            detail = self._to_summary(doc)
            # No transcript/tool-invocation store yet — return empty collections
            detail["transcript"] = []
            detail["mcp_tools_invoked"] = []
            return detail
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to get session: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get session",
            )

    async def end_session(self, user_id: str, session_id: str) -> dict:
        try:
            result = self.db.update_one(
                {"user_id": user_id, "session_id": session_id},
                {"$set": {"status": "ended", "ended_at": _now_iso()}},
            )
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Session '{session_id}' not found",
                )
            logger.info("Session '%s' ended", session_id)
            return {"message": "Session closed"}
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to end session: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to end session",
            )
