/**
 * The mobile/desktop app's Exia API client.
 *
 * Supports dynamic runtime switching between Cloud backend (`https://exia-backend.vercel.app/api`),
 * Local development backend (`http://127.0.0.1:8000/api`), and custom self-hosted endpoints.
 */
import { createApiClient } from '@exia/api-client';

import { getStoredSetupConfigSync, saveStoredSetupConfig, DEFAULT_CLOUD_API_URL } from './desktop-config';
import { SecureTokenStorage } from './secure-token-storage';

let currentApiUrl = getStoredSetupConfigSync().apiUrl || DEFAULT_CLOUD_API_URL;

export function getApiBaseUrl(): string {
  return currentApiUrl;
}

export function setApiBaseUrl(url: string): void {
  const normalized = url.trim().replace(/\/+$/, '');
  currentApiUrl = normalized;
  void saveStoredSetupConfig({ apiUrl: normalized });
}

export const API_BASE_URL = currentApiUrl;

/**
 * Session token storage. Metro picks the platform file automatically:
 * Keystore/Keychain on native, localStorage on web (see secure-token-storage*).
 */
export const tokenStorage = new SecureTokenStorage();

export const api = createApiClient({
  baseUrl: () => getApiBaseUrl(),
  tokenStorage,
});
