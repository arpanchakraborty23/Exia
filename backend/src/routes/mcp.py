import logging
from fastapi import APIRouter, status, HTTPException, Depends

from src.services import AccessTokenBearer, MCPServices
from src.constants import (
    MCPServerAddRequest,
    MCPServerAddResponse,
    MCPServerEditRequest,
    MCPServerListResponse,
    MCPServerToolsResponse,
    MCPServerStatusUpdateRequest,
    MCPServerStatusUpdateResponse,
    MCPServerDeleteResponse,
)


# Initialize Services
logger = logging.getLogger(__name__)
access_token_bearer = AccessTokenBearer()
mcp_services = MCPServices()


# MCP route
mcp_route = APIRouter(prefix="/api",tags=["MCP"])


def _get_user_id(token_data: dict) -> str:
    token_user = (token_data or {}).get("user") or {}
    user_id = token_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token"
        )
    return user_id


@mcp_route.post("/add",response_model=MCPServerAddResponse,status_code=status.HTTP_201_CREATED)
async def add_mcp(mcp_data: MCPServerAddRequest, token_data: dict = Depends(access_token_bearer)):
    try:
        user_id = _get_user_id(token_data)
        logger.info(
            "[POST /api/add] Registering MCP server for user_id=%s (name=%s, transport=%s, url=%s)",
            user_id,
            mcp_data.server_name,
            mcp_data.transport,
            mcp_data.server_url,
        )
        result = await mcp_services.add_mcp(user_id, mcp_data)
        logger.info("[POST /api/add] MCP server '%s' added successfully for user_id=%s", mcp_data.server_name, user_id)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[POST /api/add] Failed to add MCP server: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add MCP server",
        )

@mcp_route.get("/list", response_model=MCPServerListResponse, status_code=status.HTTP_200_OK)
async def list_mcps(token_data: dict = Depends(access_token_bearer)):
    """List all MCP servers of the authenticated user (no secrets)."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/list] Listing MCP servers for user_id=%s", user_id)
        servers = await mcp_services.list_mcps(user_id)
        count = getattr(servers, "count", 0) or len(getattr(servers, "servers", []) or [])
        logger.info("[GET /api/list] Retrieved %d MCP server(s) for user_id=%s", count, user_id)
        return servers
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/list] Failed to list MCP servers: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list MCP servers",
        )


@mcp_route.get("/{server_name}/tools", response_model=MCPServerToolsResponse, status_code=status.HTTP_200_OK)
async def get_mcp_tools(
    server_name: str,
    refresh: bool = False,
    token_data: dict = Depends(access_token_bearer),
):
    """Show tools of a specific MCP server. Use ?refresh=true to reconnect live and persist."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[GET /api/%s/tools] Fetching tools for server (user_id=%s, refresh=%s)", server_name, user_id, refresh)
        tools = await mcp_services.get_mcp_tools(user_id, server_name, refresh=refresh)
        tool_count = getattr(tools, "tools_count", 0) or len(getattr(tools, "tools", []) or [])
        logger.info("[GET /api/%s/tools] Found %d tool(s) for server '%s'", server_name, tool_count, server_name)
        return tools
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[GET /api/%s/tools] Failed to get MCP tools: %s", server_name, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get MCP server tools",
        )


@mcp_route.patch("/{server_name}/status", response_model=MCPServerStatusUpdateResponse, status_code=status.HTTP_200_OK)
async def update_mcp_status(
    server_name: str,
    body: MCPServerStatusUpdateRequest,
    token_data: dict = Depends(access_token_bearer),
):
    """Activate / deactivate a server — status-only update in db."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[PATCH /api/%s/status] Updating status to '%s' for user_id=%s", server_name, body.status, user_id)
        res = await mcp_services.update_mcp_status(user_id, server_name, body.status)
        logger.info("[PATCH /api/%s/status] Status updated successfully for '%s'", server_name, server_name)
        return res
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[PATCH /api/%s/status] Failed to update MCP status: %s", server_name, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update MCP server status",
        )


@mcp_route.put("/{server_name}", response_model=MCPServerAddResponse, status_code=status.HTTP_200_OK)
async def edit_mcp(
    server_name: str,
    body: MCPServerEditRequest,
    token_data: dict = Depends(access_token_bearer),
):
    """Generic edit: rename / url / key / transport (re-validates live connection)."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[PUT /api/%s] Editing MCP server for user_id=%s", server_name, user_id)
        updated = await mcp_services.edit_mcp(user_id, server_name, body)
        logger.info("[PUT /api/%s] MCP server updated successfully", server_name)
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[PUT /api/%s] Failed to edit MCP server: %s", server_name, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update MCP server",
        )


@mcp_route.delete("/{server_name}", response_model=MCPServerDeleteResponse, status_code=status.HTTP_200_OK)
async def delete_mcp(server_name: str, token_data: dict = Depends(access_token_bearer)):
    """Delete a specific MCP server of the authenticated user."""
    try:
        user_id = _get_user_id(token_data)
        logger.info("[DELETE /api/%s] Deleting MCP server for user_id=%s", server_name, user_id)
        result = await mcp_services.delete_mcp(user_id, server_name)
        logger.info("[DELETE /api/%s] MCP server deleted successfully", server_name)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[DELETE /api/%s] Failed to delete MCP server: %s", server_name, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete MCP server",
        )