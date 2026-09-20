import logging
from fastapi import APIRouter, status, HTTPException, Depends

from src.services import AccessTokenBearer, MCPServices
from src.constants import MCPServerAddRequest ,MCPServerAddResponse


# Initialize Services
logger = logging.getLogger(__name__)
access_token_bearer = AccessTokenBearer()
mcp_services = MCPServices()


# MCP route
mcp_route = APIRouter(prefix="/api",tags=["MCP"])


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