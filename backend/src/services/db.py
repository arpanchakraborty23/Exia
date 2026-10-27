import logging
from pymongo import MongoClient
from pymongo.errors import OperationFailure

logger = logging.getLogger("mongodb")


class MongoDBValidation:
    """Single Class Validate MongoDB Credentials"""

    @staticmethod
    def mongo_credentials(url: str, db: str, collection: str):
        """
        Validate MongoDB connection, database, and collection.

        Args:
            url (str): MongoDB connection string
            db (str): Database name
            collection (str): Collection name

        Returns:
            tuple: (MongoClient, collection_name)
        """
        if not url:
            raise ValueError(
                "MongoDB connection URL is empty. Please ensure 'MONGODB_URI' is set in your .env file."
            )
        if not db:
            raise ValueError(
                "MongoDB database name is empty. Please ensure 'MONGODB_DATABASE' is set in your .env file."
            )

        client = None
        try:
            client = MongoClient(url, serverSelectionTimeoutMS=5000)
            client.admin.command("ping")  # Test connection

            database = client[db]
            if collection not in database.list_collection_names():
                logger.warning(
                    f"✅ Connected to MongoDB, but collection '{collection}' not found in '{db}'."
                )
            else:
                logger.info(f"✅ MongoDB credentials valid. Connected to '{db}.{collection}'.")

            return client, database[collection]

        except OperationFailure as e:
            logger.error(f"❌ MongoDB Authentication failed: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ MongoDB Connection error: {e}")
            raise




import copy
import json
import logging
import time
from typing import Any, Dict, List, Optional, Tuple
from pymongo import MongoClient
from pymongo.errors import OperationFailure

logger = logging.getLogger("mongodb")

# ==============================================================================
# Persistent Connection Pool & In-Memory Query Cache
# ==============================================================================

# Shared connection pool per MongoDB URI
_CLIENT_POOL: Dict[str, MongoClient] = {}

# In-memory query cache: key -> (expire_timestamp, data)
_QUERY_CACHE: Dict[str, Tuple[float, Any]] = {}

# Default cache TTL in seconds for read queries
DEFAULT_CACHE_TTL_SECONDS = 60.0


def _serialize_query_arg(arg: Any) -> str:
    """Helper to convert query arguments into a deterministic string key."""
    if arg is None:
        return ""
    try:
        return json.dumps(arg, sort_keys=True, default=str)
    except Exception:
        return str(arg)


def get_cached_query(key: str) -> Optional[Any]:
    """Retrieve unexpired query result from in-memory cache."""
    entry = _QUERY_CACHE.get(key)
    if not entry:
        return None
    expires_at, data = entry
    if time.time() > expires_at:
        _QUERY_CACHE.pop(key, None)
        return None
    # Return a deep copy to prevent in-place mutation of cached dictionaries
    return copy.deepcopy(data)


def set_cached_query(key: str, data: Any, ttl: float = DEFAULT_CACHE_TTL_SECONDS) -> None:
    """Store query result in memory with expiration timestamp."""
    _QUERY_CACHE[key] = (time.time() + ttl, copy.deepcopy(data))


def invalidate_collection_cache(collection_name: Optional[str] = None) -> None:
    """
    Invalidates in-memory cache.
    If collection_name is provided, invalidates all keys for that collection.
    If None, invalidates the entire cache.
    """
    if collection_name is None:
        _QUERY_CACHE.clear()
        logger.info("🧹 In-memory database cache fully cleared.")
        return

    prefix = f"{collection_name}:"
    keys_to_remove = [k for k in _QUERY_CACHE if k.startswith(prefix)]
    for k in keys_to_remove:
        _QUERY_CACHE.pop(k, None)
    if keys_to_remove:
        logger.info("🧹 Cache invalidated for collection '%s' (%d keys removed).", collection_name, len(keys_to_remove))


class MongoDBValidation:
    """Persistent connection provider and credential validator."""

    @staticmethod
    def get_pooled_client(url: str) -> MongoClient:
        """Returns a persistent, connection-pooled MongoClient instance."""
        if not url:
            raise ValueError(
                "MongoDB connection URL is empty. Please ensure 'MONGODB_URI' is set in your .env file."
            )

        if url in _CLIENT_POOL:
            client = _CLIENT_POOL[url]
            try:
                # Ping once to check alive
                client.admin.command("ping")
                return client
            except Exception:
                logger.warning("Pooled MongoClient disconnected, reconnecting...")
                try:
                    client.close()
                except Exception:
                    pass
                _CLIENT_POOL.pop(url, None)

        try:
            client = MongoClient(
                url,
                maxPoolSize=50,
                minPoolSize=5,
                maxIdleTimeMS=45000,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
            )
            client.admin.command("ping")
            _CLIENT_POOL[url] = client
            logger.info("✅ Established persistent connection pool to MongoDB.")
            return client
        except OperationFailure as e:
            logger.error(f"❌ MongoDB Authentication failed: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ MongoDB Connection error: {e}")
            raise

    @staticmethod
    def mongo_credentials(url: str, db: str, collection: str):
        """
        Validate MongoDB connection, database, and collection using connection pool.

        Returns:
            tuple: (MongoClient, Collection)
        """
        if not db:
            raise ValueError(
                "MongoDB database name is empty. Please ensure 'MONGODB_DATABASE' is set in your .env file."
            )
        client = MongoDBValidation.get_pooled_client(url)
        database = client[db]
        return client, database[collection]


class MongoServices:
    """
    High-Performance MongoDB Service:
      - Uses persistent connection pooling (no reconnect/disconnect per call).
      - In-memory read caching with configurable TTL (fetches once, reuses from memory).
      - Automatic cache invalidation on inserts, updates, and deletes.
    """

    def __init__(self, url: str, db: str, collection: str):
        self.url = url
        self.db = db
        self.collection_name = collection

    def _get_collection(self):
        _, collection = MongoDBValidation.mongo_credentials(
            url=self.url, db=self.db, collection=self.collection_name
        )
        return collection

    def disconnect(self):
        """No-op to keep the persistent connection pool active across requests."""
        pass

    # ---------- Create ----------

    def insert_one(self, document: dict):
        """Insert a single document and invalidate collection cache."""
        try:
            collection = self._get_collection()
            result = collection.insert_one(document)
            invalidate_collection_cache(self.collection_name)
            return result
        except Exception as e:
            logger.error(f"❌ insert_one failed on '{self.collection_name}': {e}")
            raise

    def insert_many(self, documents: list):
        """Insert multiple documents and invalidate collection cache."""
        try:
            collection = self._get_collection()
            result = collection.insert_many(documents)
            invalidate_collection_cache(self.collection_name)
            return result
        except Exception as e:
            logger.error(f"❌ insert_many failed on '{self.collection_name}': {e}")
            raise

    # ---------- Read (Cached) ----------

    def find_one(
        self,
        filter: dict,
        projection: dict | None = None,
        use_cache: bool = True,
        ttl: float = DEFAULT_CACHE_TTL_SECONDS,
    ):
        """Find a single document by filter, returning from in-memory cache when available."""
        cache_key = f"{self.collection_name}:find_one:{_serialize_query_arg(filter)}:{_serialize_query_arg(projection)}"
        if use_cache:
            cached = get_cached_query(cache_key)
            if cached is not None:
                return cached

        try:
            collection = self._get_collection()
            doc = collection.find_one(filter, projection)
            if doc is not None and use_cache:
                set_cached_query(cache_key, doc, ttl=ttl)
            return doc
        except Exception as e:
            logger.error(f"❌ find_one failed on '{self.collection_name}': {e}")
            raise

    def find_many(
        self,
        filter: dict | None = None,
        projection: dict | None = None,
        sort: list | None = None,
        limit: int = 0,
        skip: int = 0,
        use_cache: bool = True,
        ttl: float = DEFAULT_CACHE_TTL_SECONDS,
    ) -> list:
        """Find multiple documents, returning from in-memory cache when available."""
        cache_key = (
            f"{self.collection_name}:find_many:"
            f"{_serialize_query_arg(filter)}:{_serialize_query_arg(projection)}:"
            f"{_serialize_query_arg(sort)}:{limit}:{skip}"
        )
        if use_cache:
            cached = get_cached_query(cache_key)
            if cached is not None:
                return cached

        try:
            collection = self._get_collection()
            cursor = collection.find(filter or {}, projection)
            if sort:
                cursor = cursor.sort(sort)
            if skip:
                cursor = cursor.skip(skip)
            if limit:
                cursor = cursor.limit(limit)
            result = list(cursor)
            if use_cache:
                set_cached_query(cache_key, result, ttl=ttl)
            return result
        except Exception as e:
            logger.error(f"❌ find_many failed on '{self.collection_name}': {e}")
            raise

    def count_documents(
        self,
        filter: dict | None = None,
        use_cache: bool = True,
        ttl: float = DEFAULT_CACHE_TTL_SECONDS,
    ) -> int:
        """Count documents matching a filter, utilizing cache when available."""
        cache_key = f"{self.collection_name}:count:{_serialize_query_arg(filter)}"
        if use_cache:
            cached = get_cached_query(cache_key)
            if cached is not None:
                return cached

        try:
            collection = self._get_collection()
            count = collection.count_documents(filter or {})
            if use_cache:
                set_cached_query(cache_key, count, ttl=ttl)
            return count
        except Exception as e:
            logger.error(f"❌ count_documents failed on '{self.collection_name}': {e}")
            raise

    def exists(
        self,
        filter: dict,
        use_cache: bool = True,
        ttl: float = DEFAULT_CACHE_TTL_SECONDS,
    ) -> bool:
        """Check if at least one document matches filter using cache when available."""
        cache_key = f"{self.collection_name}:exists:{_serialize_query_arg(filter)}"
        if use_cache:
            cached = get_cached_query(cache_key)
            if cached is not None:
                return cached

        try:
            collection = self._get_collection()
            has_doc = collection.find_one(filter, {"_id": 1}) is not None
            if use_cache:
                set_cached_query(cache_key, has_doc, ttl=ttl)
            return has_doc
        except Exception as e:
            logger.error(f"❌ exists failed on '{self.collection_name}': {e}")
            raise

    # ---------- Update ----------

    def update_one(self, filter: dict, update: dict, upsert: bool = False):
        """Update a single document and invalidate collection cache."""
        try:
            collection = self._get_collection()
            result = collection.update_one(filter, update, upsert=upsert)
            invalidate_collection_cache(self.collection_name)
            return result
        except Exception as e:
            logger.error(f"❌ update_one failed on '{self.collection_name}': {e}")
            raise

    def update_many(self, filter: dict, update: dict, upsert: bool = False):
        """Update multiple documents and invalidate collection cache."""
        try:
            collection = self._get_collection()
            result = collection.update_many(filter, update, upsert=upsert)
            invalidate_collection_cache(self.collection_name)
            return result
        except Exception as e:
            logger.error(f"❌ update_many failed on '{self.collection_name}': {e}")
            raise

    # ---------- Delete ----------

    def delete_one(self, filter: dict):
        """Delete a single document and invalidate collection cache."""
        try:
            collection = self._get_collection()
            result = collection.delete_one(filter)
            invalidate_collection_cache(self.collection_name)
            return result
        except Exception as e:
            logger.error(f"❌ delete_one failed on '{self.collection_name}': {e}")
            raise

    def delete_many(self, filter: dict):
        """Delete multiple documents and invalidate collection cache."""
        try:
            collection = self._get_collection()
            result = collection.delete_many(filter)
            invalidate_collection_cache(self.collection_name)
            return result
        except Exception as e:
            logger.error(f"❌ delete_many failed on '{self.collection_name}': {e}")
            raise
