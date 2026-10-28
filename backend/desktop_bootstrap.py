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
    candidates = []
    if appdata:
        candidates.append(Path(appdata) / "Exia")
    candidates.append(Path.home() / ".exia")
    candidates.append(Path.cwd() / ".exia_data")

    for target in candidates:
        try:
            target.mkdir(parents=True, exist_ok=True)
            return target
        except Exception:
            continue
    return Path(".")


def create_desktop_shortcut(target_exe: Optional[Path] = None) -> bool:
    """
    Creates an Exia.lnk shortcut on the current user's Windows Desktop pointing to the executable.
    Uses Windows WScript.Shell via PowerShell. Returns True if created successfully.
    """
    if sys.platform != "win32":
        return False
    try:
        import subprocess
        if not target_exe:
            if getattr(sys, "frozen", False):
                target_exe = Path(sys.executable).resolve()
            else:
                candidates = [
                    Path(__file__).resolve().parent / "release" / "Exia.exe",
                    Path(__file__).resolve().parent / "dist" / "Exia.exe",
                ]
                for c in candidates:
                    if c.exists():
                        target_exe = c
                        break

        if not target_exe or not target_exe.exists():
            logger.debug("Shortcut target does not exist: %s", target_exe)
            return False

        icon_path = target_exe.parent / "exia-icon.ico"
        icon_arg = f'"{icon_path}"' if icon_path.exists() else f'"{target_exe},0"'

        ps_script = f"""
        $wsh = New-Object -ComObject WScript.Shell
        $desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
        $shortcut = $wsh.CreateShortcut("$desktop\\Exia.lnk")
        $shortcut.TargetPath = "{target_exe}"
        $shortcut.WorkingDirectory = "{target_exe.parent}"
        $shortcut.IconLocation = {icon_arg}
        $shortcut.Description = "Exia AI Voice & Reasoning Desktop Agent"
        $shortcut.Save()
        """
        res = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
            capture_output=True,
            text=True,
            timeout=8,
        )
        if res.returncode == 0:
            logger.info("✅ Desktop shortcut created: Exia.lnk")
            return True
        else:
            logger.warning("Failed to create desktop shortcut: %s", res.stderr)
            return False
    except Exception as e:
        logger.warning("Desktop shortcut creation error: %s", e)
        return False


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
    user_collection: Optional[str] = "users",
    session_collection: Optional[str] = "sessions",
    mcp_collection: Optional[str] = "mcp_servers",
    prompt_collection: Optional[str] = "prompts",
    model_collection: Optional[str] = "model_config",
    blacklist_collection: Optional[str] = "token_blacklist",
    jwt_secret: Optional[str] = "",
    jwt_algorithm: Optional[str] = "HS256",
    livekit_url: Optional[str] = "",
    livekit_api_key: Optional[str] = "",
    livekit_api_secret: Optional[str] = "",
    operator_name: Optional[str] = "Operator",
    operator_email: Optional[str] = "admin@exia.local",
    operator_password: Optional[str] = "",
) -> Dict[str, Any]:
    """
    Validates user credentials, creates the initial operator account in the user-specified
    MongoDB collection, establishes custom or generated JWT security tokens, and writes
    the one-time persistent .env configuration into %APPDATA%/Exia/.env.
    """
    clean_uri = (mongodb_uri or "").strip()
    clean_db = (mongodb_database or "exia_db").strip()
    clean_user_col = (user_collection or "users").strip()
    clean_session_col = (session_collection or "sessions").strip()
    clean_mcp_col = (mcp_collection or "mcp_servers").strip()
    clean_prompt_col = (prompt_collection or "prompts").strip()
    clean_model_col = (model_collection or "model_config").strip()
    clean_blacklist_col = (blacklist_collection or "token_blacklist").strip()
    clean_algorithm = (jwt_algorithm or "HS256").strip()

    if not clean_uri:
        raise ValueError("MongoDB URI is required")

    # 1. Test live connection with code
    conn_result = test_mongodb_connection(clean_uri)
    if conn_result["status"] != "ok":
        raise ValueError(conn_result["message"])

    # 2. Use user-specified JWT Secret or generate cryptographically secure 32-byte secret
    active_jwt_secret = (jwt_secret or "").strip()
    if not active_jwt_secret or len(active_jwt_secret) < 16 or "replace_with" in active_jwt_secret:
        active_jwt_secret = secrets.token_hex(32)

    # 3. Seed Operator Account in user's custom user collection if password provided
    user_id = f"usr_{secrets.token_hex(4)}"
    clean_email = (operator_email or "admin@exia.local").strip().lower()
    clean_name = (operator_name or "Operator").strip()

    if operator_password and len(operator_password) >= 6:
        client = MongoClient(clean_uri, serverSelectionTimeoutMS=5000)
        try:
            db = client[clean_db]
            users_col = db[clean_user_col]

            # Hash password with bcrypt
            pwd_bytes = operator_password.encode("utf-8")[:72]
            salt = bcrypt.gensalt()
            hash_pw = bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

            # Insert or update operator document in custom collection
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
            logger.info("✅ Operator account '%s' seeded into collection '%s'.", clean_email, clean_user_col)
        finally:
            client.close()

    # 4. Save one-time persistent APPDATA .env with user-configured collection names & JWT
    target_env = get_appdata_dir() / ".env"
    env_content = f"""# Exia Desktop Persistent User Configuration
# Generated on {datetime.now(timezone.utc).isoformat()}

# Authentication & Security
JWT_SECRET={active_jwt_secret}
JWT_ALGORITHM={clean_algorithm}

# LiveKit SFU Realtime Gateway
LIVEKIT_API_HOST={(livekit_url or '').strip()}
LIVEKIT_API_KEY={(livekit_api_key or '').strip()}
LIVEKIT_API_SECRET={(livekit_api_secret or '').strip()}

# MongoDB Database & Custom Collections
MONGODB_URI={clean_uri}
MONGODB_DATABASE={clean_db}
MONGODB_USER_COLLECTION={clean_user_col}
MONGODB_SESSION_COLLECTION={clean_session_col}
MONGODB_MCP_COLLECTION={clean_mcp_col}
MONGODB_PROMPT_COLLECTION={clean_prompt_col}
MONGODB_MODEL_COLLECTION={clean_model_col}
MONGODB_BLACKLIST_COLLECTION={clean_blacklist_col}
"""
    target_env.write_text(env_content, encoding="utf-8")
    logger.info("✅ Saved user desktop environment configuration to: %s", target_env)

    # 5. Clear cached Pydantic settings so the server instantly reloads the new .env
    try:
        from src.constants.config import get_settings
        get_settings.cache_clear()
    except Exception:
        pass

    # 6. Auto-create desktop shortcut with Exia icon if on Windows
    create_desktop_shortcut()

    return {
        "status": "success",
        "message": "Desktop configuration saved successfully! Launching Exia...",
        "config_path": str(target_env),
        "user_email": clean_email,
        "collections": {
            "users": clean_user_col,
            "sessions": clean_session_col,
            "mcp": clean_mcp_col,
            "prompts": clean_prompt_col,
            "models": clean_model_col,
            "blacklist": clean_blacklist_col,
        },
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

    # 6. Auto-create desktop shortcut with Exia icon if on Windows
    create_desktop_shortcut()

    return {
        "status": "success",
        "message": "Configuration confirmed with code and saved successfully!",
        "config_path": str(target_env),
        "variables_loaded": list(env_map.keys()),
        "user_email": clean_email,
    }


def update_env_variable(key: str, value: str) -> None:
    """Updates an environment variable in os.environ and persists it to all candidate .env files."""
    os.environ[key] = value
    try:
        from src.constants.config import get_candidate_env_files
        candidate_files = get_candidate_env_files()
    except Exception:
        candidate_files = [get_appdata_dir() / ".env"]

    target_files = [f for f in candidate_files if f.exists()]
    if not target_files:
        target_files = [get_appdata_dir() / ".env"]

    for target in target_files:
        try:
            content = target.read_text(encoding="utf-8") if target.exists() else ""
            lines = content.splitlines()
            found = False
            new_lines = []
            for line in lines:
                stripped = line.strip()
                if stripped.startswith(f"{key}=") or stripped.startswith(f"{key} ="):
                    new_lines.append(f"{key}={value}")
                    found = True
                else:
                    new_lines.append(line)
            if not found:
                new_lines.append(f"{key}={value}")
            target.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
            logger.info("Updated %s in %s", key, target)
        except Exception as e:
            logger.warning("Failed to write %s to %s: %s", key, target, e)

    try:
        from src.constants.config import get_settings
        get_settings.cache_clear()
    except Exception:
        pass

