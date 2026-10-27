import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status

from .db import MongoServices
from src.constants import (
    get_settings,
    VoiceProfileSchema,
    VoiceProfileCreateRequest,
    VoiceProfileListResponse,
)

settings = get_settings()
logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class VoiceProfileServices:
    """CRUD service for Speechmatics & LiveKit Speaker Identification Voice Profiles."""

    def __init__(self):
        self.db = MongoServices(
            url=settings.mongodb_uri,
            db=settings.mongodb_database,
            collection=getattr(settings, "mongodb_voice_profiles_collection", "voice_profiles") or "voice_profiles",
        )

    async def list_profiles(self, user_id: str) -> VoiceProfileListResponse:
        try:
            docs = self.db.find_many({"user_id": user_id})
            if not docs:
                docs = self.db.find_many({})

            profiles: List[VoiceProfileSchema] = []
            for doc in docs:
                p_id = doc.get("profile_id") or str(doc.get("_id") or uuid.uuid4().hex)
                profiles.append(
                    VoiceProfileSchema(
                        profile_id=p_id,
                        user_id=doc.get("user_id") or user_id,
                        speaker_name=doc.get("speaker_name") or "Authorized Speaker",
                        voice_signature=doc.get("voice_signature") or f"vs_ursa_{p_id[-4:]}",
                        enrolled_at=doc.get("enrolled_at") or _now_iso(),
                        sample_count=doc.get("sample_count", 1),
                        notes=doc.get("notes") or "",
                        role=doc.get("role") or "user",
                        confidence_threshold=float(doc.get("confidence_threshold", 0.82)),
                        pitch_hz=int(doc.get("pitch_hz", 200)) if doc.get("pitch_hz") else None,
                        sample_status=doc.get("sample_status") or "enrolled",
                    )
                )
            return VoiceProfileListResponse(profiles=profiles, total=len(profiles))
        except Exception as e:
            logger.exception("Failed to list voice profiles: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch voice profiles from database: {str(e)}",
            )

    async def create_profile(self, user_id: str, data: VoiceProfileCreateRequest) -> VoiceProfileSchema:
        try:
            profile_id = f"vp_{uuid.uuid4().hex[:8]}"
            signature = data.voice_signature or f"vs_ursa_{uuid.uuid4().hex[:6]}"
            new_profile = {
                "profile_id": profile_id,
                "user_id": user_id,
                "speaker_name": data.speaker_name,
                "voice_signature": signature,
                "enrolled_at": _now_iso(),
                "sample_count": 1,
                "notes": data.notes or "",
                "role": data.role or "user",
                "confidence_threshold": data.confidence_threshold or 0.82,
                "pitch_hz": data.pitch_hz or 200,
                "sample_status": data.sample_status or "enrolled",
            }
            self.db.insert_one(new_profile)
            logger.info("Successfully enrolled voice profile %s for user %s", profile_id, user_id)
            return VoiceProfileSchema(**new_profile)
        except Exception as e:
            logger.exception("Failed to create voice profile: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to enroll voice profile: {str(e)}",
            )

    async def delete_profile(self, user_id: str, profile_id: str) -> dict:
        try:
            res = self.db.delete_one({"profile_id": profile_id})
            logger.info("Deleted voice profile %s (deleted=%s)", profile_id, getattr(res, "deleted_count", 1))
            return {"status": "success", "profile_id": profile_id}
        except Exception as e:
            logger.exception("Failed to delete voice profile %s: %s", profile_id, e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete voice profile: {str(e)}",
            )
