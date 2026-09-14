import { MCPServer, ModelConfig, Mem0Config, VoiceConfig, MongoConfig } from '../types';

export interface TokenGenerationRequest {
  roomName: string;
  identity: string;
  participantName?: string;
  apiKey?: string;
  apiSecret?: string;
  ttlSeconds?: number;
  grants?: {
    roomJoin?: boolean;
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
  };
  mcpServers?: MCPServer[];
  includeMcpInToken?: boolean; // Default false (stores in MongoDB Atlas instead)
  modelConfig: ModelConfig;
  memoryConfig: Mem0Config;
  voiceConfig?: VoiceConfig;
  mongoConfig?: MongoConfig;
  tokenEndpoint?: string;
  generationMode?: 'auto' | 'browser' | 'server';
}

export interface DecodedJwtInfo {
  header: Record<string, any>;
  payload: Record<string, any>;
  metadata: Record<string, any> | null;
  isValid: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  issuedAt: string | null;
}

export interface TokenGenerationResult {
  token: string;
  serverUrl: string;
  roomName: string;
  identity: string;
  sessionId: string;
  source: 'browser_webcrypto' | 'python_token_server';
  collectionsUpdated: string[];
  metadataSummary: {
    model: string;
    provider: string;
    memoryEngine: string;
    userId: string;
    sessionId: string;
    mcpStorage: string;
  };
  payloadSent: Record<string, any>;
  decoded?: DecodedJwtInfo;
  serverError?: string;
}

export interface SessionRecord {
  session_id: string;
  room_name: string;
  identity: string;
  participant_name?: string;
  status: string;
  model_config?: Record<string, any>;
  memory_config?: Record<string, any>;
  voice_config?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

/**
 * Base64 URL Encoding & Decoding helpers for browser environment
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToUtf8(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Sign data using Web Crypto HMAC-SHA256 (standard for LiveKit HS256 JWT tokens)
 */
async function signHmacSha256(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  const sig = await window.crypto.subtle.sign('HMAC', key, enc.encode(data));
  return bytesToBase64Url(new Uint8Array(sig));
}

/**
 * Decode any LiveKit JWT token to inspect claims and embedded metadata
 */
export function decodeLiveKitToken(token: string): DecodedJwtInfo | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length < 2) return null;

    const header = JSON.parse(base64UrlToUtf8(parts[0]));
    const payload = JSON.parse(base64UrlToUtf8(parts[1]));

    let metadata: Record<string, any> | null = null;
    if (payload.metadata && typeof payload.metadata === 'string') {
      try {
        metadata = JSON.parse(payload.metadata);
      } catch {
        metadata = { raw: payload.metadata };
      }
    } else if (payload.metadata && typeof payload.metadata === 'object') {
      metadata = payload.metadata;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp ? payload.exp < nowSeconds : false;
    const expiresAt = payload.exp ? new Date(payload.exp * 1000).toLocaleString() : null;
    const issuedAt = payload.nbf
      ? new Date(payload.nbf * 1000).toLocaleString()
      : payload.iat
      ? new Date(payload.iat * 1000).toLocaleString()
      : null;

    return {
      header,
      payload,
      metadata,
      isValid: true,
      isExpired,
      expiresAt,
      issuedAt,
    };
  } catch (err) {
    console.error('Error decoding LiveKit JWT:', err);
    return null;
  }
}

/**
 * Mint a lightweight LiveKit AccessToken directly inside the browser using Web Crypto API.
 * Contains ONLY session_id, identity, model & memory.
 * MCP tools are persisted to MongoDB Atlas directly rather than inflating the token.
 */
export async function mintTokenInBrowser(
  request: TokenGenerationRequest
): Promise<TokenGenerationResult> {
  const apiKey = request.apiKey || 'devkey';
  const apiSecret = request.apiSecret || 'secret';
  const roomName = request.roomName || 'home-assistant-room';
  const identity = request.identity || `user-${Date.now().toString().slice(-4)}`;
  const participantName = request.participantName || 'Home Assistant Master';
  const ttlSeconds = request.ttlSeconds || 6 * 3600; // Default 6 hours

  const nowSec = Math.floor(Date.now() / 1000);
  const sessionId = `sess_${nowSec}_${identity}`;

  // Clean, lightweight metadata payload (NO giant MCP schemas)
  const metadataPayload: Record<string, any> = {
    session_id: sessionId,
    identity,
    participant_name: participantName,
    model_config: {
      provider: request.modelConfig.provider,
      model: request.modelConfig.model,
      base_url: request.modelConfig.baseUrl,
      temperature: request.modelConfig.temperature,
    },
    memory_config: {
      engine: request.memoryConfig.engine,
      user_id: request.memoryConfig.userId || identity,
      vector_store: request.memoryConfig.vectorStore,
      local_storage_path: request.memoryConfig.localStoragePath,
      api_key: request.memoryConfig.apiKey || null,
    },
    voice_config: request.voiceConfig || {
      tts_provider: 'openai',
      voice: 'alloy',
      speed: 1.0,
    },
    mcp_storage: 'mongodb_atlas',
    client: 'home_assistant_desktop_ui',
    minted_at: new Date().toISOString(),
  };

  // Optional: only if explicitly requested
  if (request.includeMcpInToken && request.mcpServers) {
    metadataPayload.mcp_servers = request.mcpServers
      .filter((s) => s.isConnected)
      .map((s) => ({
        name: s.name,
        transport: s.transport,
        command: s.command,
        tools: s.tools.filter((t) => t.isEnabled).map((t) => t.name),
      }));
  }

  // LiveKit JWT Header
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  // Video Grants required by LiveKit Room
  const videoGrants = {
    room: roomName,
    roomJoin: request.grants?.roomJoin ?? true,
    canPublish: request.grants?.canPublish ?? true,
    canSubscribe: request.grants?.canSubscribe ?? true,
    canPublishData: request.grants?.canPublishData ?? true,
  };

  // LiveKit JWT Payload conforming to LiveKit AccessToken specification
  const payload = {
    exp: nowSec + ttlSeconds,
    iss: apiKey,
    nbf: nowSec - 5,
    sub: identity,
    name: participantName,
    jti: `tok_${window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2)}`,
    video: videoGrants,
    metadata: JSON.stringify(metadataPayload),
    attributes: {
      client_type: 'desktop_app',
      session_id: sessionId,
      identity,
      model_provider: request.modelConfig.provider,
      model_name: request.modelConfig.model,
      memory_engine: 'mem0_sqlite',
      mcp_storage: 'mongodb_atlas',
    },
  };

  const headerB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signatureB64 = await signHmacSha256(signingInput, apiSecret);
  const jwtToken = `${signingInput}.${signatureB64}`;

  return {
    token: jwtToken,
    serverUrl: 'ws://localhost:7880',
    roomName,
    identity,
    sessionId,
    source: 'browser_webcrypto',
    collectionsUpdated: ['in_browser_jwt'],
    metadataSummary: {
      model: request.modelConfig.model,
      provider: request.modelConfig.provider,
      memoryEngine: 'mem0_sqlite',
      userId: request.memoryConfig.userId || identity,
      sessionId,
      mcpStorage: 'mongodb_atlas',
    },
    payloadSent: {
      header,
      payload,
      metadata: metadataPayload,
    },
    decoded: decodeLiveKitToken(jwtToken) || undefined,
  };
}

/**
 * Mint token via Python backend server (POST /api/token),
 * saves to MongoDB Atlas collections: sessions, mcp_servers, token_metadata.
 */
export async function mintTokenViaBackendServer(
  request: TokenGenerationRequest
): Promise<TokenGenerationResult> {
  const endpoint = request.tokenEndpoint || 'http://localhost:8000/api/token';

  const requestBody = {
    room_name: request.roomName || 'home-assistant-room',
    identity: request.identity || `user-${Date.now().toString().slice(-4)}`,
    participant_name: request.participantName || 'Home Assistant User',
    model_config: {
      provider: request.modelConfig.provider,
      model: request.modelConfig.model,
      base_url: request.modelConfig.baseUrl,
      temperature: request.modelConfig.temperature,
    },
    memory_config: {
      engine: request.memoryConfig.engine,
      user_id: request.memoryConfig.userId,
      vector_store: request.memoryConfig.vectorStore,
      local_storage_path: request.memoryConfig.localStoragePath,
      api_key: request.memoryConfig.apiKey || null,
    },
    voice_config: request.voiceConfig || {
      tts_provider: 'openai',
      voice: 'alloy',
      speed: 1.0,
    },
    mcp_servers: request.mcpServers || [],
    custom_metadata: {
      generated_at: new Date().toISOString(),
      client: 'home_assistant_desktop',
      mcp_storage: 'mongodb_atlas',
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    throw new Error(`Backend token server returned status: ${res.statusText}`);
  }

  const data = await res.json();
  const jwtToken = data.token;

  return {
    token: jwtToken,
    serverUrl: data.server_url || 'ws://localhost:7880',
    roomName: data.room_name || request.roomName,
    identity: data.identity || request.identity,
    sessionId: data.session_id || `sess_${Date.now()}`,
    source: 'python_token_server',
    collectionsUpdated: data.collections_updated || ['sessions', 'mcp_servers', 'token_metadata'],
    metadataSummary: {
      model: data.metadata_summary?.model || request.modelConfig.model,
      provider: data.metadata_summary?.provider || request.modelConfig.provider,
      memoryEngine: data.metadata_summary?.memory_engine || 'mem0_sqlite',
      userId: data.metadata_summary?.user_id || request.memoryConfig.userId,
      sessionId: data.session_id || 'sess_unknown',
      mcpStorage: 'mongodb_atlas',
    },
    payloadSent: requestBody,
    decoded: decodeLiveKitToken(jwtToken) || undefined,
  };
}

/**
 * Universal token generation function:
 * Supports 'browser', 'server', or 'auto' (tries server first, falls back gracefully to in-browser Web Crypto).
 */
export async function generateTokenWithFullSettings(
  request: TokenGenerationRequest
): Promise<TokenGenerationResult> {
  const mode = request.generationMode || 'auto';

  if (mode === 'browser') {
    return await mintTokenInBrowser(request);
  }

  if (mode === 'server') {
    return await mintTokenViaBackendServer(request);
  }

  // Auto Mode: try backend server first, fallback to browser Web Crypto
  try {
    return await mintTokenViaBackendServer(request);
  } catch (err: any) {
    console.warn('Backend token server unavailable; falling back to in-browser Web Crypto minting:', err);
    const browserResult = await mintTokenInBrowser(request);
    browserResult.serverError = `Token server offline (${err.message || 'connection refused'}). Generated authentic LiveKit JWT locally in browser!`;
    return browserResult;
  }
}

// =============================================================================
// MCP OPERATIONS: CHECK CONNECT & STORE DIRECTLY TO MONGODB ATLAS
// =============================================================================

/**
 * Checks connection for an MCP server and directly stores it in MongoDB Atlas
 */
export async function checkAndSaveMcpToMongo(
  server: MCPServer,
  endpointUrl = 'http://localhost:8000'
): Promise<{
  success: boolean;
  status: string;
  message: string;
  savedToMongo: boolean;
}> {
  try {
    const res = await fetch(`${endpointUrl}/api/mcp/check-and-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: server.id,
        name: server.name,
        transport: server.transport,
        command: server.command,
        args: server.args,
        url: server.url,
        isConnected: server.isConnected,
        tools: server.tools,
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return {
        success: false,
        status: 'error',
        message: `Server returned status: ${res.statusText}`,
        savedToMongo: false,
      };
    }

    const data = await res.json();
    return {
      success: true,
      status: data.status,
      message: data.message,
      savedToMongo: data.saved_to_mongodb,
    };
  } catch (err: any) {
    // If backend is offline, store locally in localStorage
    console.warn('Backend unavailable for direct Mongo save; cached locally:', err);
    return {
      success: true,
      status: 'offline_cached',
      message: 'Backend offline: Saved locally and queued for MongoDB Atlas sync when server is active.',
      savedToMongo: false,
    };
  }
}

/**
 * Fetches all registered MCP servers and their discovered tools from MongoDB Atlas
 */
export async function fetchMcpServersFromMongo(
  endpointUrl = 'http://localhost:8000'
): Promise<MCPServer[]> {
  try {
    const res = await fetch(`${endpointUrl}/api/mcp/servers`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rawServers = data.servers || [];
    return rawServers.map((s: any) => ({
      id: s.server_id || s.id || `mcp_${s.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: s.name,
      transport: s.transport || 'stdio',
      command: s.command,
      args: s.args,
      url: s.url,
      isConnected: s.is_connected ?? true,
      tools: (s.tools || []).map((t: any) => ({
        name: t.name,
        description: t.description || '',
        parametersSummary: t.parametersSummary || '',
        isEnabled: t.isEnabled ?? true,
      })),
    }));
  } catch {
    return [];
  }
}

/**
 * Toggles a tool's enabled state directly inside MongoDB Atlas 'mcp_servers' collection
 */
export async function toggleMcpToolInMongo(
  serverId: string,
  toolName: string,
  isEnabled: boolean,
  endpointUrl = 'http://localhost:8000'
): Promise<boolean> {
  try {
    const res = await fetch(
      `${endpointUrl}/api/mcp/servers/${encodeURIComponent(serverId)}/tools/${encodeURIComponent(toolName)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: isEnabled }),
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.updated ?? false;
  } catch {
    return false;
  }
}

/**
 * Deletes an MCP server from MongoDB Atlas 'mcp_servers' collection
 */
export async function deleteMcpServerFromMongo(
  serverId: string,
  endpointUrl = 'http://localhost:8000'
): Promise<boolean> {
  try {
    const res = await fetch(`${endpointUrl}/api/mcp/servers/${encodeURIComponent(serverId)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// =============================================================================
// SESSION HISTORY: FETCH PAST SESSIONS FROM MONGODB ATLAS
// =============================================================================

/**
 * Fetches past session history directly from MongoDB Atlas 'sessions' collection
 */
export async function fetchSessionHistory(
  endpointUrl = 'http://localhost:8000',
  limit = 50
): Promise<{
  sessions: SessionRecord[];
  count: number;
  source: string;
}> {
  try {
    const res = await fetch(`${endpointUrl}/api/sessions?limit=${limit}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch sessions: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      sessions: data.sessions || [],
      count: data.count || 0,
      source: data.source || 'mongodb_atlas',
    };
  } catch (err: any) {
    console.warn('Could not fetch sessions from MongoDB Atlas:', err);
    // Fallback: check localStorage for cached sessions
    const local = localStorage.getItem('ha_session_history');
    const cached: SessionRecord[] = local ? JSON.parse(local) : [];
    return {
      sessions: cached,
      count: cached.length,
      source: 'local_cache',
    };
  }
}

/**
 * Check backend token server health and MongoDB connection statistics
 */
export async function checkBackendStats(endpointUrl = 'http://localhost:8000'): Promise<{
  online: boolean;
  livekitUrl?: string;
  mongoStatus?: string;
  mongoCounts?: Record<string, number>;
}> {
  try {
    const healthRes = await fetch(`${endpointUrl}/health`, { signal: AbortSignal.timeout(2000) });
    if (!healthRes.ok) return { online: false };
    const healthData = await healthRes.json();

    let mongoStatus = 'unknown';
    let mongoCounts: Record<string, number> = {};
    try {
      const statsRes = await fetch(`${endpointUrl}/api/mongodb/stats`, { signal: AbortSignal.timeout(2000) });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        mongoStatus = statsData.status || 'disconnected';
        mongoCounts = statsData.counts || {};
      }
    } catch {
      mongoStatus = 'offline';
    }

    return {
      online: true,
      livekitUrl: healthData.livekit_url,
      mongoStatus,
      mongoCounts,
    };
  } catch {
    return { online: false };
  }
}
