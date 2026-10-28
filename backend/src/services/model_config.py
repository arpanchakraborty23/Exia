import logging
import os
from datetime import datetime, timezone

from fastapi import HTTPException, status

from .db import MongoServices
from src.constants import get_settings, ModelConfigSchema

# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)


def _update_runtime_env(key: str, value: str) -> None:
    """Applies a settings change to the running process environment.

    The source of truth is MongoDB (model_config collection); environment
    updates apply in-memory so token minting picks them up immediately.
    """
    os.environ[key] = value
    try:
        get_settings.cache_clear()
    except Exception:
        pass


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
    # Fallback model defaults (LLM, STT, TTS)
    "fallback_enabled": False,
    "fallback_provider": "livekit",
    "fallback_model": "google/gemma-4-31b-it",
    "fallback_temperature": 0.7,
    "fallback_stt_enabled": False,
    "fallback_stt_provider": "livekit",
    "fallback_stt_model": "deepgram/nova-3",
    "fallback_tts_enabled": False,
    "fallback_tts_provider": "livekit",
    "fallback_tts_model": "cartesia/sonic-3.6",
}

# Mapping of ModelConfig key attributes to standard Environment variable names
MODEL_KEY_TO_ENV = {
    "gemini_api_key": "GEMINI_API_KEY",
    "openai_api_key": "OPENAI_API_KEY",
    "anthropic_api_key": "ANTHROPIC_API_KEY",
    "deepgram_api_key": "DEEPGRAM_API_KEY",
    "cartesia_api_key": "CARTESIA_API_KEY",
    "elevenlabs_api_key": "ELEVENLABS_API_KEY",
    "speechmatics_api_key": "SPEECHMATICS_API_KEY",
    "groq_api_key": "GROQ_API_KEY",
    "deepseek_api_key": "DEEPSEEK_API_KEY",
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

            # Fetch fresh settings from setup wizard / .env
            current_settings = get_settings()
            env_livekit = {
                "url": current_settings.livekit_api_host or "",
                "apiKey": current_settings.livekit_api_key or "",
                "apiSecret": current_settings.livekit_api_secret or "",
                "roomName": "exia-agent-room",
            }

            stored_livekit = stored.get("livekit") or {}
            merged_livekit = {
                "url": stored_livekit.get("url") or stored.get("livekit_url") or env_livekit["url"],
                "apiKey": stored_livekit.get("apiKey") or stored.get("livekit_api_key") or env_livekit["apiKey"],
                "apiSecret": stored_livekit.get("apiSecret") or stored.get("livekit_api_secret") or env_livekit["apiSecret"],
                "roomName": stored_livekit.get("roomName") or env_livekit["roomName"],
            }

            merged = {**DEFAULT_MODEL_CONFIG, **stored}
            merged["livekit"] = merged_livekit
            merged["livekit_url"] = merged_livekit["url"]
            merged["livekit_api_key"] = merged_livekit["apiKey"]
            merged["livekit_api_secret"] = merged_livekit["apiSecret"]

            # Load provider keys from environment if not explicitly set in stored doc
            for model_attr, env_var in MODEL_KEY_TO_ENV.items():
                env_val = os.environ.get(env_var) or (os.environ.get("GOOGLE_API_KEY") if env_var == "GEMINI_API_KEY" else None)
                if env_val and not stored.get(model_attr):
                    merged[model_attr] = env_val

            # Fallback model attributes guaranteed with defaults (LLM, STT, TTS)
            if "fallback_enabled" not in merged:
                merged["fallback_enabled"] = False
            if "fallback_provider" not in merged:
                merged["fallback_provider"] = "livekit"
            if "fallback_model" not in merged:
                merged["fallback_model"] = "google/gemma-4-31b-it"
            if "fallback_temperature" not in merged:
                merged["fallback_temperature"] = 0.7

            if "fallback_stt_enabled" not in merged:
                merged["fallback_stt_enabled"] = False
            if "fallback_stt_provider" not in merged:
                merged["fallback_stt_provider"] = "livekit"
            if "fallback_stt_model" not in merged:
                merged["fallback_stt_model"] = "deepgram/nova-3"

            if "fallback_tts_enabled" not in merged:
                merged["fallback_tts_enabled"] = False
            if "fallback_tts_provider" not in merged:
                merged["fallback_tts_provider"] = "livekit"
            if "fallback_tts_model" not in merged:
                merged["fallback_tts_model"] = "cartesia/sonic-3.6"

            # Mirror for model-selection-view which reads `pipeline_mode`
            merged["pipeline_mode"] = merged.get("mode")
            return merged
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

            # Check if LiveKit credentials were provided or updated
            livekit_patch = patch_dict.get("livekit") or {}
            new_url = livekit_patch.get("url") or patch_dict.get("livekit_url")
            new_key = livekit_patch.get("apiKey") or patch_dict.get("livekit_api_key")
            new_secret = livekit_patch.get("apiSecret") or patch_dict.get("livekit_api_secret")

            if new_url or new_key or new_secret:
                try:
                    if new_url:
                        _update_runtime_env("LIVEKIT_API_HOST", new_url.strip())
                    if new_key:
                        _update_runtime_env("LIVEKIT_API_KEY", new_key.strip())
                    if new_secret:
                        _update_runtime_env("LIVEKIT_API_SECRET", new_secret.strip())
                    logger.info("LiveKit credentials updated in runtime environment")
                except Exception as env_err:
                    logger.warning("Could not update LiveKit runtime environment: %s", env_err)

            # Sync model provider API keys to persistent .env and process environment
            for model_attr, env_var in MODEL_KEY_TO_ENV.items():
                key_val = patch_dict.get(model_attr)
                if key_val is not None and isinstance(key_val, str) and key_val.strip():
                    try:
                        _update_runtime_env(env_var, key_val.strip())
                        logger.info("Updated %s in runtime environment", env_var)
                    except Exception as env_err:
                        logger.warning("Could not update %s in runtime environment: %s", env_var, env_err)

            doc = self.db.find_one({"user_id": user_id}, {"_id": 0})
            stored = _normalize((doc or {}).get("config", {}))
            merged = {**stored, **patch_dict}

            # Normalize livekit structure in document
            if new_url or new_key or new_secret:
                current_lk = merged.get("livekit") or {}
                if new_url:
                    current_lk["url"] = new_url
                    merged["livekit_url"] = new_url
                if new_key:
                    current_lk["apiKey"] = new_key
                    merged["livekit_api_key"] = new_key
                if new_secret:
                    current_lk["apiSecret"] = new_secret
                    merged["livekit_api_secret"] = new_secret
                merged["livekit"] = current_lk

            self.db.update_one(
                {"user_id": user_id},
                {"$set": {"user_id": user_id, "config": merged, "updated_at": _now_iso()}},
                upsert=True,
            )
            logger.info("Model config and LiveKit keys updated in MongoDB for user %s", user_id)
            return await self.get_config(user_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to update model config: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update model config",
            )
