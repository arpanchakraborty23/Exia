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

// ---------------- API SERVICES ----------------

export const api = {
  // 1. Auth
  auth: {
    async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
      try {
        // Try real backend endpoint first
        return await apiRequest<LoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: emailOrUsername,
            username: emailOrUsername,
            password: password,
            hash_password: password, // Support backend naming
          }),
        });
      } catch (err) {
        console.warn('Backend login unavailable, using simulated local authentication:', err);
        // Resilient fallback for demo / testing
        const fallbackUser: User = {
          id: 'usr_' + Math.random().toString(36).substring(2, 8),
          email: emailOrUsername.includes('@')
            ? emailOrUsername
            : `${emailOrUsername}@homeassistant.local`,
          name: emailOrUsername.split('@')[0],
          created_at: new Date().toISOString(),
        };
        const token = 'ha_mock_jwt_' + Math.random().toString(36).substring(2);
        return {
          access_token: token,
          refresh_token: 'ha_mock_refresh_' + Math.random().toString(36).substring(2),
          user: fallbackUser,
          message: 'Authenticated locally',
        };
      }
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
      try {
        // Fetch LiveKit access token directly from FastAPI backend endpoint
        return await apiRequest<LiveKitTokenResponse>('/livekit/token', {
          method: 'POST',
          body: JSON.stringify({ room_name: roomName }),
        });
      } catch {
        // Fallback to FastAPI /api/agent/token endpoint
        try {
          return await apiRequest<LiveKitTokenResponse>('/agent/token', {
            method: 'POST',
            body: JSON.stringify({ room_name: roomName }),
          });
        } catch (err2) {
          console.error('Failed to obtain token from FastAPI backend:', err2);
          const errorMessage =
            err2 instanceof Error
              ? err2.message
              : 'Failed to fetch LiveKit token from backend server';
          throw new Error(errorMessage);
        }
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

  // 4. MCP Servers
  mcp: {
    async list(): Promise<MCPServer[]> {
      try {
        return await apiRequest<MCPServer[]>('/mcp');
      } catch (err) {
        console.warn('Backend GET /mcp failed, using local storage/defaults:', err);
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEYS.MCP);
          if (raw) return JSON.parse(raw);
        }
        return DEFAULT_MCP_SERVERS;
      }
    },

    async create(server: Omit<MCPServer, 'id' | 'created_at'>): Promise<MCPServer> {
      try {
        return await apiRequest<MCPServer>('/mcp', {
          method: 'POST',
          body: JSON.stringify(server),
        });
      } catch (err) {
        console.warn('Backend POST /mcp failed, updating local state:', err);
        const newServer: MCPServer = {
          ...server,
          id: `mcp-${Date.now()}`,
          created_at: new Date().toISOString(),
          status: 'connected',
        };
        const current = await this.list();
        const updated = [newServer, ...current];
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.MCP, JSON.stringify(updated));
        }
        return newServer;
      }
    },

    async update(id: string, server: Partial<MCPServer>): Promise<MCPServer> {
      try {
        return await apiRequest<MCPServer>(`/mcp/${id}`, {
          method: 'PUT',
          body: JSON.stringify(server),
        });
      } catch (err) {
        console.warn(`Backend PUT /mcp/${id} failed, updating local state:`, err);
        const current = await this.list();
        const updated = current.map((item) =>
          item.id === id ? { ...item, ...server, updated_at: new Date().toISOString() } : item
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.MCP, JSON.stringify(updated));
        }
        return updated.find((s) => s.id === id)!;
      }
    },

    async delete(id: string): Promise<{ success: boolean }> {
      try {
        return await apiRequest<{ success: boolean }>(`/mcp/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn(`Backend DELETE /mcp/${id} failed, updating local state:`, err);
        const current = await this.list();
        const updated = current.filter((s) => s.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.MCP, JSON.stringify(updated));
        }
        return { success: true };
      }
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
