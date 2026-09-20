from typing import Optional
from fastapi import HTTPException, status
from fastmcp import Client
from fastmcp.client.transports import StreamableHttpTransport
import logging

from .db import MongoServices
from src.constants import get_settings, MCPServerAddRequest, MCPServerEditRequest, MCPServerModel

# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)


class MCPServices:
    def __init__(self):
        self.db = MongoServices(
            url=settings.mongodb_uri,
            db=settings.mongodb_database,
            collection=settings.mongodb_mcp_collection or "mcp",
        )

    async def add_mcp(self, user_id: str, mcp_data: MCPServerAddRequest) -> dict:
        """
        Add new MCP server to the database.
        Return: dict matching MCPServerAddResponse
        """
        try:
            # mcp data to dict (accept both `transport` and legacy `trasport`)
            data = mcp_data.model_dump(by_alias=False)
            server_name = data.get("server_name")
            server_url = data.get("server_url")
            server_key = data.get("server_key")
            transport = data.get("transport") or data.get("trasport") or "remote"

            if not server_name or not server_url:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="server_name and server_url are required",
                )

            # Prevent duplicate server_name per user
            if self.db.exists({"user_id": user_id, "server_name": server_name}):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"MCP server '{server_name}' already exists",
                )

            # Test mcp connection
            connection = await self.connect_mcp(url=server_url, key=server_key)

            if connection["status"] != "success":
                logger.error("MCP server connection failed: %s", connection)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=connection.get("message", "Failed to connect to MCP server"),
                )

            new_mcp_data = MCPServerModel(
                user_id=user_id,
                server_name=server_name,
                server_url=server_url,
                server_key=server_key,
                transport=transport,
                mcp_tools_list=connection["tools"],
                mcp_tool_count=connection["tools_count"],
                status="active",
            )
            # Store only after successful validation
            self.db.insert_one(new_mcp_data.model_dump())

            logger.info("MCP server validated successfully: %s", new_mcp_data.server_url)

            return {
                "server_name": new_mcp_data.server_name,
                "transport": new_mcp_data.transport,
                "server_url": new_mcp_data.server_url,
                "server_status": new_mcp_data.status,
                "message": "MCP server connected successfully",
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to add MCP server: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add MCP server",
            )
        
    async def connect_mcp(self,url: str,key: Optional[str] = None,) -> dict:
        """
            Connect to a remote MCP server and retrieve its available tools.
        """

        if not url:
            logger.error("MCP server URL is required for connection.")
            return {
                "status": "error",
                "message": "MCP server URL is required",
            }

        try:
            headers = {
                "X-Custom-Header": "value",
            }

            if key:
                headers["Authorization"] = f"Bearer {key}"

            transport = StreamableHttpTransport(
                url=url,
                headers=headers,
            )

            logger.info("Connecting to MCP server: %s", url)

            async with Client(transport) as client:

                tools = await client.list_tools()

                logger.info("Successfully connected to MCP server: %s",url)

                return {
                    "status": "success",
                    "server_url": url,
                    "tools": [
                        {
                            "name": tool.name,
                            "description": tool.description,
                        }
                        for tool in tools
                    ],
                    "tools_count": len(tools)
                }

        except Exception as e:
            logger.exception("Failed to connect to MCP server: %s",url,)
            return {
                "status": "error",
                "server_url": url,
                "message": str(e),
            }

    def _public_projection(self) -> dict:
        # Never leak server_key or internal _id to clients
        return {"_id": 0, "server_key": 0}

    async def list_mcps(self, user_id: str) -> dict:
        """List all MCP servers of a user (without secrets)."""
        try:
            docs = self.db.find_many(
                {"user_id": user_id},
                projection=self._public_projection(),
            )
            servers = [
                {
                    "server_name": d.get("server_name"),
                    "transport": d.get("transport"),
                    "server_url": d.get("server_url"),
                    "status": d.get("status"),
                    "mcp_tool_count": d.get("mcp_tool_count", 0),
                }
                for d in (docs or [])
            ]
            return {"servers": servers, "count": len(servers)}
        except Exception as e:
            logger.exception("Failed to list MCP servers: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list MCP servers",
            )

    async def get_mcp_tools(
        self, user_id: str, server_name: str, refresh: bool = False
    ) -> dict:
        """Return stored tools of one server; optionally refresh live and persist."""
        try:
            doc = self.db.find_one({"user_id": user_id, "server_name": server_name})
            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"MCP server '{server_name}' not found",
                )

            if refresh:
                connection = await self.connect_mcp(
                    url=doc.get("server_url"), key=doc.get("server_key")
                )
                if connection["status"] != "success":
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=connection.get("message", "Failed to connect to MCP server"),
                    )
                self.db.update_one(
                    {"user_id": user_id, "server_name": server_name},
                    {"$set": {
                        "mcp_tools_list": connection["tools"],
                        "mcp_tool_count": connection["tools_count"],
                    }},
                )
                doc["mcp_tools_list"] = connection["tools"]
                doc["mcp_tool_count"] = connection["tools_count"]

            tools = doc.get("mcp_tools_list") or []
            return {
                "server_name": doc.get("server_name"),
                "server_url": doc.get("server_url"),
                "status": doc.get("status"),
                "tools": tools,
                "tools_count": doc.get("mcp_tool_count", len(tools)),
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to get MCP tools: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get MCP server tools",
            )

    async def update_mcp_status(self, user_id: str, server_name: str, new_status: str) -> dict:
        """Active/inactive toggle — status-only update in db."""
        try:
            if new_status not in ("active", "inactive"):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="status must be 'active' or 'inactive'",
                )
            result = self.db.update_one(
                {"user_id": user_id, "server_name": server_name},
                {"$set": {"status": new_status}},
            )
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"MCP server '{server_name}' not found",
                )
            logger.info("MCP server '%s' status -> %s", server_name, new_status)
            return {
                "server_name": server_name,
                "status": new_status,
                "message": f"MCP server '{server_name}' {new_status}",
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to update MCP status: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update MCP server status",
            )

    async def delete_mcp(self, user_id: str, server_name: str) -> dict:
        """Delete one MCP server of the user."""
        try:
            result = self.db.delete_one({"user_id": user_id, "server_name": server_name})
            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"MCP server '{server_name}' not found",
                )
            logger.info("MCP server '%s' deleted", server_name)
            return {
                "server_name": server_name,
                "message": f"MCP server '{server_name}' deleted",
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to delete MCP server: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete MCP server",
            )

    async def edit_mcp(
        self, user_id: str, server_name: str, patch: MCPServerEditRequest
    ) -> dict:
        """Generic edit: rename / url / key / transport. Re-validates live if connection fields change."""
        try:
            data = patch.model_dump(by_alias=False, exclude_unset=True)
            data.pop("trasport", None)  # legacy safety, field alias already normalizes
            if not data:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No fields to update",
                )

            doc = self.db.find_one({"user_id": user_id, "server_name": server_name})
            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"MCP server '{server_name}' not found",
                )

            new_name = (data.get("server_name") or "").strip() or None
            if new_name and new_name != server_name:
                if self.db.exists({"user_id": user_id, "server_name": new_name}):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"MCP server '{new_name}' already exists",
                    )

            url_changed = "server_url" in data and data["server_url"] != doc.get("server_url")
            key_changed = "server_key" in data and data["server_key"] != doc.get("server_key")
            if url_changed or key_changed:
                effective_url = data.get("server_url", doc.get("server_url"))
                effective_key = data.get("server_key", doc.get("server_key"))
                if not effective_url:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="server_url is required",
                    )
                connection = await self.connect_mcp(url=effective_url, key=effective_key)
                if connection["status"] != "success":
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=connection.get("message", "Failed to connect to MCP server"),
                    )
                data["mcp_tools_list"] = connection["tools"]
                data["mcp_tool_count"] = connection["tools_count"]

            if new_name and new_name != server_name:
                data["server_name"] = new_name

            result = self.db.update_one(
                {"user_id": user_id, "server_name": server_name},
                {"$set": data},
            )
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"MCP server '{server_name}' not found",
                )

            updated = self.db.find_one(
                {"user_id": user_id, "server_name": data.get("server_name", server_name)},
                self._public_projection(),
            ) or {**doc, **data}
            logger.info("MCP server '%s' updated", server_name)
            return {
                "server_name": updated.get("server_name"),
                "transport": updated.get("transport"),
                "server_url": updated.get("server_url"),
                "server_status": updated.get("status"),
                "message": f"MCP server '{updated.get('server_name')}' updated successfully",
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to edit MCP server: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update MCP server",
            )
        