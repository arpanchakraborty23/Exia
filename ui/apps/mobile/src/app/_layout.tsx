import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';

import { ThemeProvider, useTheme, useThemeControl } from '@exia/shared-ui';
import { ApiError } from '@exia/api-client';

import { tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY, useAuthToken } from '@/lib/auth';
import {
  DEFAULT_USER_PREFERENCES,
  getStoredPreferences,
  saveStoredPreferences,
  type UserPreferences,
} from '@/lib/theme-storage';

async function handleUnauthorized(error: unknown, qc: QueryClient) {
  const cached = qc.getQueryData<string | null>(AUTH_TOKEN_KEY);
  if (!cached) return;
  if (!(error instanceof ApiError) || error.status !== 401) return;
  try {
    await tokenStorage.setToken(null);
  } catch {
    // best effort
  }
  await qc.clear();
  qc.setQueryData(AUTH_TOKEN_KEY, null);
  router.replace('/login');
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      void handleUnauthorized(error, queryClient);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      void handleUnauthorized(error, queryClient);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void getStoredPreferences().then((loaded) => {
      setPrefs(loaded);
      setHydrated(true);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        initialMode={prefs.mode}
        initialAccent={prefs.accent}
        initialButtonRadius={prefs.buttonRadius}
        initialButtonStyle={prefs.buttonStyle}
        initialFontStyle={prefs.fontStyle}
        onPreferencesChange={(updated) => {
          void saveStoredPreferences(updated);
        }}
      >
        <ThemedApp />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ThemedApp() {
  const { resolvedMode } = useThemeControl();
  return (
    <>
      <StatusBar style={resolvedMode === 'light' ? 'dark' : 'light'} />
      <RootNavigator />
    </>
  );
}

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
      <Stack.Screen name="register" options={{ presentation: 'modal' }} />
      <Stack.Screen name="session/[id]" />
      <Stack.Screen name="voice" options={{ headerShown: false }} />
      <Stack.Screen name="mcp-editor" options={{ presentation: 'modal' }} />
      <Stack.Screen name="prompt-editor" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
