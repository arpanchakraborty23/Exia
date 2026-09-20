from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime



class CreateNewUserModel(BaseModel):
    __table__="users"

    user_id : str = Field(..., min_length=7, max_length=7)
    name: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    hash_password: str


class AgentSessionModel(BaseModel):
    __table__="session"

    user_id  : str = Field(...,max_length=7)
    session_id: str = Field(...,description="agent session id")
    room_name: Optional[str] = Field(None,description="livekit room name")
    name     : str = Field(...,description="participant name")
    token    : str = Field(...,description="agent token")
    session_summary : Optional[str] = Field(None,description="summary")
    conversation : Optional[Dict] = Field(None,description="session conversation")
    created_at : datetime = Field(default_factory=datetime.now)
    updated_at : datetime = Field(default_factory=datetime.now)

    
    
    
class MCPServerModel(BaseModel):
    __table__="mcp"

    user_id : str = Field(...,max_length=7)
    server_name: str = Field(...,description="mcp server name")
    server_url: str = Field(...,description="mcp server url")
    server_key : Optional[str] = Field(None,description="mcp server key")
    transport: str = Field(...,description="mcp protocall")
    mcp_tools_list: list = Field(...,description="mcp tools list")
    mcp_tool_count: int = Field(...,description="mcp tools count")
    status : str = Field(...,description="mcp server status")


class PromptModel(BaseModel):
    __table__="prompts"

    user_id: str = Field(...,description="owner user id")
    prompt_id: str = Field(...,description="public prompt id (pr_...)")
    title: str = Field(...,description="directive name")
    prompt_text: str = Field(...,description="prompt instructions")
    type: str = Field(...,description="system persona or quick macro")
    tags: list = Field(default_factory=list,description="prompt tags")
    created_at: str = Field(...,description="iso creation timestamp")
    updated_at: Optional[str] = Field(None,description="iso update timestamp")


class ModelConfigModel(BaseModel):
    __table__="model_config"

    user_id: str = Field(...,description="owner user id")
    config: Dict = Field(default_factory=dict,description="model engine config")
    updated_at: Optional[str] = Field(None,description="iso update timestamp")
