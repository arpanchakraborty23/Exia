from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic.aliases import AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[
            PROJECT_ROOT / ".env",
            BACKEND_DIR / ".env",
            ".env",
        ],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # JWT
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    
    # livekit
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_api_host: str = Field(
        default="",
        validation_alias=AliasChoices(
            "livekit_api_host", "livekit_url", "livekit_host", "livekit_api_url"
        ),
    )

    # Mongodb
    mongodb_uri: str = ""
    mongodb_database: str = ""
    mongodb_user_collection: str = ""
    mongodb_session_collection: str = ""
    mongodb_sesison_summary: str = ""  # (Typo note: consider renaming to session_summary)
    mongodb_mcp_collection: str = Field(
        default="",
        validation_alias=AliasChoices(
            "mongodb_mcp_collection", "mongodb_mcp_collections"
        ),
    )
    mongodb_prompt_collection: str = Field(
        default="prompts",
        validation_alias=AliasChoices(
            "mongodb_prompt_collection", "mongodb_prompt_collections"
        ),
    )
    mongodb_model_collection: str = Field(
        default="model_config",
        validation_alias=AliasChoices(
            "mongodb_model_collection", "mongodb_model_collections"
        ),
    )
    mongodb_blacklist_collection: str = Field(
        default="token_blacklist",
        validation_alias=AliasChoices(
            "mongodb_blacklist_collection", "mongodb_token_blacklist"
        ),
    )

# The standard Pydantic singleton pattern
@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Loads and caches the configuration variables from the environment or .env file."""
    return Settings()
