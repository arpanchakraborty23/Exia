/**
 * Core HTTP layer for the Exia API client.
 *
 * Platform-agnostic by design: fetch and token storage are injectable so
 * each target supplies its own implementation (web: localStorage /
 * window.fetch; native: a secure-storage adapter / React Native fetch).
 * Shared code must never import a platform storage module directly.
 */

/** Normalized API error surfaced to every UI target. */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Token persistence adapter. Implement per platform:
 * web → localStorage, Android → expo-secure-store, Windows → Win32
 * credential vault. Never ship one platform's storage into shared code.
 */
export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string | null): Promise<void>;
}

/** Non-persistent fallback (tests, or before a platform adapter is wired). */
export class InMemoryTokenStorage implements TokenStorage {
  private token: string | null = null;

  async getToken(): Promise<string | null> {
    return this.token;
  }

  async setToken(token: string | null): Promise<void> {
    this.token = token;
  }
}

export interface ApiClientOptions {
  /** API base URL including the /api suffix, e.g. "http://127.0.0.1:12568/api" */
  baseUrl: string;
  tokenStorage?: TokenStorage;
  fetchImpl?: typeof fetch;
}

export type RequestFn = <T>(endpoint: string, init?: RequestInit) => Promise<T>;

export function createRequestFn(options: ApiClientOptions): RequestFn {
  const fetchImpl = options.fetchImpl ?? fetch;

  return async function request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const token = options.tokenStorage ? await options.tokenStorage.getToken() : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) ?? {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${options.baseUrl}${endpoint}`;

    const res = await fetchImpl(url, { ...init, headers });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { detail?: unknown; message?: unknown };
      const detail = data.detail ?? data.message;
      throw new ApiError(
        typeof detail === 'string' && detail ? detail : `Request failed with status ${res.status}`,
        res.status,
        detail,
      );
    }

    return (await res.json()) as T;
  };
}
