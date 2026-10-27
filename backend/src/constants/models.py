from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime



class CreateNewUserModel(BaseModel):
    __table__="users"

    user_id : str = Field(..., min_length=1, max_length=128, description="unique user id")
    name: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    hash_password: str


class AgentSessionModel(BaseModel):
    __table__="session"

    user_id  : str = Field(...,description="owner user id")
    session_id: str = Field(...,description="agent session id")
    room_name: Optional[str] = Field(None,description="livekit room name")
    name     : str = Field(...,description="participant name")
    token    : str = Field(...,description="agent token")
    status   : str = Field(default="active",description="session status: active, completed, failed")
    duration_seconds: Optional[int] = Field(None,description="total call duration")
    total_tokens: Optional[int] = Field(None,description="total token usage")
    avg_latency_ms: Optional[float] = Field(None,description="average response latency")
    session_summary : Optional[str] = Field(None,description="summary")
    conversation : Optional[Dict] = Field(None,description="session conversation")
    turns: list = Field(default_factory=list, description="turn-by-turn log")
    mcp_tools_invoked: list = Field(default_factory=list, description="tool calls")
    created_at : datetime = Field(default_factory=datetime.now)
    ended_at: Optional[datetime] = Field(None, description="session end time")
    updated_at : datetime = Field(default_factory=datetime.now)


class MCPServerModel(BaseModel):
    __table__="mcp"

    user_id : str = Field(..., description="owner user id")
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
    type: str = Field(...,description="system persona, quick macro, skill or base")
    tags: list = Field(default_factory=list,description="prompt tags")
    is_default: bool = Field(default=False, description="is default active prompt")
    created_at: str = Field(...,description="iso creation timestamp")
    updated_at: Optional[str] = Field(None,description="iso update timestamp")


class ModelConfigModel(BaseModel):
    __table__="model_config"

    user_id: str = Field(...,description="owner user id")
    config: Dict = Field(default_factory=dict,description="model engine config")
    updated_at: Optional[str] = Field(None,description="iso update timestamp")


class VoiceProfileModel(BaseModel):
    __table__="voice_profiles"

    user_id: str = Field(...,description="owner user id")
    profile_id: str = Field(...,description="voice profile id (vp_...)")
    speaker_name: str = Field(...,description="speaker display name")
    voice_signature: Optional[str] = Field(None, description="biometric or acoustic voiceprint signature")
    enrolled_at: str = Field(..., description="enrollment timestamp")
    sample_count: int = Field(default=1, description="voice samples enrolled")
    notes: Optional[str] = Field(None, description="speaker notes")
