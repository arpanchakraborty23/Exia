/**
 * @exia/shared-types
 *
 * Single source of truth for the Exia backend API contract, shared by every
 * UI target (Expo Android, Expo Web, React Native Windows).
 *
 * Ported 1:1 from the legacy web app (ui/apps/web/lib/types.ts) — keep in
 * sync with backend/src/schemas when the contract changes.
 */

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

export interface TurnMetrics {
  stt_latency_ms?: number;
  ttft_ms?: number;
  llm_latency_ms?: number;
  tts_latency_ms?: number;
  e2e_latency_ms?: number;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  audio_input_tokens?: number;
  audio_output_tokens?: number;
  cached_tokens?: number;
}

export interface SessionTurn {
  id: string;
  turn_index: number;
  timestamp: string;
  user_utterance: string;
  speaker_tag?: string;
  agent_response: string;
  metrics: TurnMetrics;
  tool_calls?: MCPToolInvocation[];
}

export interface SessionAnalyticsMetrics {
  total_turns: number;
  total_duration_seconds: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  audio_tokens: number;
  cached_tokens: number;
  avg_e2e_latency_ms: number;
  avg_ttft_ms: number;
  avg_stt_latency_ms: number;
  tool_invocations_count: number;
  tool_success_rate: number;
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
  // Professional Observability Additions (aligned with LiveKit Agent telemetry)
  total_tokens?: number;
  avg_latency_ms?: number;
  turns_count?: number;
  tool_calls_count?: number;
}

export interface SessionDetail extends SessionSummary {
  transcript: SessionMessage[];
  model_config?: ModelConfig;
  mcp_tools_invoked?: MCPToolInvocation[];
  turns?: SessionTurn[];
  analytics?: SessionAnalyticsMetrics;
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
  tools?: string[];
  created_at?: string;
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

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'search' | 'code' | 'memory' | 'voice' | 'custom';
  enabled: boolean;
  triggers: string[];
  instruction_prompt: string;
  created_at?: string;
}

export interface VoiceUserProfile {
  id: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  voice_signature_id: string;
  enrolled_at: string;
  confidence_threshold: number;
  pitch_hz?: number;
  sample_status: 'enrolled' | 'calibrated' | 'pending';
  notes?: string;
}

export interface ModelConfig {
  mode: 'gemini_live' | 'modular';
  // Alias used by model-selection-view (mirrored by backend GET/PUT /models/config)
  pipeline_mode?: 'gemini_live' | 'modular';
  gemini_model: string;
  gemini_voice: string;
  stt_provider: string;
  stt_model: string;
  llm_provider: string;
  // Alternate key sent by model-selection-view (normalized server-side)
  llt_provider?: string;
  llm_model: string;
  tts_provider: string;
  tts_model: string;
  temperature: number;
  max_output_tokens?: number;

  // API Keys & Endpoints
  gemini_api_key?: string;
  openai_api_key?: string;
  anthropic_api_key?: string;
  deepgram_api_key?: string;
  cartesia_api_key?: string;
  elevenlabs_api_key?: string;
  speechmatics_api_key?: string;
  groq_api_key?: string;
  deepseek_api_key?: string;
  ollama_base_url?: string;

  // Fallback Model Options (LiveKit Inference or multi-provider routing)
  fallback_enabled?: boolean;
  fallback_provider?: 'livekit' | 'anthropic' | 'openai' | 'google' | 'ollama' | string;
  fallback_model?: string;
  fallback_temperature?: number;
  fallback_api_key?: string;

  // Fallback STT & TTS Options
  fallback_stt_enabled?: boolean;
  fallback_stt_provider?: 'livekit' | 'speechmatics' | 'deepgram' | 'openai' | 'google' | string;
  fallback_stt_model?: string;
  fallback_stt_api_key?: string;

  fallback_tts_enabled?: boolean;
  fallback_tts_provider?: 'livekit' | 'cartesia' | 'elevenlabs' | 'openai' | 'speechmatics' | 'google' | string;
  fallback_tts_model?: string;
  fallback_tts_voice?: string;
  fallback_tts_api_key?: string;

  // LiveKit Voice Agent Orchestrator Credentials
  livekit_url?: string;
  livekit_api_key?: string;
  livekit_api_secret?: string;
  livekit?: {
    url?: string;
    apiKey?: string;
    apiSecret?: string;
    roomName?: string;
  };

  // Speechmatics Voice Recognition & STT Parameters
  speechmatics_model?: 'linden-1' | 'enhanced' | 'standard' | string;
  speechmatics_language?: string;
  speechmatics_turn_detection?: 'vad' | 'external';
  speechmatics_max_delay?: number;
  speechmatics_enable_partials?: boolean;
  speechmatics_custom_dictionary?: string;
  speechmatics_diarization?: boolean;
  speechmatics_speaker_identification?: boolean;
  speechmatics_voice_profile_name?: string;
  speechmatics_speaker_threshold?: number;
  voice_users?: VoiceUserProfile[];

  // Base System Prompt & Skills
  base_system_prompt?: string;
  skills?: AgentSkill[];

  // Advanced Tuning Parameters
  top_p?: number;
  top_k?: number;
  thinking_budget?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  system_prompt_override?: string;
  custom_model_name?: string;
}
