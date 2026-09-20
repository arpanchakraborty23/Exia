import logging
from fastapi import APIRouter, status, HTTPException, Depends

from src.services import AccessTokenBearer, MCPServices
from src.constants import (
    MCPServerAddRequest,
    MCPServerAddResponse,
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
        # Get user token id
        token_user = (token_data or {}).get("user") or {}

        user_id = token_user.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Token"
            )
        logger.info(mcp_data)
        result = await mcp_services.add_mcp(user_id, mcp_data)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to add MCP server: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add MCP server",
        )

@mcp_route.get("/list", response_model=MCPServerListResponse, status_code=status.HTTP_200_OK)
async def list_mcps(token_data: dict = Depends(access_token_bearer)):
    """List all MCP servers of the authenticated user (no secrets)."""
    try:
        user_id = _get_user_id(token_data)
        return await mcp_services.list_mcps(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to list MCP servers: %s", e)
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
        return await mcp_services.get_mcp_tools(user_id, server_name, refresh=refresh)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get MCP tools: %s", e)
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
        return await mcp_services.update_mcp_status(user_id, server_name, body.status)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update MCP status: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update MCP server status",
        )


@mcp_route.delete("/{server_name}", response_model=MCPServerDeleteResponse, status_code=status.HTTP_200_OK)
async def delete_mcp(server_name: str, token_data: dict = Depends(access_token_bearer)):
    """Delete a specific MCP server of the authenticated user."""
    try:
        user_id = _get_user_id(token_data)
        return await mcp_services.delete_mcp(user_id, server_name)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to delete MCP server: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete MCP server",
        )