import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useTheme } from '@exia/shared-ui';

import { useAuthToken } from '@/lib/auth';
import { DesktopSidebar } from '@/components/navigation/desktop-sidebar';

export default function TabsLayout() {
  const t = useTheme();
  const { data: token } = useAuthToken();
  const { width } = useWindowDimensions();

  // Desktop & Web layout when screen width >= 768px (standard tablet / desktop / web breakpoint)
  const isDesktop = width >= 768;

  // Auth gate: don't mount tab screens (or their queries) while signed out.
  if (!token) return null;

  return (
    <View style={styles.container}>
      {isDesktop && <DesktopSidebar />}

      <View style={styles.content}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: t.primary,
            tabBarInactiveTintColor: t.mutedForeground,
            tabBarStyle: isDesktop
              ? { display: 'none' }
              : {
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
                <Ionicons
                  name="home-outline"
                  size={size}
                  color={typeof color === 'string' ? color : undefined}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: 'History',
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="time-outline"
                  size={size}
                  color={typeof color === 'string' ? color : undefined}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="analytics"
            options={{
              title: 'Analytics',
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="stats-chart-outline"
                  size={size}
                  color={typeof color === 'string' ? color : undefined}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name="settings-outline"
                  size={size}
                  color={typeof color === 'string' ? color : undefined}
                />
              ),
            }}
          />
          {/* Registered routes accessible via left sidebar on desktop/web */}
          <Tabs.Screen
            name="mcp"
            options={{
              href: null,
              title: 'MCP',
            }}
          />
          <Tabs.Screen
            name="prompts"
            options={{
              href: null,
              title: 'Prompts',
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    height: '100%',
  },
});
