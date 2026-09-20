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


# prompts (Directive & Prompt Matrix) — matches frontend PromptItem
class PromptCreateRequest(BaseModel):
    title: str
    prompt_text: str
    type: Literal["system", "quick"] = "system"
    tags: Optional[List[str]] = None


class PromptUpdateRequest(BaseModel):
    title: Optional[str] = None
    prompt_text: Optional[str] = None
    type: Optional[Literal["system", "quick"]] = None
    tags: Optional[List[str]] = None


class PromptResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: Optional[str] = None
    prompt_text: Optional[str] = None
    type: Optional[Literal["system", "quick"]] = None
    tags: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PromptDeleteResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None


# model engine config (Intelligence & Model Engine) — matches frontend ModelConfig.
# Accepts both `mode` (lib/api.ts) and `pipeline_mode` (model-selection-view),
# plus the `llt_provider` typo the view sends.
class ModelConfigSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")

    mode: Optional[Literal["gemini_live", "modular"]] = Field(
        default=None,
        validation_alias=AliasChoices("mode", "pipeline_mode"),
        serialization_alias="mode",
    )
    gemini_model: Optional[str] = None
    gemini_voice: Optional[str] = None
    stt_provider: Optional[str] = None
    stt_model: Optional[str] = None
    llm_provider: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("llm_provider", "llt_provider"),
        serialization_alias="llm_provider",
    )
    llm_model: Optional[str] = None
    tts_provider: Optional[str] = None
    tts_model: Optional[str] = None
    temperature: Optional[float] = None
    max_output_tokens: Optional[int] = None


# settings-view password change (frontend posts current + new password)
class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class ChangePasswordResponse(BaseModel):
    message: Optional[str] = None


class LogoutRequest(BaseModel):
    # Optional refresh token to revoke alongside the access token in Authorization header
    refresh_token: Optional[str] = None


class LogoutResponse(BaseModel):
    message: Optional[str] = None