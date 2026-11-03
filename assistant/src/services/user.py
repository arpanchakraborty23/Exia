import os
from dotenv import load_dotenv

from .db import MongoDBService, cache

load_dotenv()


class UserContext:
    def __init__(self):
        self.mongo_service = MongoDBService(
            uri=os.getenv("MONGO_URI"),
            db_name=os.getenv("MONGO_DB_NAME"),
            collection_name=os.getenv("MONGO_COLLECTION_NAME")
        )
        self.user_cache_key = "user_context"
        self.cache_service = cache


    def get_context(self, user_id: str):
        try:
            # Check in cache first
            cached_context = self.cache_service.get(f"{self.user_cache_key}:{user_id}")
            if cached_context:
                return cached_context

            # If not found in cache, check in MongoDB
            mongo_context = self.mongo_service.find_document({"user_id": user_id})
            if mongo_context:
                # Cache the context for future requests
                self.cache_service.set(f"{self.user_cache_key}:{user_id}", mongo_context)
                return mongo_context

            return None
        except Exception as e:
            raise e