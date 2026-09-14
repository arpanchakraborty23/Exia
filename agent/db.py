import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from pydantic import BaseModel, Field
import motor.motor_asyncio
from pymongo import UpdateOne
from pymongo.errors import ConnectionFailure

load_dotenv()
logger = logging.getLogger("home-assistant-db")

# Default local MongoDB or MongoDB Atlas URI
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "home_assistant")

# =============================================================================
# MONGO SCHEMAS: SESSIONS, MCP SERVERS, TOKEN METADATA & TASKS
# =============================================================================

class SessionSchema(BaseModel):
    """
    MongoDB Schema for 'sessions' collection.
    Tracks each LiveKit room connection session and its parameters.
    """
    session_id: str
    room_name: str
    identity: str
    participant_name: str = "Home Assistant User"
    status: str = "active"  # active, idle, terminated
    model_config: Dict[str, Any] = Field(default_factory=dict)
    memory_config: Dict[str, Any] = Field(default_factory=dict)
    voice_config: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class MCPServerSchema(BaseModel):
    """
    MongoDB Schema for 'mcp_servers' collection.
    Persists registered MCP servers, transport config, and discovered tool schemas.
    """
    server_id: str
    name: str
    transport: str  # stdio, sse, websocket
    command: Optional[str] = None
    args: Optional[List[str]] = None
    url: Optional[str] = None
    is_connected: bool = True
    tools: List[Dict[str, Any]] = Field(default_factory=list)
    session_id: Optional[str] = None
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class TokenMetadataSchema(BaseModel):
    """
    MongoDB Schema for 'token_metadata' collection.
    Stores the full metadata payload that was embedded into the LiveKit JWT token.
    """
    token_id: str
    session_id: str
    room_name: str
    identity: str
    token_preview: str
    metadata_payload: Dict[str, Any]
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class TaskSchema(BaseModel):
    """
    MongoDB Schema for 'tasks' collection.
    Stores daily tasks, priorities, and routines.
    """
    task_id: str
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "todo"  # todo, in_progress, completed
    due_date: Optional[str] = None
    category: str = "home"
    tags: List[str] = Field(default_factory=list)
    user_id: str = "desktop-user"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# =============================================================================
# MONGO DATABASE MANAGER
# =============================================================================

class MongoDBManager:
    """
    Async MongoDB Client using Motor.
    Manages separate collections for sessions, mcp_servers, token_metadata, and tasks.
    """
    def __init__(self, uri: Optional[str] = None, db_name: Optional[str] = None):
        self.uri = uri or MONGODB_URI
        self.db_name = db_name or MONGODB_DB_NAME
        self.client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
        self.db: Optional[motor.motor_asyncio.AsyncIOMotorDatabase] = None

    async def connect(self):
        if not self.uri or "<username>" in self.uri:
            # Try default local mongodb://localhost:27017
            test_uri = "mongodb://localhost:27017"
            try:
                self.client = motor.motor_asyncio.AsyncIOMotorClient(test_uri, serverSelectionTimeoutMS=2000)
                await self.client.admin.command('ping')
                self.db = self.client[self.db_name]
                logger.info(f"✅ Connected to Local MongoDB on {test_uri}, db='{self.db_name}'")
                await self._create_indexes()
                return True
            except Exception:
                logger.warning("⚠️ MongoDB is not accessible (neither MONGODB_URI nor local localhost:27017). Continuing in non-blocking mode.")
                return False

        try:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(
                self.uri,
                serverSelectionTimeoutMS=4000
            )
            await self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            logger.info(f"✅ Successfully connected to MongoDB database: '{self.db_name}'")
            await self._create_indexes()
            return True
        except ConnectionFailure as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ MongoDB error: {e}")
            return False

    async def _create_indexes(self):
        if self.db is None:
            return
        try:
            # 1. Sessions collection: Index by session_id and room_name
            await self.db.sessions.create_index("session_id", unique=True)
            await self.db.sessions.create_index([("room_name", 1), ("identity", 1)])

            # 2. MCP Servers collection: Index by server_id and name
            await self.db.mcp_servers.create_index("name", unique=True)
            await self.db.mcp_servers.create_index("session_id")

            # 3. Token Metadata collection: Index by token_id and session_id
            await self.db.token_metadata.create_index("token_id", unique=True)
            await self.db.token_metadata.create_index("session_id")

            # 4. Tasks collection: Index by task_id, status, and user_id
            await self.db.tasks.create_index("task_id", unique=True)
            await self.db.tasks.create_index([("status", 1), ("priority", 1)])
            await self.db.tasks.create_index("user_id")
        except Exception as e:
            logger.warning(f"Index creation note: {e}")

    # =========================================================================
    # PERSISTENCE METHODS: SESSION, MCP SERVERS & TOKEN METADATA
    # =========================================================================

    async def record_session(self, session: SessionSchema) -> bool:
        """Saves a new session document in the 'sessions' collection."""
        if self.db is None:
            await self.connect()
        if self.db is None:
            return False
        try:
            doc = session.model_dump()
            await self.db.sessions.update_one(
                {"session_id": session.session_id},
                {"$set": doc},
                upsert=True
            )
            logger.info(f"💾 Saved session '{session.session_id}' to MongoDB 'sessions' collection.")
            return True
        except Exception as e:
            logger.error(f"Error saving session to MongoDB: {e}")
            return False

    async def record_mcp_servers(self, servers: List[Dict[str, Any]], session_id: str) -> bool:
        """Upserts MCP server records into the 'mcp_servers' collection."""
        if self.db is None:
            await self.connect()
        if self.db is None or not servers:
            return False
        try:
            operations = []
            for s in servers:
                s_name = s.get("name", "unnamed_server")
                doc = {
                    "server_id": s.get("id") or f"mcp_{s_name.lower().replace(' ', '_')}",
                    "name": s_name,
                    "transport": s.get("transport", "stdio"),
                    "command": s.get("command"),
                    "args": s.get("args"),
                    "url": s.get("url"),
                    "tools": s.get("tools", []),
                    "session_id": session_id,
                    "updated_at": datetime.utcnow().isoformat()
                }
                operations.append(
                    UpdateOne({"name": s_name}, {"$set": doc}, upsert=True)
                )

            if operations:
                await self.db.mcp_servers.bulk_write(operations)
                logger.info(f"💾 Persisted {len(operations)} MCP servers to MongoDB 'mcp_servers' collection.")
            return True
        except Exception as e:
            logger.error(f"Error saving MCP servers to MongoDB: {e}")
            return False

    async def record_token_metadata(self, token_meta: TokenMetadataSchema) -> bool:
        """Saves generated token & metadata into 'token_metadata' collection."""
        if self.db is None:
            await self.connect()
        if self.db is None:
            return False
        try:
            doc = token_meta.model_dump()
            await self.db.token_metadata.update_one(
                {"token_id": token_meta.token_id},
                {"$set": doc},
                upsert=True
            )
            logger.info(f"💾 Stored token metadata '{token_meta.token_id}' in MongoDB 'token_metadata' collection.")
            return True
        except Exception as e:
    async def get_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves past sessions from MongoDB 'sessions' collection."""
        if self.db is None:
            await self.connect()
        if self.db is None:
            return []
        try:
            cursor = self.db.sessions.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
            return await cursor.to_list(length=limit)
        except Exception as e:
            logger.error(f"Error fetching sessions from MongoDB: {e}")
            return []

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single session by session_id."""
        if self.db is None:
            await self.connect()
        if self.db is None:
            return None
        try:
            return await self.db.sessions.find_one({"session_id": session_id}, {"_id": 0})
        except Exception as e:
            logger.error(f"Error fetching session {session_id}: {e}")
            return None

    async def get_mcp_servers(self) -> List[Dict[str, Any]]:
        """Retrieves all registered MCP servers from 'mcp_servers' collection."""
        if self.db is None:
            await self.connect()
        if self.db is None:
            return []
        try:
            cursor = self.db.mcp_servers.find({}, {"_id": 0})
            return await cursor.to_list(length=100)
        except Exception as e:
            logger.error(f"Error fetching MCP servers from MongoDB: {e}")
            return []

    async def save_mcp_server(self, server_data: Dict[str, Any]) -> bool:
        """Saves or updates a single MCP server in MongoDB 'mcp_servers' collection."""
        if self.db is None:
            await self.connect()
        if self.db is None:
            return False
        try:
            name = server_data.get("name")
            if not name:
                return False
            server_id = server_data.get("id") or server_data.get("server_id") or f"mcp_{name.lower().replace(' ', '_')}"
            doc = {
                "server_id": server_id,
                "name": name,
                "transport": server_data.get("transport", "stdio"),
                "command": server_data.get("command"),
                "args": server_data.get("args") or [],
                "url": server_data.get("url"),
                "is_connected": server_data.get("isConnected", server_data.get("is_connected", True)),
                "tools": server_data.get("tools", []),
                "updated_at": datetime.utcnow().isoformat()
            }
            await self.db.mcp_servers.update_one(
                {"name": name},
                {"$set": doc},
                upsert=True
            )
            logger.info(f"💾 Saved MCP server '{name}' directly to MongoDB Atlas.")
            return True
        except Exception as e:
            logger.error(f"Error saving MCP server to MongoDB: {e}")
            return False

    async def delete_mcp_server(self, server_id: str) -> bool:
        """Removes an MCP server from MongoDB 'mcp_servers' collection."""
        if self.db is None:
            await self.connect()
        if self.db is None:
            return False
        try:
            res = await self.db.mcp_servers.delete_one({"$or": [{"server_id": server_id}, {"name": server_id}]})
            return res.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting MCP server from MongoDB: {e}")
            return False

    # Property accessors
    @property
    def sessions(self):
        return self.db.sessions if self.db is not None else None

    @property
    def mcp_servers(self):
        return self.db.mcp_servers if self.db is not None else None

    @property
    def token_metadata(self):
        return self.db.token_metadata if self.db is not None else None

    @property
    def tasks(self):
        return self.db.tasks if self.db is not None else None

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection")

# Global singleton
db_manager = MongoDBManager()
