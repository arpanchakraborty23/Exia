import os
import sys
from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic.aliases import AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent


def get_candidate_env_files() -> list[Path]:
    """Returns candidate .env paths prioritizing local workspace and user config."""
    candidates = [
        Path.cwd() / ".env",
        PROJECT_ROOT / ".env",
        BACKEND_DIR / ".env",
    ]

    appdata = os.environ.get("APPDATA")
    if appdata:
        candidates.append(Path(appdata) / "Exia" / ".env")
    else:
        candidates.append(Path.home() / ".exia" / ".env")

    existing = [p for p in candidates if p.exists()]
    return existing if existing else candidates


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=get_candidate_env_files(),
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
    mongodb_database: str = "exia_db"
    mongodb_user_collection: str = "users"
    mongodb_session_collection: str = "sessions"
    mongodb_sesison_summary: str = "session_summary"  # (Typo note: consider renaming to session_summary)
    mongodb_mcp_collection: str = Field(
        default="mcp_servers",
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
    candidate_files = get_candidate_env_files()
    try:
        return Settings(_env_file=tuple(candidate_files))
    except Exception:
        return Settings()
