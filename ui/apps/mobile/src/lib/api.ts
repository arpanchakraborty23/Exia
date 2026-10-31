/**
 * The mobile app's Exia API client.
 *
 * EXPO_PUBLIC_API_URL is inlined at bundle time by Expo — point it at a LAN
 * backend when testing on a physical device, e.g.
 *   EXPO_PUBLIC_API_URL=http://192.168.1.10:12568/api npx expo start
 */
import { createApiClient } from '@exia/api-client';

import { SecureTokenStorage } from './secure-token-storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://exia-backend.vercel.app/api';

/**
 * Session token storage. Metro picks the platform file automatically:
 * Keystore/Keychain on native, localStorage on web (see secure-token-storage*).
 */
export const tokenStorage = new SecureTokenStorage();

export const api = createApiClient({ baseUrl: API_BASE_URL, tokenStorage });
