import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, status
from livekit import api

# pyrefly: ignore [missing-import]
from src.constants import get_settings, AgentTokenRequest, AgentTokenResponse, AgentSessionModel
# pyrefly: ignore [missing-import]
from src.services import MongoServices
# pyrefly: ignore [missing-import]
from src.services import AccessTokenBearer, AuthServices

# intialization
settings = get_settings()
db_service = MongoServices(url=settings.mongodb_uri,db=settings.mongodb_database,collection=settings.mongodb_session_collection or "sessions")
auth_services = AuthServices()
access_token_bearer = AccessTokenBearer()
logger = logging.getLogger(__name__)

api_router = APIRouter(prefix="/api", tags=["Token"])

@api_router.post("/agent/token",response_model=AgentTokenResponse, status_code=status.HTTP_201_CREATED)
async def token(request: AgentTokenRequest, token_details = Depends(access_token_bearer)):
    """
    Agent Token request
    """
    try:
        # decode jwt token payload
        payload = token_details if isinstance(token_details, dict) else auth_services.decode_token(token_details)
        user_info = (payload or {}).get("user") or {}
        participant_identity = user_info.get("user_id") or "usr_admin"
        participant_name = user_info.get("name") or "Operator"
        logger.info(
            "[POST /api/agent/token] LiveKit token requested for participant_identity=%s, name=%s (room=%s, session_id=%s)",
            participant_identity,
            participant_name,
            request.room_name,
            request.session_id,
        )

        # Read fresh settings per-request (module-level values go stale after .env changes)
        current = get_settings()

        # Check MongoDB model_config for user-customized keys
        user_cfg = None
        try:
            cfg_service = MongoServices(
                url=current.mongodb_uri,
                db=current.mongodb_database,
                collection=current.mongodb_model_collection or "model_config",
            )
            user_cfg = cfg_service.find_one({"user_id": participant_identity}) or {}
        except Exception:
            pass

        # LiveKit server credentials strictly loaded from environment (.env)
        livekit_api_key = current.livekit_api_key
        livekit_secret_key = current.livekit_api_secret
        livekit_url = current.livekit_api_host

        if not all([livekit_api_key, livekit_secret_key, livekit_url]):
            logger.error("[POST /api/agent/token] Missing LiveKit credentials in environment (LIVEKIT_URL/API_KEY/API_SECRET)")
            raise HTTPException(
                status_code=status.HTTP_511_NETWORK_AUTHENTICATION_REQUIRED,
                detail="Server configuration error: LiveKit credentials missing",
            )

        # Check if session exists or not
        target_session = request.session_id or (
            request.room_name if request.room_name and request.room_name != "unlisted" else None
        )

        existing_session = None
        if target_session:
            try:
                existing_session = db_service.find_one(
                    {
                        "user_id": participant_identity,
                        "$or": [
                            {"session_id": target_session},
                            {"room_name": target_session},
                        ],
                    },
                    use_cache=False,
                )
            except Exception as db_err:
                logger.warning("[POST /api/agent/token] Error checking existing session: %s", db_err)

        # If exists send id, if not None
        if existing_session:
            session_id = existing_session.get("session_id")
            room_name = existing_session.get("room_name") or request.room_name or session_id
            logger.info("[POST /api/agent/token] Resuming existing voice session: session_id=%s, room_name=%s", session_id, room_name)
        else:
            session_id = None
            room_name = request.room_name or "unlisted"
            logger.info("[POST /api/agent/token] Initializing new voice session room_name=%s", room_name)

        # Include lightweight metadata for the agent worker
        token_metadata = json.dumps({
            "session_id": session_id,
            "resumed": bool(existing_session),
        })

        livekit_token = (
            api.AccessToken(livekit_api_key, livekit_secret_key)
            .with_identity(participant_identity) # user_id
            .with_name(participant_name) # user_name
            .with_metadata(token_metadata) # session_id
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                    can_publish_data=True,
                    can_publish_sources=[
                        "camera",
                        "microphone",
                        "screen_share",
                        "screen_share_audio",
                    ],
                )
            )
        )
        participant_token = livekit_token.to_jwt()
        logger.info("[POST /api/agent/token] LiveKit access token successfully minted for %s in room %s", participant_identity, room_name)

        # If existing session, update its active token & status in MongoDB
        if existing_session and session_id:
            try:
                db_service.update_one(
                    {"session_id": session_id, "user_id": participant_identity},
                    {
                        "$set": {
                            "token": participant_token,
                            "status": "active",
                            "updated_at": datetime.now(timezone.utc),
                        }
                    },
                )
                logger.info("[POST /api/agent/token] Resumed session %s marked active in MongoDB", session_id)
            except Exception as db_err:
                logger.exception("[POST /api/agent/token] Failed to update existing session in MongoDB: %s", db_err)

        return AgentTokenResponse(
            room_name=room_name,
            user_id=participant_identity,
            server_url=livekit_url,
            session_id=session_id,
            token=participant_token,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[POST /api/agent/token] Failed to create agent token: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create agent token")
