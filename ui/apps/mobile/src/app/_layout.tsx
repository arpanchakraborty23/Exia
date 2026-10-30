import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useTheme } from '@exia/shared-ui';

import { useAuthToken, AUTH_TOKEN_KEY } from '@/lib/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <RootNavigator />
    </QueryClientProvider>
  );
}

/**
 * Gates the navigator on token hydration: renders nothing while the secure
 * store is read, then redirects to /login when there is no session. Tabs
 * additionally render null while signed out (see (tabs)/_layout), so a cold
 * start never flashes the authenticated UI.
 */
function RootNavigator() {
  const t = useTheme();
  const queryClient = useQueryClient();
  const { data: token, isLoading } = useAuthToken();

  useEffect(() => {
    if (!isLoading && !token) {
      queryClient.setQueryData(AUTH_TOKEN_KEY, null);
      router.replace('/login');
    }
  }, [isLoading, token, queryClient]);

  if (isLoading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" options={{ presentation: 'modal' }} />
      <Stack.Screen name="session/[id]" />
      <Stack.Screen name="mcp-editor" options={{ presentation: 'modal' }} />
      <Stack.Screen name="prompt-editor" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
