import logging
from typing import Optional, Dict, Any

from .config import settings
from .db import MongoDBService, cache

logger = logging.getLogger("user-context")


class UserContext:
    """
    Manages user configuration context for the voice assistant.
    Fetches full user configuration across MongoDB collections (model_config,
    prompts, mcp_servers, voice_profiles, users) and caches in Redis.
    """
    def __init__(self):
        self.mongo_service = MongoDBService(
            uri=settings.mongodb_uri,
            db_name=settings.mongodb_database,
        )
        self.user_cache_key = "user_context"
        self.cache_service = cache

    def get_context(self, user_id: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Fetches all configuration data for a user by user_id.
        Checks Redis cache first; if missing or use_cache is False,
        queries MongoDB across config collections and updates Redis.
        """
        try:
            cache_key = f"{self.user_cache_key}:{user_id}"

            # 1. Check in cache first
            if use_cache:
                cached_context = self.cache_service.get(cache_key)
                if cached_context:
                    logger.info(f"Retrieved user context from Redis cache for '{user_id}'")
                    return cached_context

            # 2. Query MongoDB for all config data of this user
            user_config = self.mongo_service.get_user_config(user_id)
            if user_config:
                # Cache the configuration for future requests using settings.redis_ttl
                self.cache_service.set(cache_key, user_config, ex=settings.redis_ttl)
                logger.info(f"Fetched and cached user config for '{user_id}' from MongoDB")
                return user_config

            return {}
        except Exception as e:
            logger.error(f"Error fetching user context for '{user_id}': {e}")
            raise

    def refresh_context(self, user_id: str) -> Dict[str, Any]:
        """
        Force-refreshes the user configuration from MongoDB and updates the cache.
        """
        return self.get_context(user_id, use_cache=False)

    def session_context(self, user_id: str,session_id : str) -> Dict[str, Any]:
        """
        Fetches only the session data for a user from MongoDB.
        Does not cache session data in Redis.
        """
        try:
            session_data = self.mongo_service.find_session_data(user_id, session_id=session_id)
            return session_data or {}
        except Exception as e:
            logger.error(f"Error fetching session context for '{user_id}': {e}")
            raise

