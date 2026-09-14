from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    
    # livekit 
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_api_host: str = ""

    # Mongodb
    mongodb_uri: str = ""
    mongodb_database: str = ""
    mongodb_session_collection: str = ""
    mongodb_sesison_summary: str = ""  # (Typo note: consider renaming to session_summary)
    mongodb_mcp_collections: str = ""

# The standard Pydantic singleton pattern
@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Loads and caches the configuration variables from the environment or .env file."""
    return Settings()
