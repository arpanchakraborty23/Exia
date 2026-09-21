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

const STORAGE_KEYS = {
  TOKEN: 'ha_auth_token',
  USER: 'ha_auth_user',
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

// ---------------- LIVE BACKEND API SERVICES ----------------

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
      return await apiRequest<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
    },

    async logout(): Promise<void> {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
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
      return await apiRequest<LiveKitTokenResponse>('/agent/token', {
        method: 'POST',
        body: JSON.stringify({ room_name: roomName }),
      });
    },

    async endSession(sessionId: string): Promise<{ message: string }> {
      return await apiRequest<{ message: string }>(`/sessions/${sessionId}/end`, {
        method: 'POST',
      });
    },
  },

  // 3. Sessions History
  sessions: {
    async getSessions(
      page = 1,
      limit = 10
    ): Promise<{ sessions: SessionSummary[]; total: number }> {
      return await apiRequest<{ sessions: SessionSummary[]; total: number }>(
        `/sessions?page=${page}&limit=${limit}`
      );
    },

    async getSessionById(id: string): Promise<SessionDetail> {
      return await apiRequest<SessionDetail>(`/sessions/${id}`);
    },
  },

  // 4. MCP Servers (Backend: POST /api/add, GET /api/list, PUT/DELETE /api/{name})
  mcp: {
    async list(): Promise<MCPServer[]> {
      const data = await apiRequest<{ servers: BackendMCP[]; count: number }>('/list');
      return await Promise.all(
        (data.servers || []).map(async (s) =>
          toMCPServer(s, await fetchMCPToolNames(s.server_name))
        )
      );
    },

    async create(server: Omit<MCPServer, 'id' | 'created_at'>): Promise<MCPServer> {
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
        const current = await this.list();
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
      await apiRequest(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return { success: true };
    },
  },

  // 5. Prompts (Backend: POST /api/prompts, GET /api/prompts, PUT/DELETE /api/prompts/{id})
  prompts: {
    async list(): Promise<PromptItem[]> {
      return await apiRequest<PromptItem[]>('/prompts');
    },

    async getPrompts(): Promise<PromptItem[]> {
      return this.list();
    },

    async create(prompt: Omit<PromptItem, 'id' | 'created_at'>): Promise<PromptItem> {
      return await apiRequest<PromptItem>('/prompts', {
        method: 'POST',
        body: JSON.stringify(prompt),
      });
    },

    async createPrompt(prompt: Omit<PromptItem, 'id' | 'created_at'>): Promise<PromptItem> {
      return this.create(prompt);
    },

    async update(id: string, prompt: Partial<PromptItem>): Promise<PromptItem> {
      return await apiRequest<PromptItem>(`/prompts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(prompt),
      });
    },

    async updatePrompt(id: string, prompt: Partial<PromptItem>): Promise<PromptItem> {
      return this.update(id, prompt);
    },

    async delete(id: string): Promise<{ success: boolean }> {
      await apiRequest<{ success: boolean }>(`/prompts/${id}`, {
        method: 'DELETE',
      });
      return { success: true };
    },

    async deletePrompt(id: string): Promise<{ success: boolean }> {
      return this.delete(id);
    },
  },

  // 6. Model Engine Config (Backend: GET /api/models/config, PUT /api/models/config)
  models: {
    async getConfig(): Promise<ModelConfig> {
      return await apiRequest<ModelConfig>('/models/config');
    },

    async updateConfig(config: Partial<ModelConfig>): Promise<ModelConfig> {
      return await apiRequest<ModelConfig>('/models/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
    },
  },

  // Model alias
  model: {
    async getConfig(): Promise<ModelConfig> {
      return api.models.getConfig();
    },
    async updateConfig(config: Partial<ModelConfig>): Promise<ModelConfig> {
      return api.models.updateConfig(config);
    },
  },
};
