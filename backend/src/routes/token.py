import logging
import uuid

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

        stored_lk = ((user_cfg or {}).get("config") or {}).get("livekit") or {}

        livekit_api_key = (
            request.livekit_api_key
            or stored_lk.get("apiKey")
            or user_cfg.get("livekit_api_key")
            or current.livekit_api_key
        )
        livekit_secret_key = (
            request.livekit_api_secret
            or stored_lk.get("apiSecret")
            or user_cfg.get("livekit_api_secret")
            or current.livekit_api_secret
        )
        livekit_url = (
            request.livekit_url
            or stored_lk.get("url")
            or user_cfg.get("livekit_url")
            or current.livekit_api_host
        )

        if not all([livekit_api_key, livekit_secret_key, livekit_url]):
            raise HTTPException(
                status_code=status.HTTP_511_NETWORK_AUTHENTICATION_REQUIRED,
                detail="Server configuration error: LiveKit credentials missing",
            )

        room_name = (request.room_name or "unlisted")
        session_id = f"room-{str(uuid.uuid4())[:6]}"

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
        logger.info("Agent session token created!")



        # Optional DB recording (best-effort: never fail token creation on DB error)
        try:
            # Session Data
            session_data = AgentSessionModel(
                session_id=session_id,
                room_name=room_name,
                user_id=participant_identity,
                name=participant_name,
                token=participant_token,
                conversation=None,
                session_summary=None,
            )

            # Insert Session data (connect/disconnect handled inside)
            insert_result = db_service.insert_one(session_data.model_dump())
            logger.info("Agent session recorded: session_id=%s inserted_id=%s",session_id,getattr(insert_result, "inserted_id", None),)

        except Exception as db_err:
            logger.exception("Failed to record session in MongoDB: %s", db_err)

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
        logger.exception("Agent Session Error: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create agent token")
