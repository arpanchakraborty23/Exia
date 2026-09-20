from typing import Optional
from fastapi import HTTPException, status
from fastmcp import Client
from fastmcp.client.transports import StreamableHttpTransport
import logging

from .db import MongoServices
from src.constants import get_settings, MCPServerAddRequest, MCPServerModel

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