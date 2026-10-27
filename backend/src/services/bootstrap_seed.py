"""
Exia Database Auto-Seeder & Environment Bootstrapper.

Ensures that whenever Exia Desktop starts up against an empty or fresh MongoDB,
it automatically seeds essential initial records (Operator user, Model Configuration,
System Prompts, and MCP Servers) so the UI is immediately functional and never
displays empty/broken screens.
"""

import logging
import secrets
from datetime import datetime, timezone
import bcrypt

from src.constants import get_settings
from src.services.db import MongoServices

logger = logging.getLogger("bootstrap_seed")


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def seed_database_if_empty():
    """Seeds default records if collections are empty."""
    settings = get_settings()
    if not settings.mongodb_uri:
        return

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Seed Default Operator User
    try:
        user_db = MongoServices(settings.mongodb_uri, settings.mongodb_database, settings.mongodb_user_collection or "users")
        existing_users = user_db.find_many({}, limit=1)
        if not existing_users:
            logger.info("🌱 Seeding default operator accounts into MongoDB...")
            hashed_pw = hash_password("admin")
            operator_data = {
                "user_id": "usr_admin",
                "name": "Operator",
                "email": "admin@exia.local",
                "hash_password": hashed_pw,
                "role": "operator",
                "preferences": {"theme": "dark", "default_pipeline": "realtime"},
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            user_db.insert_one(operator_data)

            # Also add 'admin' alias so signing in with either 'admin' or 'admin@exia.local' works
            admin_alias = {
                "user_id": "usr_admin",
                "name": "Operator",
                "email": "admin",
                "hash_password": hashed_pw,
                "role": "operator",
                "preferences": {"theme": "dark", "default_pipeline": "realtime"},
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            user_db.insert_one(admin_alias)
            logger.info("✅ Default operator accounts ('admin@exia.local' and 'admin') seeded.")
    except Exception as e:
        logger.warning("Could not auto-seed user: %s", e)

    # 2. Seed Default Model Configuration
    try:
        model_db = MongoServices(settings.mongodb_uri, settings.mongodb_database, settings.mongodb_model_collection or "model_config")
        existing_config = model_db.find_many({}, limit=1)
        if not existing_config:
            logger.info("🌱 Seeding default model configuration into MongoDB...")
            default_config = {
                "user_id": "usr_admin",
                "config": {
                    "mode": "gemini_live",
                    "pipeline_mode": "gemini_live",
                    "gemini_model": "gemini-2.0-flash",
                    "gemini_voice": "Charon",
                    "stt_provider": "speechmatics",
                    "stt_model": "linden-1",
                    "llm_provider": "anthropic",
                    "llm_model": "claude-3-5-sonnet-latest",
                    "tts_provider": "cartesia",
                    "tts_model": "sonic-3.6",
                    "temperature": 0.7,
                    "top_p": 0.95,
                    "max_output_tokens": 1024,
                    "livekit": {
                        "url": settings.livekit_api_host or "wss://exia-agent.livekit.cloud",
                        "apiKey": settings.livekit_api_key or "devkey",
                        "apiSecret": settings.livekit_api_secret or "secret",
                        "roomName": "exia-agent-room",
                    },
                },
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            model_db.insert_one(default_config)
            logger.info("✅ Default model configuration seeded.")
    except Exception as e:
        logger.warning("Could not auto-seed model config: %s", e)

    # 3. Seed Default System Prompts
    try:
        prompt_db = MongoServices(settings.mongodb_uri, settings.mongodb_database, settings.mongodb_prompt_collection or "prompts")
        existing_prompts = prompt_db.find_many({}, limit=1)
        if not existing_prompts:
            logger.info("🌱 Seeding default system prompts into MongoDB...")
            default_prompts = [
                {
                    "user_id": "usr_admin",
                    "title": "Executive Voice Operator",
                    "type": "system",
                    "prompt_text": "You are Exia, a high-fidelity synthetic autonomous voice agent. Provide crisp, authoritative, concise responses optimized for spoken delivery.",
                    "created_at": now_iso,
                    "updated_at": now_iso,
                },
                {
                    "user_id": "usr_admin",
                    "title": "Home Automation & IoT Master",
                    "type": "custom",
                    "prompt_text": "You orchestrate home automation devices via MCP tools and WebSockets. Always confirm state changes and execute tool calls with minimal latency.",
                    "created_at": now_iso,
                    "updated_at": now_iso,
                },
                {
                    "user_id": "usr_admin",
                    "title": "Technical Diagnostic Specialist",
                    "type": "custom",
                    "prompt_text": "You diagnose system telemetry, latency anomalies, and network pipelines. Report packet metrics clearly.",
                    "created_at": now_iso,
                    "updated_at": now_iso,
                },
            ]
            prompt_db.insert_many(default_prompts)
            logger.info("✅ Default prompts seeded.")
    except Exception as e:
        logger.warning("Could not auto-seed prompts: %s", e)

    # 4. Seed Default MCP Servers
    try:
        mcp_db = MongoServices(settings.mongodb_uri, settings.mongodb_database, settings.mongodb_mcp_collection or "mcp_servers")
        existing_mcp = mcp_db.find_many({}, limit=1)
        if not existing_mcp:
            logger.info("🌱 Seeding initial MCP servers into MongoDB...")
            default_servers = [
                {
                    "user_id": "usr_admin",
                    "server_name": "Home Assistant Core",
                    "transport": "sse",
                    "server_url": "http://localhost:8123/api/mcp",
                    "server_status": "active",
                    "created_at": now_iso,
                    "updated_at": now_iso,
                },
                {
                    "user_id": "usr_admin",
                    "server_name": "Local Diagnostic Tools",
                    "transport": "stdio",
                    "server_url": "python -m exia.tools.diagnostics",
                    "server_status": "active",
                    "created_at": now_iso,
                    "updated_at": now_iso,
                },
            ]
            mcp_db.insert_many(default_servers)
            logger.info("✅ Default MCP servers seeded.")
    except Exception as e:
        logger.warning("Could not auto-seed MCP servers: %s", e)
