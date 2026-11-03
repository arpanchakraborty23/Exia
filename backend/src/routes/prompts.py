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
        logger.info("[POST /api/prompts] Creating prompt for user_id=%s (title='%s', type=%s)", user_id, data.title, data.type)
        created = await prompt_services.create_prompt(user_id, data)
        prompt_id = getattr(created, "id", None) or (created.get("id") if isinstance(created, dict) else "unknown")
        logger.info("[POST /api/prompts] Successfully created prompt '%s' (id=%s) for user_id=%s", data.title, prompt_id, user_id)
        return created
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[POST /api/prompts] Failed to create prompt: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create prompt",
        )


@prompt_route.get("/prompts", response_model=List[PromptResponse], status_code=status.HTTP_200_OK)
async def list_prompts(token_data: dict = Depends(access_token_bearer)):
    """List all prompt directives of the authenticated user."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/prompts] Listing prompts for user_id=%s", user_id)
        prompts = await prompt_services.list_prompts(user_id)
        logger.info("[GET /api/prompts] Retrieved %d prompt(s) for user_id=%s", len(prompts or []), user_id)
        return prompts
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/prompts] Failed to list prompts: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list prompts",
        )


@prompt_route.get("/prompts/{prompt_id}", response_model=PromptResponse, status_code=status.HTTP_200_OK)
async def get_prompt(prompt_id: str, token_data: dict = Depends(access_token_bearer)):
    """Get a single prompt directive."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/prompts/%s] Fetching prompt for user_id=%s", prompt_id, user_id)
        prompt = await prompt_services.get_prompt(user_id, prompt_id)
        logger.info("[GET /api/prompts/%s] Found prompt for user_id=%s", prompt_id, user_id)
        return prompt
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/prompts/%s] Failed to get prompt: %s", prompt_id, e)
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
        logger.info("[PUT /api/prompts/%s] Updating prompt for user_id=%s (title='%s')", prompt_id, user_id, data.title)
        updated = await prompt_services.update_prompt(user_id, prompt_id, data)
        logger.info("[PUT /api/prompts/%s] Successfully updated prompt for user_id=%s", prompt_id, user_id)
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[PUT /api/prompts/%s] Failed to update prompt: %s", prompt_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update prompt",
        )


@prompt_route.delete("/prompts/{prompt_id}", response_model=PromptDeleteResponse, status_code=status.HTTP_200_OK)
async def delete_prompt(prompt_id: str, token_data: dict = Depends(access_token_bearer)):
    """Delete a prompt directive."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[DELETE /api/prompts/%s] Deleting prompt for user_id=%s", prompt_id, user_id)
        result = await prompt_services.delete_prompt(user_id, prompt_id)
        logger.info("[DELETE /api/prompts/%s] Successfully deleted prompt for user_id=%s", prompt_id, user_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[DELETE /api/prompts/%s] Failed to delete prompt: %s", prompt_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete prompt",
        )
