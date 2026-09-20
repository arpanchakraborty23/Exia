import {
  LiveKitTokenResponse,
  LoginResponse,
  MCPServer,
  ModelConfig,
  PromptItem,
  SessionDetail,
  SessionSummary,
  User,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// In-memory / localStorage fallback stores for seamless offline/demo support
const STORAGE_KEYS = {
  TOKEN: 'ha_auth_token',
  USER: 'ha_auth_user',
  MCP: 'ha_mcp_servers',
  PROMPTS: 'ha_prompts',
  MODELS: 'ha_models_config',
  SESSIONS: 'ha_sessions',
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const setStoredToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

// Initial mock data
const DEFAULT_MODEL_CONFIG: ModelConfig = {
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
};

const DEFAULT_MCP_SERVERS: MCPServer[] = [
  {
    id: 'mcp-1',
    name: 'Home Assistant IoT Core',
    server_type: 'sse',
    command_or_url: 'http://homeassistant.local:8123/api/mcp/sse',
    enabled: true,
    status: 'connected',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'mcp-2',
    name: 'Home Automation Cloud Gateway',
    server_type: 'sse',
    command_or_url: 'http://localhost:8123/api/mcp/sse',
    auth_token: 'Bearer ha_secret_token_123',
    enabled: true,
    status: 'connected',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'mcp-3',
    name: 'Remote Telemetry & Weather SSE',
    server_type: 'sse',
    command_or_url: 'https://api.homeassistant.internal/mcp/sse',
    enabled: false,
    status: 'disconnected',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const DEFAULT_PROMPTS: PromptItem[] = [
  {
    id: 'pr-1',
    title: 'Default Home Companion',
    type: 'system',
    prompt_text:
      'You are "Home Assistant", an empathetic, concise, and ultra-fast private voice assistant. You control smart home devices, manage calendar items, and search private notes. Answer conversationally in 1-2 sentences unless asked for details.',
    tags: ['persona', 'system'],
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'pr-2',
    title: 'Good Morning Routine',
    type: 'quick',
    prompt_text:
      "Trigger my morning routine: check today's weather forecast, give me my top 3 agenda items, and read unread reminders.",
    tags: ['routine', 'daily'],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'pr-3',
    title: 'Coding Pair Programmer Mode',
    type: 'system',
    prompt_text:
      'Adopt a senior software engineering persona. Provide precise, production-ready code snippets and architecture tradeoffs. Be direct and avoid boilerplate explanations.',
    tags: ['coding', 'technical'],
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

const DEFAULT_SESSIONS: SessionDetail[] = [
  {
    id: 'sess-101',
    user_id: 'usr_001',
    room_name: 'room-morning-brief',
    started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 2 + 184000).toISOString(),
    status: 'ended',
    duration_seconds: 184,
    model_used: 'Gemini Live (Puck)',
    message_count: 6,
    preview_text: 'Good morning! You have 3 tasks today, starting with Sprint Planning at 10 AM.',
    transcript: [
      {
        id: 'msg-1',
        role: 'user',
        text: 'Good morning, what does my schedule look like today?',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        text: 'Good morning! You have 3 scheduled tasks today: Sprint Planning at 10:00 AM, a code review session at 2:00 PM, and buying groceries before 7:00 PM.',
        timestamp: new Date(Date.now() - 3600000 * 2 + 12000).toISOString(),
      },
      {
        id: 'msg-3',
        role: 'user',
        text: 'Can you turn on the living room lights and set AC to 72 degrees?',
        timestamp: new Date(Date.now() - 3600000 * 2 + 45000).toISOString(),
      },
      {
        id: 'msg-4',
        role: 'assistant',
        text: 'Done! Living room lights are turned on at 80% warm white, and the thermostat is set to 72°F.',
        timestamp: new Date(Date.now() - 3600000 * 2 + 55000).toISOString(),
      },
    ],
    mcp_tools_invoked: [
      {
        id: 'tool-1',
        name: 'home_assistant.get_calendar',
        args: { date: 'today' },
        result: 'Returned 3 calendar items',
        status: 'success',
        timestamp: new Date(Date.now() - 3600000 * 2 + 8000).toISOString(),
      },
      {
        id: 'tool-2',
        name: 'home_assistant.set_device_state',
        args: { entity_id: 'light.living_room', state: 'on', brightness: 80 },
        result: 'OK',
        status: 'success',
        timestamp: new Date(Date.now() - 3600000 * 2 + 50000).toISOString(),
      },
    ],
  },
  {
    id: 'sess-102',
    user_id: 'usr_001',
    room_name: 'room-notes-query',
    started_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 26 + 92000).toISOString(),
    status: 'ended',
    duration_seconds: 92,
    model_used: 'Modular (Deepgram + Claude 3.5 + Cartesia)',
    message_count: 4,
    preview_text: 'I checked your notes for the WiFi password. It is HomeStudio2026!.',
    transcript: [
      {
        id: 'msg-1',
        role: 'user',
        text: 'Where did I leave my passport notes?',
        timestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        text: 'Your memo from August mentions you placed it in the fireproof safe in the master bedroom closet.',
        timestamp: new Date(Date.now() - 3600000 * 26 + 10000).toISOString(),
      },
    ],
    mcp_tools_invoked: [
      {
        id: 'tool-1',
        name: 'filesystem.search_files',
        args: { query: 'passport' },
        result: 'Found 1 note in Documents/Personal',
        status: 'success',
        timestamp: new Date(Date.now() - 3600000 * 26 + 4000).toISOString(),
      },
    ],
  },
];

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail || errorData.message || `Request failed with status ${res.status}`
      );
    }

    return await res.json();
  } catch (err) {
    // If backend is unreachable (Failed to fetch), throw so caller can handle or use fallback
    throw err;
  }
}

// Backend MCP shapes (POST /api/add, GET /api/list, GET /api/{name}/tools, ...)
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

async function fetchMCPToolNames(serverName: string): Promise<string[] | undefined> {
  try {
    const t = await apiRequest<BackendMCPTools>(`/${encodeURIComponent(serverName)}/tools`);
    const names = (t.tools || []).map((x) => x.name).filter(Boolean) as string[];
    return names;
  } catch {
    return undefined;
  }
}

// ---------------- API SERVICES ----------------

export const api = {
  // 1. Auth
  auth: {
    async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
      // Backend: POST /api/signin { email, password }
      const raw = await apiRequest<{
        access_token: string;
        refresh_token?: string;
        message?: string;
        user?: { user_id?: string; id?: string; email?: string; name?: string };
      }>('/signin', {
        method: 'POST',
        body: JSON.stringify({ email: emailOrUsername, password }),
      });
      // Normalize backend user { user_id, ... } to frontend User { id, ... }
      const user: User | undefined = raw.user
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

    async changePassword(
      currentPassword: string,
      newPassword: string
    ): Promise<{ message: string }> {
      try {
        return await apiRequest<{ message: string }>('/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        });
      } catch (err) {
        console.warn('Backend change-password unavailable, using simulated response:', err);
        return { message: 'Password successfully updated' };
      }
    },

    async logout(): Promise<void> {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
      } catch {
        // Ignore logout errors
      } finally {
        setStoredToken(null);
        setStoredUser(null);
      }
    },
  },

  // 2. LiveKit Voice Session
  livekit: {
    async getToken(roomName?: string): Promise<LiveKitTokenResponse> {
      // Backend: POST /api/agent/token { room_name } -> { server_url, token, session_id, user_id }
      try {
        return await apiRequest<LiveKitTokenResponse>('/agent/token', {
          method: 'POST',
          body: JSON.stringify({ room_name: roomName }),
        });
      } catch (err) {
        console.error('Failed to obtain token from FastAPI backend:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch LiveKit token from backend server';
        throw new Error(errorMessage);
      }
    },

    async endSession(sessionId: string): Promise<{ message: string }> {
      try {
        return await apiRequest<{ message: string }>(`/sessions/${sessionId}/end`, {
          method: 'POST',
        });
      } catch (err) {
        console.warn('End session backend call simulated:', err);
        return { message: 'Session closed' };
      }
    },
  },

  // 3. Sessions History
  sessions: {
    async getSessions(
      page = 1,
      limit = 10
    ): Promise<{ sessions: SessionSummary[]; total: number }> {
      try {
        return await apiRequest<{ sessions: SessionSummary[]; total: number }>(
          `/sessions?page=${page}&limit=${limit}`
        );
      } catch (err) {
        console.warn('Backend GET /sessions failed, using mock data:', err);
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
          if (raw) {
            const stored: SessionDetail[] = JSON.parse(raw);
            return { sessions: stored, total: stored.length };
          }
        }
        return { sessions: DEFAULT_SESSIONS, total: DEFAULT_SESSIONS.length };
      }
    },

    async getSessionById(id: string): Promise<SessionDetail> {
      try {
        return await apiRequest<SessionDetail>(`/sessions/${id}`);
      } catch (err) {
        console.warn(`Backend GET /sessions/${id} failed, using mock item:`, err);
        const match = DEFAULT_SESSIONS.find((s) => s.id === id);
        if (match) return match;
        return {
          id,
          user_id: 'usr_001',
          room_name: 'room-archive',
          started_at: new Date().toISOString(),
          status: 'ended',
          duration_seconds: 45,
          model_used: 'Gemini Live',
          message_count: 2,
          preview_text: 'Archived session record',
          transcript: [
            { id: '1', role: 'user', text: 'Hello assistant', timestamp: new Date().toISOString() },
            {
              id: '2',
              role: 'assistant',
              text: 'Hello! How can I help you today?',
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
    },
  },

  // 4. MCP Servers (backend: POST /api/add, GET /api/list, PUT/DELETE /api/{name}, ...)
  mcp: {
    async list(): Promise<MCPServer[]> {
      try {
        const data = await apiRequest<{ servers: BackendMCP[]; count: number }>('/list');
        return await Promise.all(
          (data.servers || []).map(async (s) =>
            toMCPServer(s, await fetchMCPToolNames(s.server_name))
          )
        );
      } catch (err) {
        console.warn('Backend GET /list failed, using local storage/defaults:', err);
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEYS.MCP);
          if (raw) return JSON.parse(raw);
        }
        return DEFAULT_MCP_SERVERS;
      }
    },

    async create(server: Omit<MCPServer, 'id' | 'created_at'>): Promise<MCPServer> {
      // Backend: POST /api/add (always creates as active)
      const created = await apiRequest<BackendMCPUpsert>('/add', {
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
        await apiRequest(`/${encodeURIComponent(created.server_name)}/status`, {
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
        await fetchMCPToolNames(created.server_name)
      );
    },

    async update(id: string, server: Partial<MCPServer>): Promise<MCPServer> {
      const keys = Object.keys(server);
      // Enabled-only toggle -> status route
      if (keys.length === 1 && 'enabled' in server) {
        const status = server.enabled ? 'active' : 'inactive';
        const res = await apiRequest<{ server_name: string; status: string }>(
          `/${encodeURIComponent(id)}/status`,
          { method: 'PATCH', body: JSON.stringify({ status }) }
        );
        const enabled = res.status === 'active';
        const current = await this.list().catch(() => [] as MCPServer[]);
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
      const updated = await apiRequest<BackendMCPUpsert>(`/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      let status = updated.server_status || 'active';
      if (server.enabled !== undefined) {
        status = server.enabled ? 'active' : 'inactive';
        await apiRequest(`/${encodeURIComponent(updated.server_name)}/status`, {
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
        await fetchMCPToolNames(updated.server_name)
      );
    },

    async delete(id: string): Promise<{ success: boolean }> {
      // Backend: DELETE /api/{server_name}
      await apiRequest(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return { success: true };
    },
  },

  // 5. Prompts
  prompts: {
    async list(): Promise<PromptItem[]> {
      try {
        return await apiRequest<PromptItem[]>('/prompts');
      } catch (err) {
        console.warn('Backend GET /prompts failed, using local storage/defaults:', err);
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEYS.PROMPTS);
          if (raw) return JSON.parse(raw);
        }
        return DEFAULT_PROMPTS;
      }
    },

    async getPrompts(): Promise<PromptItem[]> {
      return this.list();
    },

    async create(prompt: Omit<PromptItem, 'id' | 'created_at'>): Promise<PromptItem> {
      try {
        return await apiRequest<PromptItem>('/prompts', {
          method: 'POST',
          body: JSON.stringify(prompt),
        });
      } catch (err) {
        console.warn('Backend POST /prompts failed, updating local state:', err);
        const newPrompt: PromptItem = {
          ...prompt,
          id: `pr-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        const current = await this.list();
        const updated = [newPrompt, ...current];
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(updated));
        }
        return newPrompt;
      }
    },

    async createPrompt(prompt: Omit<PromptItem, 'id' | 'created_at'>): Promise<PromptItem> {
      return this.create(prompt);
    },

    async update(id: string, prompt: Partial<PromptItem>): Promise<PromptItem> {
      try {
        return await apiRequest<PromptItem>(`/prompts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(prompt),
        });
      } catch (err) {
        console.warn(`Backend PUT /prompts/${id} failed, updating local state:`, err);
        const current = await this.list();
        const updated = current.map((p) =>
          p.id === id ? { ...p, ...prompt, updated_at: new Date().toISOString() } : p
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(updated));
        }
        return updated.find((p) => p.id === id)!;
      }
    },

    async updatePrompt(id: string, prompt: Partial<PromptItem>): Promise<PromptItem> {
      return this.update(id, prompt);
    },

    async delete(id: string): Promise<{ success: boolean }> {
      try {
        return await apiRequest<{ success: boolean }>(`/prompts/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn(`Backend DELETE /prompts/${id} failed, updating local state:`, err);
        const current = await this.list();
        const updated = current.filter((p) => p.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.PROMPTS, JSON.stringify(updated));
        }
        return { success: true };
      }
    },

    async deletePrompt(id: string): Promise<{ success: boolean }> {
      return this.delete(id);
    },
  },

  // 6. Model Selection
  models: {
    async getConfig(): Promise<ModelConfig> {
      try {
        return await apiRequest<ModelConfig>('/models/config');
      } catch (err) {
        console.warn('Backend GET /models/config failed, using local defaults:', err);
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEYS.MODELS);
          if (raw) return JSON.parse(raw);
        }
        return DEFAULT_MODEL_CONFIG;
      }
    },

    async updateConfig(config: Partial<ModelConfig>): Promise<ModelConfig> {
      try {
        return await apiRequest<ModelConfig>('/models/config', {
          method: 'PUT',
          body: JSON.stringify(config),
        });
      } catch (err) {
        console.warn('Backend PUT /models/config failed, saving to local storage:', err);
        const current = await this.getConfig();
        const merged = { ...current, ...config };
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(merged));
        }
        return merged;
      }
    },
  },

  // Model alias (singular)
  model: {
    async getConfig(): Promise<ModelConfig> {
      return api.models.getConfig();
    },
    async updateConfig(config: Partial<ModelConfig>): Promise<ModelConfig> {
      return api.models.updateConfig(config);
    },
  },
};
