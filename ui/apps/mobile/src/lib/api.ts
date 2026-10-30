/**
 * The mobile app's Exia API client.
 *
 * EXPO_PUBLIC_API_URL is inlined at bundle time by Expo — point it at a LAN
 * backend when testing on a physical device, e.g.
 *   EXPO_PUBLIC_API_URL=http://192.168.1.10:12568/api npx expo start
 */
import { createApiClient, InMemoryTokenStorage } from '@exia/api-client';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:12568/api';

/**
 * Session token storage. In-memory for now — the secure-storage adapter
 * (expo-secure-store on Android) lands with the settings milestone; per
 * ui/README.md §9, shared code never imports platform storage directly.
 */
export const tokenStorage = new InMemoryTokenStorage();

export const api = createApiClient({ baseUrl: API_BASE_URL, tokenStorage });
