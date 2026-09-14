import logging
import uuid

from fastapi import APIRouter, HTTPException
from livekit import api

from src.constants import get_settings, AgentTokenRequest
from src.db import MongoServices

settings = get_settings()
logger = logging.getLogger(__name__)

api_router = APIRouter(prefix="/api", tags=["Token"])

# livekit credentials
livekit_api_key = settings.livekit_api_key
livekit_secret_key = settings.livekit_api_secret
livekit_url = settings.livekit_api_host


@api_router.post("/token", status_code=201)
async def token(request: AgentTokenRequest):
    """
    Agent Token request
    """
    try:
        if not all([livekit_api_key, livekit_secret_key, livekit_url]):
            raise HTTPException(
                status_code=500,
                detail="Server configuration error: LiveKit credentials missing",
            )

        room_name = request.room_name or f"room-{str(uuid.uuid4())[:6]}"
        participant_identity = request.participant_identity or str(uuid.uuid4())[:8]
        participant_name = request.participant_name or "Arpan Chakraborty"

        livekit_token = (
            api.AccessToken(livekit_api_key, livekit_secret_key)
            .with_identity(participant_identity)
            .with_name(participant_name)
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                )
            )
        )
        participant_token = livekit_token.to_jwt()
        logger.info("Agent session token created!")

        # Optional DB recording if configured
        if settings.mongodb_uri and settings.mongodb_database:
            try:
                db_service = MongoServices(
                    url=settings.mongodb_uri,
                    db=settings.mongodb_database,
                    collection=settings.mongodb_session_collection or "sessions",
                )
                db_service.insert_one(
                    {
                        "room_name": room_name,
                        "participant_identity": participant_identity,
                        "participant_name": participant_name,
                    }
                )
                db_service.disconnect()
            except Exception as db_err:
                logger.warning(f"Failed to record session in MongoDB: {db_err}")

        return {
            "server_url": livekit_url,
            "participant_token": participant_token,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Agent Session Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
