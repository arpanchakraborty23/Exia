import logging

from fastapi import APIRouter, status, HTTPException, Depends

from src.services import AccessTokenBearer, ModelConfigServices
from src.constants import ModelConfigSchema


# Initialize Services
logger = logging.getLogger(__name__)
access_token_bearer = AccessTokenBearer()
model_config_services = ModelConfigServices()


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
        return await model_config_services.get_config(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get model config: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get model config",
        )


@model_route.put("/models/config", response_model=ModelConfigSchema, status_code=status.HTTP_200_OK)
async def update_model_config(data: ModelConfigSchema, token_data: dict = Depends(access_token_bearer)):
    """Update (upsert-merge) the model engine config."""
    try:
        user_id = _get_user_id(token_data)
        return await model_config_services.update_config(user_id, data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update model config: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update model config",
        )
