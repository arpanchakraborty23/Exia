import os
from functools import lru_cache
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Base paths
SERVICES_DIR = Path(__file__).resolve().parent
SRC_DIR = SERVICES_DIR.parent
ASSISTANT_DIR = SRC_DIR.parent
PROJECT_ROOT = ASSISTANT_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"

def load_environment():
    """
    Loads environment variables from candidates prioritizing:
      1. assistant/.env
      2. backend/.env
      3. root .env
    """
    candidates = [
        ASSISTANT_DIR / ".env",
        ASSISTANT_DIR / ".env.local",
        BACKEND_DIR / ".env",
        PROJECT_ROOT / ".env",
    ]
    for env_path in candidates:
        if env_path.exists():
            load_dotenv(dotenv_path=env_path, override=False)

# Load environment on module import
load_environment()


def _get_env(key: str, default: Any = "", aliases: Optional[list] = None) -> Any:
    """Helper to fetch environment variable with fallback aliases."""
    val = os.getenv(key)
    if val is not None and val != "":
        return val
    if aliases:
        for alias in aliases:
            alias_val = os.getenv(alias)
            if alias_val is not None and alias_val != "":
                return alias_val
    return default


class Settings:
    """
    Centralized Configuration for Exia Assistant.
    Loads and normalizes all environment variables across services.
    """
    def __init__(self):
        # ----------------------------------------------------------------------
        # LiveKit WebRTC Configuration
        # ----------------------------------------------------------------------
        self.livekit_url: str = _get_env(
            "LIVEKIT_URL",
            default="ws://localhost:7880",
            aliases=["LIVEKIT_API_HOST", "LIVEKIT_HOST", "LIVEKIT_API_URL"],
        )
        self.livekit_api_key: str = _get_env("LIVEKIT_API_KEY", default="")
        self.livekit_api_secret: str = _get_env("LIVEKIT_API_SECRET", default="")
        self.livekit_room_name: str = _get_env("LIVEKIT_ROOM_NAME", default="exia-agent-room")

        # ----------------------------------------------------------------------
        # MongoDB Database & Collections
        # ----------------------------------------------------------------------
        self.mongodb_uri: str = _get_env(
            "MONGODB_URI",
            default="",
            aliases=["MONGO_URI"],
        )
        self.mongodb_database: str = _get_env(
            "MONGODB_DATABASE",
            default="Exia",
            aliases=["MONGODB_DB_NAME", "MONGO_DB_NAME"],
        )
     
        self.mongodb_session_collection: str = _get_env("MONGODB_SESSION_COLLECTION", default="sessions")
        self.mongodb_mcp_collection: str = _get_env(
            "MONGODB_MCP_COLLECTION",
            default="mcp_servers",
            aliases=["MONGODB_MCP_COLLECTIONS"],
        )
        self.mongodb_prompt_collection: str = _get_env(
            "MONGODB_PROMPT_COLLECTION",
            default="prompts",
            aliases=["MONGODB_PROMPT_COLLECTIONS"],
        )
        self.mongodb_model_collection: str = _get_env(
            "MONGODB_MODEL_COLLECTION",
            default="model_config",
            aliases=["MONGODB_MODEL_COLLECTIONS"],
        )
        self.mongodb_blacklist_collection: str = _get_env(
            "MONGODB_BLACKLIST_COLLECTION",
            default="token_blacklist",
            aliases=["MONGODB_TOKEN_BLACKLIST"],
        )
  

        # ----------------------------------------------------------------------
        # Redis Cache Configuration
        # ----------------------------------------------------------------------
        self.redis_host: str = _get_env(
            "REDIS_HOST",
            default="redis-10028.c1.us-central1-2.gce.cloud.redislabs.com",
        )
        self.redis_port: int = int(_get_env("REDIS_PORT", default=10028))
        self.redis_username: str = _get_env("REDIS_USERNAME", default="default")
        self.redis_password: str = _get_env(
            "REDIS_PASSWORD",
            default="X8JdvuET8yn7jKv98EBt56p2UZZpLcsd",
        )
        self.redis_ttl: int = int(_get_env("REDIS_TTL", default=3600))

        # ----------------------------------------------------------------------
        # Memory Layer (Mem0 & Qdrant)
        # ----------------------------------------------------------------------
        self.mem0_api_key: str = _get_env("MEM0_API_KEY", default="")
        self.qdrant_url: str = _get_env("QDRANT_URL", default="")
        self.qdrant_api_key: str = _get_env("QDRANT_API_KEY", default="")


        # ----------------------------------------------------------------------
        # JWT & Security (Backend Compatibility)
        # ----------------------------------------------------------------------
        self.jwt_secret: str = _get_env("JWT_SECRET", default="")
        self.jwt_algorithm: str = _get_env("JWT_ALGORITHM", default="HS256")
        self.model_config_encryption_key: str = _get_env(
            "MODEL_CONFIG_ENCRYPTION_KEY",
            default="",
        )

    def to_dict(self) -> Dict[str, Any]:
        """Returns all configuration key-value pairs (excluding passwords/secrets where sensitive)."""
        return {
            k: v for k, v in self.__dict__.items()
            if not k.startswith("_")
        }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Returns cached singleton instance of Settings."""
    return Settings()


# Convenient module-level singleton instance
settings = get_settings()
