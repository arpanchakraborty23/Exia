import logging
import uuid

from fastapi import APIRouter, HTTPException, Depends, status
from livekit import api

# pyrefly: ignore [missing-import]
from src.constants import get_settings, AgentTokenRequest, AgentTokenResponse, AgentSessionModel
# pyrefly: ignore [missing-import]
from src.db import MongoServices
# pyrefly: ignore [missing-import]
from src.services import AcessTokenBearer, AuthServices

# intialization
settings = get_settings()
db_service = MongoServices(url=settings.mongodb_uri,db=settings.mongodb_database,collection=settings.mongodb_session_collection or "sessions")
auth_services = AuthServices()
access_token_bearer = AcessTokenBearer()
logger = logging.getLogger(__name__)

api_router = APIRouter(prefix="/api", tags=["Token"])

# livekit credentials
livekit_api_key = settings.livekit_api_key
livekit_secret_key = settings.livekit_api_secret
livekit_url = settings.livekit_api_host


@api_router.post("/agent/token",response_model=AgentTokenResponse, status_code=status.HTTP_201_CREATED)
async def token(request: AgentTokenRequest, token_details = Depends(access_token_bearer)):
    """
    Agent Token request
    """
    try:
        if not all([livekit_api_key, livekit_secret_key, livekit_url]):
            raise HTTPException(
                status_code=status.HTTP_511_NETWORK_AUTHENTICATION_REQUIRED,
                detail="Server configuration error: LiveKit credentials missing",
            )

        # decode jwt token payload
        payload = auth_services.decode_token(token_details)

        room_name =  f"room-{str(uuid.uuid4())[:6]}"
        participant_identity = payload['user']['user_id']
        participant_name = payload['user']['name']

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
        if db_service.connect():
            try:
                # Session Data
                session_data = AgentSessionModel(
                    session_id =room_name,
                    user_id = participant_identity,
                    name = participant_name,
                    token = participant_token,
                    conversation = [],
                    session_summary = None
                )

                # Insert Session data
                db_service.insert_one(session_data.model_dump())

            except Exception as db_err:
                logger.error(f"Failed to record session in MongoDB: {db_err}")
                

        return AgentTokenResponse(
            user_id=participant_identity,
            server_url=livekit_url,
            session_id=room_name,
            token = participant_token

        )

    except HTTPException as e:
        logger.error(f"Agent Session Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db_service.disconnect()
