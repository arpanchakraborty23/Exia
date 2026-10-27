"""
Exia Desktop Bootstrap & First-Run Configuration Manager.

Handles detection of unconfigured environments, live MongoDB connectivity
verification, initial operator user creation, and persistent configuration
storage in %APPDATA%/Exia/.env or portable ./.env.
"""

import os
import sys
import secrets
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

from pymongo import MongoClient
import bcrypt

logger = logging.getLogger("desktop_bootstrap")


def get_appdata_dir() -> Path:
    """Returns the persistent user data directory for Exia on the desktop."""
    appdata = os.environ.get("APPDATA")
    if appdata:
        target = Path(appdata) / "Exia"
    else:
        target = Path.home() / ".exia"
    target.mkdir(parents=True, exist_ok=True)
    return target


def is_system_configured() -> bool:
    """
    Checks if the system has valid MongoDB and JWT configurations.
    Returns False if .env is missing or contains template placeholders.
    """
    from src.constants.config import get_candidate_env_files, get_settings

    # 1. Check if any candidate env file physically exists
    candidate_files = get_candidate_env_files()
    found_env = any(f.exists() for f in candidate_files)
    if not found_env:
        return False

    # 2. Check settings values
    try:
        settings = get_settings()
        uri = (settings.mongodb_uri or "").strip()
        jwt_sec = (settings.jwt_secret or "").strip()

        # Reject empty or template placeholders
        if not uri or "<username>" in uri or "replace_with" in uri:
            return False
        if not jwt_sec or "replace_with" in jwt_sec:
            return False

        return True
    except Exception as e:
        logger.warning("Configuration verification check: %s", e)
        return False


def test_mongodb_connection(uri: str) -> Dict[str, Any]:
    """Tests live connection to the specified MongoDB URI."""
    if not uri or not uri.strip():
        return {"status": "error", "message": "MongoDB connection URI cannot be empty."}

    client = None
    try:
        clean_uri = uri.strip()
        client = MongoClient(clean_uri, serverSelectionTimeoutMS=4000, connectTimeoutMS=4000)
        client.admin.command("ping")
        return {
            "status": "ok",
            "message": "Connected to MongoDB successfully!",
        }
    except Exception as err:
        logger.error("MongoDB test connection failed: %s", err)
        return {
            "status": "error",
            "message": f"Connection failed: {str(err)}",
        }
    finally:
        if client:
            try:
                client.close()
            except Exception:
                pass


def save_initial_setup(
    mongodb_uri: str,
    mongodb_database: Optional[str] = "exia_db",
    livekit_url: Optional[str] = "",
    livekit_api_key: Optional[str] = "",
    livekit_api_secret: Optional[str] = "",
    operator_name: Optional[str] = "Operator",
    operator_email: Optional[str] = "admin@exia.local",
    operator_password: Optional[str] = "",
) -> Dict[str, Any]:
    """
    Validates credentials, creates the initial operator account in MongoDB,
    generates a secure JWT secret, and saves persistent .env configuration.
    """
    clean_uri = (mongodb_uri or "").strip()
    clean_db = (mongodb_database or "exia_db").strip()

    if not clean_uri:
        raise ValueError("MongoDB URI is required")

    # 1. Test live connection
    conn_result = test_mongodb_connection(clean_uri)
    if conn_result["status"] != "ok":
        raise ValueError(conn_result["message"])

    # 2. Generate cryptographically strong JWT Secret
    jwt_secret = secrets.token_hex(32)

    # 3. Seed Operator Account in MongoDB if password provided
    user_id = f"usr_{secrets.token_hex(4)}"
    clean_email = (operator_email or "admin@exia.local").strip().lower()
    clean_name = (operator_name or "Operator").strip()

    if operator_password and len(operator_password) >= 6:
        client = MongoClient(clean_uri, serverSelectionTimeoutMS=5000)
        try:
            db = client[clean_db]
            users_col = db["users"]

            # Hash password with bcrypt
            pwd_bytes = operator_password.encode("utf-8")[:72]
            salt = bcrypt.gensalt()
            hash_pw = bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

            # Insert or update operator document
            now_iso = datetime.now(timezone.utc).isoformat()
            users_col.update_one(
                {"email": clean_email},
                {
                    "$set": {
                        "user_id": user_id,
                        "name": clean_name,
                        "email": clean_email,
                        "hash_password": hash_pw,
                        "role": "operator",
                        "preferences": {"theme": "dark", "default_pipeline": "modular"},
                        "updated_at": now_iso,
                    },
                    "$setOnInsert": {
                        "created_at": now_iso,
                    },
                },
                upsert=True,
            )
            logger.info("✅ Operator account '%s' seeded into MongoDB.", clean_email)
        finally:
            client.close()

    # 4. Save to persistent APPDATA .env
    target_env = get_appdata_dir() / ".env"
    env_content = f"""# Exia Desktop Persistent Configuration
# Generated on {datetime.now(timezone.utc).isoformat()}

# Authentication & Security
JWT_SECRET={jwt_secret}
JWT_ALGORITHM=HS256

# LiveKit SFU Realtime Gateway
LIVEKIT_API_HOST={(livekit_url or '').strip()}
LIVEKIT_API_KEY={(livekit_api_key or '').strip()}
LIVEKIT_API_SECRET={(livekit_api_secret or '').strip()}

# MongoDB Database
MONGODB_URI={clean_uri}
MONGODB_DATABASE={clean_db}
MONGODB_USER_COLLECTION=users
MONGODB_SESSION_COLLECTION=sessions
MONGODB_MCP_COLLECTION=mcp_servers
MONGODB_PROMPT_COLLECTION=prompts
MONGODB_MODEL_COLLECTION=model_config
MONGODB_BLACKLIST_COLLECTION=token_blacklist
"""
    target_env.write_text(env_content, encoding="utf-8")
    logger.info("✅ Saved desktop environment configuration to: %s", target_env)

    # 5. Clear cached Pydantic settings so the server instantly reloads the new .env
    try:
        from src.constants.config import get_settings
        get_settings.cache_clear()
    except Exception:
        pass

    return {
        "status": "success",
        "message": "Desktop setup completed successfully!",
        "config_path": str(target_env),
        "user_email": clean_email,
    }


def parse_env_text(raw_text: str) -> Dict[str, str]:
    """Parses raw .env file text into a dictionary of key-value pairs."""
    env_vars: Dict[str, str] = {}
    for line in raw_text.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#"):
            continue
        if "=" in trimmed:
            key, val = trimmed.split("=", 1)
            key = key.strip()
            val = val.strip()
            # Remove surrounding matching quotes
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            if key:
                env_vars[key] = val
    return env_vars


def confirm_and_save_env(
    raw_env_content: str,
    operator_password: Optional[str] = "",
    operator_email: Optional[str] = "admin@exia.local",
    operator_name: Optional[str] = "Operator",
) -> Dict[str, Any]:
    """
    Parses full .env text provided by developer, tests MongoDB connection live with code,
    generates missing tokens if needed, seeds operator account, and saves to %APPDATA%/Exia/.env.
    """
    if not raw_env_content or not raw_env_content.strip():
        raise ValueError(".env content cannot be empty. Please paste your .env file.")

    env_map = parse_env_text(raw_env_content)
    
    # Check MongoDB URI
    mongo_uri = env_map.get("MONGODB_URI", "").strip()
    if not mongo_uri or "<username>" in mongo_uri or "replace_with" in mongo_uri:
        raise ValueError("Invalid MONGODB_URI in .env. Please provide a valid MongoDB connection string.")

    # 1. Confirm live connection with code
    conn_result = test_mongodb_connection(mongo_uri)
    if conn_result["status"] != "ok":
        raise ValueError(f"MongoDB connection check failed: {conn_result['message']}")

    # 2. Ensure JWT_SECRET is cryptographically valid
    jwt_secret = env_map.get("JWT_SECRET", "").strip()
    if not jwt_secret or "replace_with" in jwt_secret or len(jwt_secret) < 16:
        jwt_secret = secrets.token_hex(32)
        env_map["JWT_SECRET"] = jwt_secret

    # Default DB & Collections if not set
    if "MONGODB_DATABASE" not in env_map or not env_map["MONGODB_DATABASE"].strip():
        env_map["MONGODB_DATABASE"] = "exia_db"
    if "JWT_ALGORITHM" not in env_map:
        env_map["JWT_ALGORITHM"] = "HS256"

    clean_db = env_map["MONGODB_DATABASE"].strip()

    # 3. Seed operator user in MongoDB if password given
    clean_email = (operator_email or "admin@exia.local").strip().lower()
    clean_name = (operator_name or "Operator").strip()

    if operator_password and len(operator_password) >= 6:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        try:
            db = client[clean_db]
            users_col = db["users"]
            pwd_bytes = operator_password.encode("utf-8")[:72]
            salt = bcrypt.gensalt()
            hash_pw = bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")
            now_iso = datetime.now(timezone.utc).isoformat()
            user_id = f"usr_{secrets.token_hex(4)}"

            users_col.update_one(
                {"email": clean_email},
                {
                    "$set": {
                        "user_id": user_id,
                        "name": clean_name,
                        "email": clean_email,
                        "hash_password": hash_pw,
                        "role": "operator",
                        "preferences": {"theme": "dark", "default_pipeline": "modular"},
                        "updated_at": now_iso,
                    },
                    "$setOnInsert": {
                        "created_at": now_iso,
                    },
                },
                upsert=True,
            )
            logger.info("✅ Operator account '%s' seeded successfully into MongoDB.", clean_email)
        finally:
            client.close()

    # 4. Write verified .env to %APPDATA%/Exia/.env
    target_env = get_appdata_dir() / ".env"
    
    # Reconstruct formatted .env
    lines = [
        f"# Exia Desktop Verified Configuration",
        f"# Confirmed with code on {datetime.now(timezone.utc).isoformat()}",
        "",
    ]
    for k, v in env_map.items():
        lines.append(f"{k}={v}")
    
    lines.append("")
    target_env.write_text("\n".join(lines), encoding="utf-8")
    logger.info("✅ Verified configuration saved to: %s", target_env)

    # 5. Clear cached Pydantic settings
    try:
        from src.constants.config import get_settings
        get_settings.cache_clear()
    except Exception:
        pass

    return {
        "status": "success",
        "message": "Configuration confirmed with code and saved successfully!",
        "config_path": str(target_env),
        "variables_loaded": list(env_map.keys()),
        "user_email": clean_email,
    }

