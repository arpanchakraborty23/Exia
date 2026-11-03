import asyncio
import json
import logging
import os
import uuid
from dotenv import load_dotenv

from livekit.agents import JobContext, cli

from src.services import cache, UserContext


# Configure logging and load environment variables
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Exia-Assistant-Agent")




async def entrypoint(ctx: JobContext):
    try:
        # 1. Connect to LiveKit room
        logger.info(f"Connecting to LiveKit room: {ctx.room.name}")
        await ctx.connect()

        # 2. Wait for user participant
        participant = await ctx.wait_for_participant()
        logger.info(f"Participant joined: {participant.identity}")

        # 3. User context building
        user_id = participant.identity
        user_name = participant.name
        metadata = json.load(participant.metadata)
        session_thread = metadata.get("session_id")

        

        # Fetch all config data of the user (cached in Redis, loaded from MongoDB)
        user_ctx_service = UserContext()
        user_config = user_ctx_service.get_context(user_id)
        session_config = user_ctx_service.session_context(user_id, session_thread)

        logger.info(f"✅ Successfully loaded configuration for user '{user_id}' ")

        # Agent Context Building
        models_config = user_config.get("model_config", {})
        prompts_config = user_config.get("prompts", {})
        base_prompt = prompts_config.get("default_prompt", {})
        mcp_servers = user_config.get("mcp_servers", {})
        voice_profiles = user_config.get("voice_profiles", {})



    except Exception as e:
        logger.error(f"Error in entrypoint: {e}")
        raise e
    
if __name__ == "__main__":
    # load livekit credentals from db to memory

    cli.run_app(agent=entrypoint)
