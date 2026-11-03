import logging

from fastapi import APIRouter, status, HTTPException, Depends

from src.services import AccessTokenBearer, ModelConfigServices, VoiceProfileServices
from src.constants import (
    ModelConfigSchema,
    VoiceProfileSchema,
    VoiceProfileCreateRequest,
    VoiceProfileListResponse,
)


# Initialize Services
logger = logging.getLogger(__name__)
access_token_bearer = AccessTokenBearer()
model_config_services = ModelConfigServices()
voice_profile_services = VoiceProfileServices()


# Model engine config route
model_route = APIRouter(prefix="/api", tags=["Models"])


def _get_user_id(token_data: dict) -> str:
    token_user = (token_data or {}).get("user") or {}
    user_id = token_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token"
        )
    return user_id


@model_route.get("/models/config", response_model=ModelConfigSchema, status_code=status.HTTP_200_OK)
async def get_model_config(token_data: dict = Depends(access_token_bearer)):
    """Get the model engine config (defaults merged over stored)."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/models/config] Fetching configuration for user_id=%s", user_id)
        config = await model_config_services.get_config(user_id)
        mode = config.get("mode", "unknown")
        logger.info("[GET /api/models/config] Retrieved configuration: user_id=%s, mode=%s", user_id, mode)
        return config
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/models/config] Failed to get model config: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get model config",
        )


@model_route.put("/models/config", response_model=ModelConfigSchema, status_code=status.HTTP_200_OK)
async def update_model_config(data: ModelConfigSchema, token_data: dict = Depends(access_token_bearer)):
    """Update (upsert-merge) the model engine config."""
    try:
        user_id = _get_user_id(token_data)
        logger.info(
            "[PUT /api/models/config] Updating configuration for user_id=%s (mode=%s, fallback_enabled=%s)",
            user_id,
            data.mode,
            data.fallback_enabled,
        )
        updated = await model_config_services.update_config(user_id, data)
        logger.info("[PUT /api/models/config] Configuration updated successfully for user_id=%s", user_id)
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[PUT /api/models/config] Failed to update model config: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update model config",
        )


# ─────────────────────────────────────────────────────────────
# Voice Recognition Speaker Profiles (Speechmatics & LiveKit)
# ─────────────────────────────────────────────────────────────

@model_route.get("/voice-profiles", response_model=VoiceProfileListResponse, status_code=status.HTTP_200_OK)
async def get_voice_profiles(token_data: dict = Depends(access_token_bearer)):
    """Fetch enrolled acoustic voice profiles from MongoDB."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/voice-profiles] Listing speaker profiles for user_id=%s", user_id)
        profiles = await voice_profile_services.list_profiles(user_id)
        profile_list = getattr(profiles, "profiles", []) or []
        logger.info("[GET /api/voice-profiles] Retrieved %d speaker profile(s) for user_id=%s", len(profile_list), user_id)
        return profiles
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/voice-profiles] Failed to fetch voice profiles: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch voice profiles",
        )


@model_route.post("/voice-profiles", response_model=VoiceProfileSchema, status_code=status.HTTP_201_CREATED)
async def create_voice_profile(data: VoiceProfileCreateRequest, token_data: dict = Depends(access_token_bearer)):
    """Enroll a new acoustic speaker profile into MongoDB."""
    try:
        user_id = _get_user_id(token_data)
        logger.info(
            "[POST /api/voice-profiles] Enrolling speaker profile for user_id=%s (speaker_name=%s, role=%s)",
            user_id,
            data.speaker_name,
            data.role,
        )
        created = await voice_profile_services.create_profile(user_id, data)
        profile_id = getattr(created, "profile_id", None) or (created.get("profile_id") if isinstance(created, dict) else "unknown")
        logger.info("[POST /api/voice-profiles] Successfully enrolled speaker profile_id=%s for user_id=%s", profile_id, user_id)
        return created
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[POST /api/voice-profiles] Failed to enroll voice profile: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enroll voice profile",
        )


@model_route.delete("/voice-profiles/{profile_id}", status_code=status.HTTP_200_OK)
async def delete_voice_profile(profile_id: str, token_data: dict = Depends(access_token_bearer)):
    """Delete an enrolled voice profile from MongoDB."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[DELETE /api/voice-profiles/%s] Deleting profile for user_id=%s", profile_id, user_id)
        result = await voice_profile_services.delete_profile(user_id, profile_id)
        logger.info("[DELETE /api/voice-profiles/%s] Deleted successfully for user_id=%s", profile_id, user_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[DELETE /api/voice-profiles/%s] Failed to delete voice profile: %s", profile_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete voice profile",
        )
