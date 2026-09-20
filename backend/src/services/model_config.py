import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status

from .db import MongoServices
from src.constants import get_settings, ModelConfigSchema

# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)


# Defaults mirror frontend lib/api.ts DEFAULT_MODEL_CONFIG
DEFAULT_MODEL_CONFIG: dict = {
    "mode": "gemini_live",
    "gemini_model": "gemini-2.0-flash-realtime",
    "gemini_voice": "Puck",
    "stt_provider": "Deepgram",
    "stt_model": "nova-2",
    "llm_provider": "Google Gemini",
    "llm_model": "gemini-2.5-flash",
    "tts_provider": "Cartesia",
    "tts_model": "sonic-english",
    "temperature": 0.7,
    "max_output_tokens": 1024,
}

# Legacy keys the frontend sometimes sends — normalized on read
_LEGACY_ALIASES = {
    "pipeline_mode": "mode",
    "llt_provider": "llm_provider",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize(raw: dict) -> dict:
    normalized = dict(raw or {})
    for old, new in _LEGACY_ALIASES.items():
        if old in normalized and new not in normalized:
            normalized[new] = normalized.pop(old)
        else:
            normalized.pop(old, None)
    return normalized


class ModelConfigServices:
    """Single model-engine config document per user (upsert + merge)."""

    def __init__(self):
        self.db = MongoServices(
            url=settings.mongodb_uri,
            db=settings.mongodb_database,
            collection=settings.mongodb_model_collection or "model_config",
        )

    async def get_config(self, user_id: str) -> dict:
        try:
            doc = self.db.find_one({"user_id": user_id}, {"_id": 0})
            stored = _normalize((doc or {}).get("config", {}))
            return {**DEFAULT_MODEL_CONFIG, **stored}
        except Exception as e:
            logger.exception("Failed to get model config: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get model config",
            )

    async def update_config(self, user_id: str, patch: ModelConfigSchema) -> dict:
        try:
            # Normalized field names (mode, llm_provider), extras preserved
            patch_dict = _normalize(patch.model_dump(exclude_unset=True))
            if not patch_dict:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No fields to update",
                )

            doc = self.db.find_one({"user_id": user_id}, {"_id": 0})
            stored = _normalize((doc or {}).get("config", {}))
            merged = {**stored, **patch_dict}

            self.db.update_one(
                {"user_id": user_id},
                {"$set": {"user_id": user_id, "config": merged, "updated_at": _now_iso()}},
                upsert=True,
            )
            logger.info("Model config updated for user %s", user_id)
            return {**DEFAULT_MODEL_CONFIG, **merged}
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to update model config: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update model config",
            )
