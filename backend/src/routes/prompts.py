import logging
from typing import List

from fastapi import APIRouter, status, HTTPException, Depends

from src.services import AccessTokenBearer, PromptServices
from src.constants import (
    PromptCreateRequest,
    PromptUpdateRequest,
    PromptResponse,
    PromptDeleteResponse,
)


# Initialize Services
logger = logging.getLogger(__name__)
access_token_bearer = AccessTokenBearer()
prompt_services = PromptServices()


# Prompts route
prompt_route = APIRouter(prefix="/api", tags=["Prompts"])


def _get_user_id(token_data: dict) -> str:
    token_user = (token_data or {}).get("user") or {}
    user_id = token_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token"
        )
    return user_id


@prompt_route.post("/prompts", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(data: PromptCreateRequest, token_data: dict = Depends(access_token_bearer)):
    """Create a new prompt directive."""
    try:
        user_id = _get_user_id(token_data)
        return await prompt_services.create_prompt(user_id, data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create prompt: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create prompt",
        )


@prompt_route.get("/prompts", response_model=List[PromptResponse], status_code=status.HTTP_200_OK)
async def list_prompts(token_data: dict = Depends(access_token_bearer)):
    """List all prompt directives of the authenticated user."""
    try:
        user_id = _get_user_id(token_data)
        return await prompt_services.list_prompts(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list prompts: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list prompts",
        )


@prompt_route.get("/prompts/{prompt_id}", response_model=PromptResponse, status_code=status.HTTP_200_OK)
async def get_prompt(prompt_id: str, token_data: dict = Depends(access_token_bearer)):
    """Get a single prompt directive."""
    try:
        user_id = _get_user_id(token_data)
        return await prompt_services.get_prompt(user_id, prompt_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get prompt: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get prompt",
        )


@prompt_route.put("/prompts/{prompt_id}", response_model=PromptResponse, status_code=status.HTTP_200_OK)
async def update_prompt(
    prompt_id: str,
    data: PromptUpdateRequest,
    token_data: dict = Depends(access_token_bearer),
):
    """Update a prompt directive."""
    try:
        user_id = _get_user_id(token_data)
        return await prompt_services.update_prompt(user_id, prompt_id, data)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update prompt: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update prompt",
        )


@prompt_route.delete("/prompts/{prompt_id}", response_model=PromptDeleteResponse, status_code=status.HTTP_200_OK)
async def delete_prompt(prompt_id: str, token_data: dict = Depends(access_token_bearer)):
    """Delete a prompt directive."""
    try:
        user_id = _get_user_id(token_data)
        return await prompt_services.delete_prompt(user_id, prompt_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to delete prompt: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete prompt",
        )
