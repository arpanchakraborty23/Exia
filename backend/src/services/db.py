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




class MongoServices:
    """Responsibility: Manage MongoDB Connection + CRUD.

    Each CRUD operation manages its own connection lifecycle
    (connect -> operate -> disconnect). Callers only provide data
    (filter / document / update) and never call connect/disconnect.
    """

    def __init__(self, url: str, db: str, collection: str):
        self.url = url
        self.db = db
        self.collection_name = collection
        self.client = None
        self.collection = None

    def connect(self):
        self.client, self.collection = MongoDBValidation.mongo_credentials(
            url=self.url, db=self.db, collection=self.collection_name
        )
        return self.collection

    def disconnect(self):
        if self.client:
            self.client.close()
            self.client = None
            self.collection = None
            logger.info("🧹 MongoDB connection closed.")

    # ---------- Create ----------

    def insert_one(self, document: dict):
        """Insert a single document. Caller provides only the document."""
        try:
            collection = self.connect()
            return collection.insert_one(document)
        except Exception as e:
            logger.error(f"❌ insert_one failed: {e}")
            raise
        finally:
            self.disconnect()

    def insert_many(self, documents: list):
        """Insert multiple documents. Caller provides only the list."""
        try:
            collection = self.connect()
            return collection.insert_many(documents)
        except Exception as e:
            logger.error(f"❌ insert_many failed: {e}")
            raise
        finally:
            self.disconnect()

    # ---------- Read ----------

    def find_one(self, filter: dict, projection: dict | None = None):
        """Find a single document by filter. Caller provides only the filter."""
        try:
            collection = self.connect()
            return collection.find_one(filter, projection)
        except Exception as e:
            logger.error(f"❌ find_one failed: {e}")
            raise
        finally:
            self.disconnect()

    def find_many(
        self,
        filter: dict | None = None,
        projection: dict | None = None,
        sort: list | None = None,
        limit: int = 0,
        skip: int = 0,
    ) -> list:
        """Find multiple documents. Caller provides only query options."""
        try:
            collection = self.connect()
            cursor = collection.find(filter or {}, projection)
            if sort:
                cursor = cursor.sort(sort)
            if skip:
                cursor = cursor.skip(skip)
            if limit:
                cursor = cursor.limit(limit)
            return list(cursor)
        except Exception as e:
            logger.error(f"❌ find_many failed: {e}")
            raise
        finally:
            self.disconnect()

    def count_documents(self, filter: dict | None = None) -> int:
        """Count documents matching a filter."""
        try:
            collection = self.connect()
            return collection.count_documents(filter or {})
        except Exception as e:
            logger.error(f"❌ count_documents failed: {e}")
            raise
        finally:
            self.disconnect()

    def exists(self, filter: dict) -> bool:
        """Check if at least one document matches the filter."""
        try:
            collection = self.connect()
            return collection.find_one(filter, {"_id": 1}) is not None
        except Exception as e:
            logger.error(f"❌ exists failed: {e}")
            raise
        finally:
            self.disconnect()

    # ---------- Update ----------

    def update_one(self, filter: dict, update: dict, upsert: bool = False):
        """Update a single document. Caller provides filter + update."""
        try:
            collection = self.connect()
            return collection.update_one(filter, update, upsert=upsert)
        except Exception as e:
            logger.error(f"❌ update_one failed: {e}")
            raise
        finally:
            self.disconnect()

    def update_many(self, filter: dict, update: dict, upsert: bool = False):
        """Update multiple documents. Caller provides filter + update."""
        try:
            collection = self.connect()
            return collection.update_many(filter, update, upsert=upsert)
        except Exception as e:
            logger.error(f"❌ update_many failed: {e}")
            raise
        finally:
            self.disconnect()

    # ---------- Delete ----------

    def delete_one(self, filter: dict):
        """Delete a single document. Caller provides only the filter."""
        try:
            collection = self.connect()
            return collection.delete_one(filter)
        except Exception as e:
            logger.error(f"❌ delete_one failed: {e}")
            raise
        finally:
            self.disconnect()

    def delete_many(self, filter: dict):
        """Delete multiple documents. Caller provides only the filter."""
        try:
            collection = self.connect()
            return collection.delete_many(filter)
        except Exception as e:
            logger.error(f"❌ delete_many failed: {e}")
            raise
        finally:
            self.disconnect()