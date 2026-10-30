import * as SecureStore from 'expo-secure-store';

import type { TokenStorage } from '@exia/api-client';

const TOKEN_KEY = 'exia.auth.token';

/**
 * Native token storage — Android Keystore / iOS Keychain via expo-secure-store.
 * This is the app-layer adapter implementing the shared TokenStorage interface;
 * shared code never imports this module (ui/README.md §9).
 */
export class SecureTokenStorage implements TokenStorage {
  async getToken(): Promise<string | null> {
    return (await SecureStore.getItemAsync(TOKEN_KEY)) ?? null;
  }

  async setToken(token: string | null): Promise<void> {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }
}
