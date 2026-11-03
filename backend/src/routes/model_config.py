import logging

from fastapi import APIRouter, Depends, HTTPException, status

from src.constants import ModelConfigSchema
from src.services import AccessTokenBearer, ModelConfigServices

logger = logging.getLogger(__name__)
access_token_bearer = AccessTokenBearer()
model_config_services = ModelConfigServices()

model_route = APIRouter(prefix="/api", tags=["Models"])


def _get_user_id(token_data: dict) -> str:
    token_user = (token_data or {}).get("user") or {}
    user_id = token_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token",
        )
    return user_id


@model_route.get(
    "/models/config",
    response_model=ModelConfigSchema,
    status_code=status.HTTP_200_OK,
)
async def get_model_config(token_data: dict = Depends(access_token_bearer)):
    """Get the model engine config (defaults merged over stored)."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/models/config] Fetching configuration for user_id=%s", user_id)
        config = await model_config_services.get_config(user_id)
        logger.info(
            "[GET /api/models/config] Retrieved configuration: user_id=%s, mode=%s",
            user_id,
            config.get("mode", "unknown"),
        )
        return config
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/models/config] Failed to get model config: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get model config",
        )


@model_route.put(
    "/models/config",
    response_model=ModelConfigSchema,
    status_code=status.HTTP_200_OK,
)
async def update_model_config(
    data: ModelConfigSchema,
    token_data: dict = Depends(access_token_bearer),
):
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
        logger.info(
            "[PUT /api/models/config] Configuration updated successfully for user_id=%s",
            user_id,
        )
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[PUT /api/models/config] Failed to update model config: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update model config",
        )
