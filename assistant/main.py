import asyncio
import json
import logging
import os
from dotenv import load_dotenv

from livekit.agents import JobContext, cli

from src.services import cache


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

        # check in cache if user context exists
        cache_context = cache.get(f"user_context:{user_id}")
        
        # If not, create a new context for the user
        if not cache_context:
            logger.info(f"No cached context for user {user_id}; creating a new one.")
            # context builder logic here
            pass

    except Exception as e:
        logger.error(f"Error in entrypoint: {e}")
        raise e
    
if __name__ == "__main__":
    cli.run_app(agent=entrypoint)
