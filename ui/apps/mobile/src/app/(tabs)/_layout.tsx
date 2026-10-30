import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useTheme } from '@exia/shared-ui';

import { useAuthToken } from '@/lib/auth';

export default function TabsLayout() {
  const t = useTheme();
  const { data: token } = useAuthToken();

  // Auth gate: don't mount tab screens (or their queries) while signed out.
  if (!token) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.mutedForeground,
        tabBarStyle: {
          backgroundColor: t.card,
          borderTopColor: t.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={typeof color === 'string' ? color : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={typeof color === 'string' ? color : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={typeof color === 'string' ? color : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="mcp"
        options={{
          title: 'MCP',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip-outline" size={size} color={typeof color === 'string' ? color : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="prompts"
        options={{
          title: 'Prompts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={typeof color === 'string' ? color : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={typeof color === 'string' ? color : undefined} />
          ),
        }}
      />
    </Tabs>
  );
}
