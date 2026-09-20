import logging
from datetime import datetime, timezone

from .db import MongoServices
from src.constants import get_settings

# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


class TokenBlacklistServices:
    """Server-side revoked-token (jti) denylist. Backs POST /api/auth/logout."""

    def __init__(self):
        self.db = MongoServices(
            url=settings.mongodb_uri,
            db=settings.mongodb_database,
            collection=settings.mongodb_blacklist_collection or "token_blacklist",
        )

    def revoke(self, jti: str, exp: int | float | None = None) -> None:
        """Record a jti as revoked. exp is the token's unix expiry for cleanup."""
        if not jti:
            return
        try:
            expires_at = (
                datetime.fromtimestamp(exp, tz=timezone.utc)
                if exp
                else _now()
            )
            self.db.update_one(
                {"jti": jti},
                {"$set": {"jti": jti, "expires_at": expires_at, "revoked_at": _now()}},
                upsert=True,
            )
            # Best-effort prune of already-expired entries
            try:
                self.db.delete_many({"expires_at": {"$lt": _now()}})
            except Exception as prune_err:
                logger.warning("Token blacklist prune failed: %s", prune_err)
        except Exception as e:
            logger.error("Failed to revoke token: %s", e)
            raise

    def is_revoked(self, jti: str | None) -> bool:
        """Fail-open: DB errors return False so a Mongo blip doesn't lock everyone out."""
        if not jti:
            return False
        try:
            return self.db.exists({"jti": jti})
        except Exception as e:
            logger.warning("Token blacklist check failed (fail-open): %s", e)
            return False
