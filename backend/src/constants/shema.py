from pydantic import BaseModel, ConfigDict, Field
from pydantic.aliases import AliasChoices
from typing import Literal, Optional, Dict, List, Any


# Auth

class CreateUserRequest(BaseModel):
    name: str = None
    email: str = None
    password : str = None

class CreateUserResponse(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None  
    message: Optional[str] = None  
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None  

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
    livekit_url: Optional[str] = None
    livekit_api_key: Optional[str] = None
    livekit_api_secret: Optional[str] = None


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
    type: Literal["system", "quick", "skill", "base"] = "system"
    tags: Optional[List[str]] = None
    is_default: Optional[bool] = False


class PromptUpdateRequest(BaseModel):
    title: Optional[str] = None
    prompt_text: Optional[str] = None
    type: Optional[Literal["system", "quick", "skill", "base"]] = None
    tags: Optional[List[str]] = None
    is_default: Optional[bool] = None


class PromptResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    title: Optional[str] = None
    prompt_text: Optional[str] = None
    type: Optional[Literal["system", "quick", "skill", "base"]] = None
    tags: List[str] = Field(default_factory=list)
    is_default: Optional[bool] = False
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
    # Base prompt & skills support from UI studio
    base_system_prompt: Optional[str] = None
    system_prompt_override: Optional[str] = None
    skills: Optional[List[Dict[str, Any]]] = None
    # Speechmatics STT & voice recognition
    speechmatics_voice_id: Optional[str] = None
    speechmatics_language: Optional[str] = None
    speechmatics_model: Optional[str] = None
    # Gemini advanced & Web search
    thinking_budget: Optional[int] = None
    search_grounding: Optional[bool] = None
    web_search: Optional[bool] = None
    realtime_search_models: Optional[List[str]] = None
    # LiveKit custom credentials
    livekit: Optional[Dict[str, Any]] = None
    livekit_url: Optional[str] = None
    livekit_api_key: Optional[str] = None
    livekit_api_secret: Optional[str] = None
    vad_threshold: Optional[float] = None
    allow_interruptions: Optional[bool] = None

    # Model Provider API Keys & Endpoints (persisted in DB and synced to .env)
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    deepgram_api_key: Optional[str] = None
    cartesia_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    speechmatics_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    deepseek_api_key: Optional[str] = None
    ollama_base_url: Optional[str] = None

    # Fallback Model Options (LiveKit Inference or multi-provider routing)
    fallback_enabled: Optional[bool] = False
    fallback_provider: Optional[str] = None
    fallback_model: Optional[str] = None
    fallback_temperature: Optional[float] = None
    fallback_api_key: Optional[str] = None


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


# session history — matches frontend SessionSummary / SessionDetail
class SessionSummarySchema(BaseModel):
    id: str
    user_id: Optional[str] = None
    room_name: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    status: Optional[str] = None
    duration_seconds: Optional[int] = None
    model_used: Optional[str] = None
    message_count: Optional[int] = None
    preview_text: Optional[str] = None
    total_tokens: Optional[int] = None
    avg_latency_ms: Optional[float] = None
    turns_count: Optional[int] = None
    tool_calls_count: Optional[int] = None


class SessionMessageSchema(BaseModel):
    id: Optional[str] = None
    role: Optional[str] = None
    text: Optional[str] = None
    timestamp: Optional[str] = None


class SessionDetailSchema(SessionSummarySchema):
    transcript: List[SessionMessageSchema] = Field(default_factory=list)
    mcp_tools_invoked: List[Dict] = Field(default_factory=list)
    turns: List[Dict] = Field(default_factory=list)
    analytics: Optional[Dict[str, Any]] = None


class SessionListResponse(BaseModel):
    sessions: List[SessionSummarySchema] = Field(default_factory=list)
    total: int = 0


class EndSessionResponse(BaseModel):
    message: Optional[str] = None


# Analytics & Telemetry for Observability View
class AnalyticsMetricsResponse(BaseModel):
    total_sessions: int = 0
    completed_sessions: int = 0
    total_duration_seconds: int = 0
    formatted_duration: str = "0m"
    total_turns: int = 0
    total_tool_calls: int = 0
    total_tokens: Dict[str, int] = Field(default_factory=lambda: {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
    })
    avg_latency: Dict[str, float] = Field(default_factory=lambda: {
        "stt_ms": 0.0,
        "llm_ttft_ms": 0.0,
        "tts_ms": 0.0,
        "e2e_ms": 0.0,
    })
    model_breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)


# User Voice Recognition / Speaker Diarization Profiles
class VoiceProfileSchema(BaseModel):
    profile_id: str
    user_id: str
    speaker_name: str
    voice_signature: Optional[str] = None
    enrolled_at: str
    sample_count: int = 1
    notes: Optional[str] = None


class VoiceProfileCreateRequest(BaseModel):
    speaker_name: str
    voice_signature: Optional[str] = None
    notes: Optional[str] = None


class VoiceProfileListResponse(BaseModel):
    profiles: List[VoiceProfileSchema] = Field(default_factory=list)
    total: int = 0


# mcp generic edit (frontend edit modal) — all fields optional
class MCPServerEditRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    server_name: Optional[str] = None
    transport: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("transport", "trasport"),
    )
    server_url: Optional[str] = None
    server_key: Optional[str] = None