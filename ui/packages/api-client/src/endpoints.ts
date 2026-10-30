/**
 * Exia API endpoints — ported 1:1 from the legacy web client
 * (ui/apps/web/lib/api.ts). Wire shapes and route paths match the FastAPI
 * backend exactly; do not rename fields without updating the backend.
 */

import type {
  LiveKitTokenResponse,
  LoginResponse,
  MCPServer,
  ModelConfig,
  PromptItem,
  SessionDetail,
  SessionSummary,
} from '@exia/shared-types';

import type { RequestFn } from './client';

// ---------------------------------------------------------------------------
// Backend analytics wire shape (GET /api/analytics — ported 1:1 from the
// legacy AnalyticsData interface in analytics-view.tsx).
// ---------------------------------------------------------------------------

export interface AnalyticsMetrics {
  total_sessions: number;
  completed_sessions: number;
  total_duration_seconds: number;
  formatted_duration: string;
  total_turns: number;
  total_tool_calls: number;
  total_tokens: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  avg_latency: {
    stt_ms: number;
    llm_ttft_ms: number;
    tts_ms: number;
    e2e_ms: number;
  };
  model_breakdown: { model: string; sessions: number; percentage: number }[];
  recent_activity: {
    session_id: string;
    room_name: string;
    timestamp: string;
    duration_seconds: number;
    turns: number;
    status: string;
  }[];
}

// ---------------------------------------------------------------------------
// Backend MCP wire shapes (POST /api/add, GET /api/list, GET /api/{name}/tools, ...)
// ---------------------------------------------------------------------------

interface BackendMCP {
  server_name: string;
  transport?: string;
  server_url?: string;
  status?: string;
  mcp_tool_count?: number;
}

interface BackendMCPUpsert {
  server_name: string;
  transport?: string;
  server_url?: string;
  server_status?: string;
  message?: string;
}

interface BackendMCPTools {
  server_name: string;
  server_url?: string;
  status?: string;
  tools?: { name?: string; description?: string }[];
  tools_count?: number;
}

function toMCPServer(s: BackendMCP, tools?: string[]): MCPServer {
  const enabled = (s.status || 'active') === 'active';
  return {
    id: s.server_name,
    name: s.server_name,
    server_type: s.transport === 'stdio' ? 'stdio' : 'sse',
    command_or_url: s.server_url || '',
    enabled,
    status: enabled ? 'connected' : 'disconnected',
    ...(tools ? { tools } : {}),
  };
}

async function fetchMCPToolNames(request: RequestFn, serverName: string): Promise<string[] | undefined> {
  try {
    const t = await request<BackendMCPTools>(`/${encodeURIComponent(serverName)}/tools`);
    const names = (t.tools || []).map((x) => x.name).filter(Boolean) as string[];
    return names;
  } catch {
    return undefined;
  }
}

/**
 * Defaults mirrored from backend/src/services/model_config.py
 * (which itself mirrors the legacy frontend DEFAULT_MODEL_CONFIG).
 */
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  mode: 'gemini_live',
  gemini_model: 'gemini-2.0-flash-realtime',
  gemini_voice: 'Puck',
  stt_provider: 'Deepgram',
  stt_model: 'nova-2',
  llm_provider: 'Google Gemini',
  llm_model: 'gemini-2.5-flash',
  tts_provider: 'Cartesia',
  tts_model: 'sonic-english',
  temperature: 0.7,
  max_output_tokens: 1024,
  fallback_enabled: false,
  fallback_provider: 'livekit',
  fallback_model: 'google/gemma-4-31b-it',
  fallback_temperature: 0.7,
  fallback_stt_enabled: false,
  fallback_stt_provider: 'livekit',
  fallback_stt_model: 'deepgram/nova-3',
};

/** LiveKit credentials a target app may pass from its own stored config. */
export interface LiveKitOverrides {
  url?: string;
  apiKey?: string;
  apiSecret?: string;
  roomName?: string;
}

/**
 * Backend wire shape for voice profiles (FastAPI VoiceProfileSchema —
 * see backend/src/constants + users.json seed data). Note: the wire uses
 * `profile_id` / `speaker_name` / `voice_signature`, NOT the shared-types
 * `VoiceUserProfile` field names, so this screen maps between the two.
 */
export interface VoiceProfileWire {
  profile_id: string;
  user_id: string;
  speaker_name: string;
  voice_signature?: string | null;
  enrolled_at: string;
  sample_count: number;
  notes?: string | null;
  role?: string;
  confidence_threshold?: number;
  pitch_hz?: number | null;
  sample_status?: string;
}

/** Payload for POST /api/voice-profiles (FastAPI VoiceProfileCreateRequest). */
export interface VoiceProfileCreatePayload {
  speaker_name: string;
  voice_signature?: string;
  notes?: string;
  role?: string;
  confidence_threshold?: number;
  pitch_hz?: number;
  sample_status?: string;
}

export function createApi(request: RequestFn) {
  return {
    // 0. Health ------------------------------------------------------------
    health: {
      async check(
        timeoutMs: number = 3000,
      ): Promise<{ status: string; target?: string; latencyMs: number }> {
        const start = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await request<{ status: string; target?: string }>('/health', {
            signal: controller.signal,
            headers: { 'Cache-Control': 'no-cache' },
          });
          return { ...res, latencyMs: Math.round(Date.now() - start) };
        } finally {
          clearTimeout(timeoutId);
        }
      },
    },

    // 1. Auth --------------------------------------------------------------
    auth: {
      async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
        // Backend: POST /api/signin { email, password }
        const raw = await request<{
          access_token: string;
          refresh_token?: string;
          message?: string;
          user?: { user_id?: string; id?: string; email?: string; name?: string };
        }>('/signin', {
          method: 'POST',
          body: JSON.stringify({ email: emailOrUsername, password }),
        });

        // Normalize backend user { user_id, ... } to shared User { id, ... }
        const user = raw.user
          ? {
              id: raw.user.user_id || raw.user.id || '',
              email: raw.user.email || emailOrUsername,
              name: raw.user.name,
            }
          : undefined;

        return {
          access_token: raw.access_token,
          refresh_token: raw.refresh_token,
          message: raw.message,
          user,
        };
      },

      async register(name: string, email: string, password: string): Promise<LoginResponse> {
        // Backend: POST /api/auth/create-account { name, email, password }
        const raw = await request<{
          user_id?: string;
          name?: string;
          email?: string;
          access_token?: string;
          refresh_token?: string;
          message?: string;
        }>('/auth/create-account', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });

        const user = raw.user_id
          ? { id: raw.user_id, email: raw.email || email, name: raw.name || name }
          : undefined;

        return {
          access_token: raw.access_token || '',
          refresh_token: raw.refresh_token,
          message: raw.message || 'Account created successfully',
          user,
        };
      },

      async changePassword(
        currentPassword: string,
        newPassword: string,
      ): Promise<{ message: string }> {
        return await request<{ message: string }>('/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
      },

      async logout(): Promise<void> {
        await request('/auth/logout', { method: 'POST' });
      },
    },

    // 2. LiveKit Voice Session ----------------------------------------------
    livekit: {
      /**
       * @param roomName   explicit room, or falls back to overrides.roomName / default
       * @param overrides  LiveKit credentials read from the target app's own
       *                   stored model config (platform concern, not ours)
       */
      async token(
        roomName?: string,
        overrides?: LiveKitOverrides,
      ): Promise<LiveKitTokenResponse> {
        const effectiveRoomName = roomName || overrides?.roomName || 'exia-agent-room';

        // Backend: POST /api/agent/token { room_name, livekit_url, livekit_api_key, livekit_api_secret }
        return await request<LiveKitTokenResponse>('/agent/token', {
          method: 'POST',
          body: JSON.stringify({
            room_name: effectiveRoomName,
            livekit_url: overrides?.url,
            livekit_api_key: overrides?.apiKey,
            livekit_api_secret: overrides?.apiSecret,
          }),
        });
      },

      async endSession(sessionId: string): Promise<{ message: string }> {
        return await request<{ message: string }>(`/sessions/${sessionId}/end`, {
          method: 'POST',
        });
      },
    },

    // 3. Sessions History ----------------------------------------------------
    sessions: {
      async getSessions(page = 1, limit = 10): Promise<{ sessions: SessionSummary[]; total: number }> {
        return await request<{ sessions: SessionSummary[]; total: number }>(
          `/sessions?page=${page}&limit=${limit}`,
        );
      },

      async getSessionById(id: string): Promise<SessionDetail> {
        return await request<SessionDetail>(`/sessions/${id}`);
      },
    },

    // 3.5. Analytics & Observability ------------------------------------------
    analytics: {
      async getMetrics(): Promise<AnalyticsMetrics> {
        return await request<AnalyticsMetrics>('/analytics');
      },
    },

    // 4. MCP Servers (Backend: POST /api/add, GET /api/list, PUT/DELETE /api/{name})
    mcp: {
      async list(): Promise<MCPServer[]> {
        const data = await request<{ servers: BackendMCP[]; count: number }>('/list');
        return await Promise.all(
          (data.servers || []).map(async (s) =>
            toMCPServer(s, await fetchMCPToolNames(request, s.server_name)),
          ),
        );
      },

      async create(server: Omit<MCPServer, 'id' | 'created_at'>): Promise<MCPServer> {
        const created = await request<BackendMCPUpsert>('/add', {
          method: 'POST',
          body: JSON.stringify({
            server_name: server.name,
            transport: server.server_type,
            server_url: server.command_or_url,
            server_key: server.auth_token || undefined,
          }),
        });
        const enabled = server.enabled !== false;
        const status = enabled ? 'active' : 'inactive';
        if (!enabled) {
          await request(`/${encodeURIComponent(created.server_name)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          });
        }
        return toMCPServer(
          {
            server_name: created.server_name,
            transport: created.transport,
            server_url: created.server_url,
            status,
          },
          await fetchMCPToolNames(request, created.server_name),
        );
      },

      async update(id: string, server: Partial<MCPServer>): Promise<MCPServer> {
        const keys = Object.keys(server);
        // Enabled-only toggle -> status route
        if (keys.length === 1 && 'enabled' in server) {
          const status = server.enabled ? 'active' : 'inactive';
          const res = await request<{ server_name: string; status: string }>(
            `/${encodeURIComponent(id)}/status`,
            { method: 'PATCH', body: JSON.stringify({ status }) },
          );
          const enabled = res.status === 'active';
          const current = await createApi(request).mcp.list();
          const existing = current.find((s) => s.id === res.server_name);
          if (existing) {
            return { ...existing, enabled, status: enabled ? 'connected' : 'disconnected' };
          }
          return {
            id: res.server_name,
            name: res.server_name,
            server_type: 'sse',
            command_or_url: '',
            enabled,
            status: enabled ? 'connected' : 'disconnected',
          };
        }
        // Field edit -> PUT /api/{name}, then optional status toggle
        const body: Record<string, unknown> = {};
        if (server.name !== undefined) body.server_name = server.name;
        if (server.server_type !== undefined) body.transport = server.server_type;
        if (server.command_or_url !== undefined) body.server_url = server.command_or_url;
        if (server.auth_token !== undefined) body.server_key = server.auth_token;
        const updated = await request<BackendMCPUpsert>(`/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        let status = updated.server_status || 'active';
        if (server.enabled !== undefined) {
          status = server.enabled ? 'active' : 'inactive';
          await request(`/${encodeURIComponent(updated.server_name)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          });
        }
        return toMCPServer(
          {
            server_name: updated.server_name,
            transport: updated.transport,
            server_url: updated.server_url,
            status,
          },
          await fetchMCPToolNames(request, updated.server_name),
        );
      },

      async delete(id: string): Promise<{ success: boolean }> {
        await request(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
        return { success: true };
      },
    },

    // 5. Prompts (Backend: POST /api/prompts, GET /api/prompts, PUT/DELETE /api/prompts/{id})
    prompts: {
      async list(): Promise<PromptItem[]> {
        return await request<PromptItem[]>('/prompts');
      },

      async create(prompt: Omit<PromptItem, 'id' | 'created_at'>): Promise<PromptItem> {
        return await request<PromptItem>('/prompts', {
          method: 'POST',
          body: JSON.stringify(prompt),
        });
      },

      async update(id: string, prompt: Partial<PromptItem>): Promise<PromptItem> {
        return await request<PromptItem>(`/prompts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(prompt),
        });
      },

      async delete(id: string): Promise<{ success: boolean }> {
        await request<{ success: boolean }>(`/prompts/${id}`, { method: 'DELETE' });
        return { success: true };
      },
    },

    // 6. Model Engine Config (Backend: GET /api/models/config, PUT /api/models/config)
    models: {
      async getConfig(): Promise<ModelConfig> {
        return await request<ModelConfig>('/models/config');
      },

      async updateConfig(config: Partial<ModelConfig>): Promise<ModelConfig> {
        return await request<ModelConfig>('/models/config', {
          method: 'PUT',
          body: JSON.stringify(config),
        });
      },
    },

    // 7. Voice Recognition Profiles (Backend: GET/POST /api/voice-profiles, DELETE /api/voice-profiles/{id})
    voiceProfiles: {
      async list(): Promise<{ profiles: VoiceProfileWire[]; total: number }> {
        return await request<{ profiles: VoiceProfileWire[]; total: number }>('/voice-profiles');
      },

      async create(profile: VoiceProfileCreatePayload): Promise<VoiceProfileWire> {
        return await request<VoiceProfileWire>('/voice-profiles', {
          method: 'POST',
          body: JSON.stringify(profile),
        });
      },

      async delete(id: string): Promise<{ success: boolean }> {
        return await request<{ success: boolean }>(`/voice-profiles/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      },
    },
  };
}

export type Api = ReturnType<typeof createApi>;
