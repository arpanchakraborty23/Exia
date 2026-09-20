from pydantic import BaseModel, ConfigDict, Field
from pydantic.aliases import AliasChoices
from typing import Literal, Optional, Dict, List


# Auth

class CreateUserRequest(BaseModel):
    name: str = None
    email: str = None
    password : str = None

class CreateUserResponse(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None  
    message : Optional[str] = None  

class LoginUserRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None


class LoginUserResponse(BaseModel):
    access_token: str = None
    refresh_token: str = None
    message: str = None    
    user : dict = None


class NewPasswordRequest(BaseModel):
    new_password: str = None    

class NewPasswordResponse(BaseModel):
    message : str = None 


# livekit Session token
class AgentTokenRequest(BaseModel):
    room_name: Optional[str] = None


class AgentTokenResponse(BaseModel):
    room_name : Optional[str] = None
    user_id : str = None    
    server_url: str = None
    session_id: str = None
    token : str = None


# mcp server
class MCPServerAddRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    server_name: Optional[str] = None
    transport: Optional[str] = Field(
        default="remote",
        validation_alias=AliasChoices("transport", "trasport"),
        serialization_alias="transport",
    )
    server_url: Optional[str] = None
    server_key: Optional[str] = None
    server_status: Optional[str] = None

class MCPServerAddResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    server_name: Optional[str] = None
    transport: Optional[str] = Field(
        default="remote",
        validation_alias=AliasChoices("transport", "trasport"),
        serialization_alias="transport",
    )
    server_url: Optional[str] = None
    server_status: Optional[str] = None
    message: Optional[str] = None


class MCPServerUpdateRequest(BaseModel):
    server_name: Optional[str] = None
    server_url: Optional[str] = None
    server_key: Optional[str] = None

class MCPServerUpdateResponse(BaseModel):
    new_server_name: Optional[str] = None
    new_server_url: Optional[str] = None
    new_server_key: Optional[str] = None


# mcp server listing (one item, never exposes server_key)
class MCPServerListItem(BaseModel):
    server_name: Optional[str] = None
    transport: Optional[str] = None
    server_url: Optional[str] = None
    status: Optional[str] = None
    mcp_tool_count: Optional[int] = None


class MCPServerListResponse(BaseModel):
    servers: List[MCPServerListItem] = Field(default_factory=list)
    count: int = 0


# tools of a specific mcp server
class MCPServerToolInfo(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class MCPServerToolsResponse(BaseModel):
    server_name: Optional[str] = None
    server_url: Optional[str] = None
    status: Optional[str] = None
    tools: List[MCPServerToolInfo] = Field(default_factory=list)
    tools_count: int = 0


# active / inactive toggle (status-only update in db)
class MCPServerStatusUpdateRequest(BaseModel):
    status: Literal["active", "inactive"]


class MCPServerStatusUpdateResponse(BaseModel):
    server_name: Optional[str] = None
    status: Optional[str] = None
    message: Optional[str] = None


class MCPServerDeleteResponse(BaseModel):
    server_name: Optional[str] = None
    message: Optional[str] = None