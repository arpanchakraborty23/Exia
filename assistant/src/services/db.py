import json
import logging
import time
from typing import Any, Dict, List, Optional
from pymongo import MongoClient

try:
    import redis
except ImportError:
    redis = None

try:
    from .config import settings
except (ImportError, ValueError):
    import sys
    from pathlib import Path
    _SERVICES_DIR = Path(__file__).resolve().parent
    _SRC_DIR = _SERVICES_DIR.parent
    _ASSISTANT_DIR = _SRC_DIR.parent
    for p in (str(_SERVICES_DIR), str(_SRC_DIR), str(_ASSISTANT_DIR)):
        if p not in sys.path:
            sys.path.insert(0, p)
    try:
        from config import settings
    except ImportError:
        try:
            from services.config import settings
        except ImportError:
            from src.services.config import settings

logger = logging.getLogger("assistant-db")

# ------------------------------------------------------------------------------
# Redis Client & Configuration
# ------------------------------------------------------------------------------
r = None
if redis is not None:
    try:
        r = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            decode_responses=True,
            username=settings.redis_username,
            password=settings.redis_password,
            socket_connect_timeout=5,
        )
    except Exception as e:
        logger.warning(f"Could not connect to Redis: {e}")
        r = None
else:
    logger.info("redis package not installed; RedisCache will use in-memory fallback.")


def get_mongo_client(
    uri: Optional[str] = None,
    db_name: Optional[str] = None,
    collection_name: Optional[str] = None,
):
    """
    Connect to MongoDB and return (collection, db).
    If collection_name is None, collection will be None.
    """
    mongo_uri = uri or settings.mongodb_uri
    database_name = db_name or settings.mongodb_database
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client[database_name]
    collection = db[collection_name] if collection_name else None
    return collection, db


def sanitize_doc(doc: Any) -> Any:
    """
    Recursively sanitizes MongoDB documents:
      - Converts ObjectId and datetime to string
      - Strips sensitive fields like 'hash_password'
    """
    if isinstance(doc, list):
        return [sanitize_doc(item) for item in doc]
    if isinstance(doc, dict):
        cleaned = {}
        for k, v in doc.items():
            if k == "hash_password":
                continue
            if k == "_id":
                cleaned["_id"] = str(v)
            elif isinstance(v, (dict, list)):
                cleaned[k] = sanitize_doc(v)
            else:
                cleaned[k] = v
        return cleaned
    return doc


class RedisCache:
    """
    Cache wrapper supporting transparent JSON serialization and deserialization.
    Uses Redis when available, otherwise falls back to in-memory TTL caching.
    """
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self._memory_cache: Dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any:
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                if val is None:
                    return None
                try:
                    return json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    return val
            except Exception as e:
                logger.warning(f"Redis GET failed for key '{key}': {e}")

        # In-memory fallback
        item = self._memory_cache.get(key)
        if item:
            expires_at, val = item
            if expires_at and time.time() > expires_at:
                self._memory_cache.pop(key, None)
                return None
            return val
        return None

    def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        expiry = ex if ex is not None else settings.redis_ttl
        success = False

        if self.redis_client:
            try:
                serialized = json.dumps(value, default=str) if isinstance(value, (dict, list)) else value
                self.redis_client.set(key, serialized, ex=expiry)
                success = True
            except Exception as e:
                logger.warning(f"Redis SET failed for key '{key}': {e}")

        # In-memory store
        expires_at = time.time() + expiry if expiry else 0
        self._memory_cache[key] = (expires_at, value)
        return success or True

    def delete(self, key: str) -> bool:
        deleted = False
        if self.redis_client:
            try:
                deleted = bool(self.redis_client.delete(key))
            except Exception as e:
                logger.warning(f"Redis DELETE failed for key '{key}': {e}")
        self._memory_cache.pop(key, None)
        return deleted


cache = RedisCache(r)


class MongoDBService:
    """
    MongoDB service for assistant services.
    Supports querying specific collections or fetching all configuration data for a user.
    """
    def __init__(
        self,
        uri: Optional[str] = None,
        db_name: Optional[str] = None,
        collection_name: Optional[str] = None,
    ):
        self.collection, self.db = get_mongo_client(uri, db_name, collection_name)
        self.collection_name = collection_name
        self.collection_list = [
            settings.mongodb_model_collection,
            settings.mongodb_prompt_collection,
            settings.mongodb_mcp_collection,
            settings.mongodb_session_collection,
        ]

    def insert_document(self, document: dict):
        if self.collection is None:
            raise ValueError("No default collection specified for insert_document.")
        return self.collection.insert_one(document)

    def find_document(self, query: dict):
        if self.collection is None:
            raise ValueError("No default collection specified for find_document.")
        doc = self.collection.find_one(query)
        return sanitize_doc(doc) if doc else None

    def get_user_config(self, user_id: str) -> Dict[str, Any]:
        """
        Fetch all configuration data belonging to a user across all config collections:
          1. model_config: LLM, STT, TTS, LiveKit credentials, API keys, fallback settings
          2. prompts: System directives, quick macros, skill prompts, active default prompt
          3. mcp_servers: Active MCP tools, transport protocol, endpoints
          4. session: User session data
        
        Returns:
            Dict[str, Any] containing the structured configuration data.
        """
        try:
            existing_cols = self.db.list_collection_names()

            # 1. Model Configuration
            model_col = settings.mongodb_model_collection
            model_config = {}
            if model_col in existing_cols:
                raw_model_cfg = self.db[model_col].find_one({"user_id": user_id}, {"_id": 0})
                if raw_model_cfg:
                    model_config = raw_model_cfg.get("config", raw_model_cfg)
                    model_config = sanitize_doc(model_config)

            # 2. Prompts / Directives
            prompt_col = settings.mongodb_prompt_collection
            prompts = []
            default_prompt = None
            if prompt_col in existing_cols:
                raw_prompts = list(self.db[prompt_col].find({"user_id": user_id}, {"_id": 0}))
                prompts = sanitize_doc(raw_prompts)
                for p in prompts:
                    if p.get("is_default") or p.get("type") == "system":
                        default_prompt = p.get("prompt_text")
                        break

            # 3. MCP Servers (checks configured collection name, with 'mcp' fallback)
            mcp_col = settings.mongodb_mcp_collection if settings.mongodb_mcp_collection in existing_cols else (
                "mcp" if "mcp" in existing_cols else None
            )
            mcp_servers = []
            if mcp_col:
                raw_mcp = list(self.db[mcp_col].find({"user_id": user_id}, {"_id": 0}))
                mcp_servers = sanitize_doc(raw_mcp)

            return {
                "user_id": user_id,
                "model_config": model_config,
                "prompts": prompts,
                "default_prompt": default_prompt,
                "mcp_servers": mcp_servers,
            }
        except Exception as e:
            logger.error(f"Failed to fetch user config for '{user_id}': {e}")
            raise


    def find_session_data(self, user_id: str, session_id: str) -> Dict[str, Any]:
        """
        Fetches only the session data for a user from the session collection.
        Returns an empty dict if no session data is found.
        """
        try:
            session_col = settings.mongodb_session_collection
            if session_col in self.db.list_collection_names():
                session_doc = self.db[session_col].find_one({"user_id": user_id, "session_id": session_id}, {"_id": 0})
                return sanitize_doc(session_doc) if session_doc else {}

        except Exception as e:
            logger.error(f"Failed to fetch session data for '{user_id}': {e}")
            raise

    

if __name__ == "__main__":
    # Example usage
    mongo_service = MongoDBService()
    user_id = "83ff6e6"
    user_config = mongo_service.get_user_config(user_id)
    print(f"User Config: {user_config.get("model_config")}")
