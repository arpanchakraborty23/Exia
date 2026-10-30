import type { TokenStorage } from '@exia/api-client';

const TOKEN_KEY = 'exia.auth.token';

/**
 * Web token storage — expo-secure-store is unavailable on the web target, so
 * the browser build falls back to localStorage. Metro resolves this file for
 * `.web` bundles and `secure-token-storage.ts` for native (ui/README.md §5).
 */
export class SecureTokenStorage implements TokenStorage {
  async getToken(): Promise<string | null> {
    return localStorage.getItem(TOKEN_KEY);
  }

  async setToken(token: string | null): Promise<void> {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}
