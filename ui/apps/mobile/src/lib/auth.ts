import { useQuery } from '@tanstack/react-query';

import { tokenStorage } from './api';

/** React Query cache key holding the persisted session token (string | null). */
export const AUTH_TOKEN_KEY = ['auth', 'token'] as const;

/**
 * Reads the persisted session token. The root layout gates on `isLoading`
 * (hydration) and tabs render only when a token exists, so cold starts never
 * flash the wrong screen (expo-data-fetching guidance).
 */
export function useAuthToken() {
  return useQuery({
    queryKey: AUTH_TOKEN_KEY,
    queryFn: () => tokenStorage.getToken(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
