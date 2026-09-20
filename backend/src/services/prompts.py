import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status

from .db import MongoServices
from src.constants import get_settings, PromptCreateRequest, PromptUpdateRequest, PromptModel

# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class PromptServices:
    """CRUD for user prompt directives (Directive & Prompt Matrix)."""

    def __init__(self):
        self.db = MongoServices(
            url=settings.mongodb_uri,
            db=settings.mongodb_database,
            collection=settings.mongodb_prompt_collection or "prompts",
        )

    @staticmethod
    def _to_public(doc: dict) -> dict:
        return {
            "id": doc.get("prompt_id"),
            "user_id": doc.get("user_id"),
            "title": doc.get("title"),
            "prompt_text": doc.get("prompt_text"),
            "type": doc.get("type"),
            "tags": doc.get("tags") or [],
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        }

    async def create_prompt(self, user_id: str, data: PromptCreateRequest) -> dict:
        try:
            title = (data.title or "").strip()
            prompt_text = (data.prompt_text or "").strip()
            if not title or not prompt_text:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="title and prompt_text are required",
                )

            new_prompt = PromptModel(
                user_id=user_id,
                prompt_id=f"pr_{uuid.uuid4().hex[:8]}",
                title=title,
                prompt_text=prompt_text,
                type=data.type or "system",
                tags=list(data.tags or []),
                created_at=_now_iso(),
                updated_at=None,
            )
            self.db.insert_one(new_prompt.model_dump())
            logger.info("Prompt '%s' created for user %s", new_prompt.prompt_id, user_id)
            return self._to_public(new_prompt.model_dump())
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to create prompt: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create prompt",
            )

    async def list_prompts(self, user_id: str) -> list:
        """Return bare array — matches frontend PromptItem[]."""
        try:
            docs = self.db.find_many(
                {"user_id": user_id},
                projection={"_id": 0},
            )
            return [self._to_public(d) for d in (docs or [])]
        except Exception as e:
            logger.exception("Failed to list prompts: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list prompts",
            )

    async def get_prompt(self, user_id: str, prompt_id: str) -> dict:
        try:
            doc = self.db.find_one(
                {"user_id": user_id, "prompt_id": prompt_id},
                {"_id": 0},
            )
            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Prompt '{prompt_id}' not found",
                )
            return self._to_public(doc)
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to get prompt: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get prompt",
            )

    async def update_prompt(
        self, user_id: str, prompt_id: str, patch: PromptUpdateRequest
    ) -> dict:
        try:
            updates = {}
            if patch.title is not None:
                if not patch.title.strip():
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="title cannot be empty",
                    )
                updates["title"] = patch.title.strip()
            if patch.prompt_text is not None:
                if not patch.prompt_text.strip():
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="prompt_text cannot be empty",
                    )
                updates["prompt_text"] = patch.prompt_text.strip()
            if patch.type is not None:
                updates["type"] = patch.type
            if patch.tags is not None:
                updates["tags"] = list(patch.tags)

            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No fields to update",
                )

            updates["updated_at"] = _now_iso()
            result = self.db.update_one(
                {"user_id": user_id, "prompt_id": prompt_id},
                {"$set": updates},
            )
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Prompt '{prompt_id}' not found",
                )
            return await self.get_prompt(user_id, prompt_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to update prompt: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update prompt",
            )

    async def delete_prompt(self, user_id: str, prompt_id: str) -> dict:
        try:
            result = self.db.delete_one({"user_id": user_id, "prompt_id": prompt_id})
            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Prompt '{prompt_id}' not found",
                )
            logger.info("Prompt '%s' deleted", prompt_id)
            return {"success": True, "message": f"Prompt '{prompt_id}' deleted"}
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to delete prompt: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete prompt",
            )
