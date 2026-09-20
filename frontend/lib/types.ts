export interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user?: User;
  message?: string;
}

export interface LiveKitTokenResponse {
  server_url: string;
  token: string;
  session_id: string;
  user_id?: string;
}

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

export interface MCPToolInvocation {
  id: string;
  name: string;
  args?: Record<string, unknown>;
  result?: string;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
}

export interface SessionSummary {
  id: string;
  user_id: string;
  room_name: string;
  started_at: string;
  ended_at?: string | null;
  status: 'active' | 'ended' | 'disconnected';
  duration_seconds?: number;
  model_used?: string;
  message_count?: number;
  preview_text?: string;
}

export interface SessionDetail extends SessionSummary {
  transcript: SessionMessage[];
  model_config?: ModelConfig;
  mcp_tools_invoked?: MCPToolInvocation[];
}

export interface MCPServer {
  id: string;
  user_id?: string;
  name: string;
  server_type: 'stdio' | 'sse';
  command_or_url: string;
  auth_token?: string;
  env_vars?: Record<string, string>;
  enabled: boolean;
  created_at: string;
  updated_at?: string;
  status?: 'connected' | 'disconnected' | 'error';
}

export interface PromptItem {
  id: string;
  user_id?: string;
  title: string;
  prompt_text: string;
  type: 'system' | 'quick';
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

export interface ModelConfig {
  mode: 'gemini_live' | 'modular';
  gemini_model: string;
  gemini_voice: string;
  stt_provider: string;
  stt_model: string;
  llm_provider: string;
  llm_model: string;
  tts_provider: string;
  tts_model: string;
  temperature: number;
}
