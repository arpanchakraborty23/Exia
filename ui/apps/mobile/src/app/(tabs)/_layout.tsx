import React from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand, radius } from '@exia/design-tokens';
import { useTheme } from '@exia/shared-ui';

import { useAuthToken } from '@/lib/auth';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { AppTopBar } from '@/components/navigation/app-top-bar';

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { data: token } = useAuthToken();
  const { width } = useWindowDimensions();

  // Wide layout (Web / Desktop) when screen width >= 768px
  const isWide = width >= 768;

  // Auth gate: don't mount tab screens (or their queries) while signed out.
  if (!token) return null;

  const mobileTabHeight = Platform.OS === 'ios'
    ? (insets.bottom > 0 ? 56 + insets.bottom : 64)
    : (60 + insets.bottom);

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {isWide && <AppSidebar />}

      <View style={[styles.content, isWide && styles.contentWide]}>
        {isWide && <AppTopBar />}

        <View style={[styles.canvasWrapper, isWide && styles.canvasWrapperWide]}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: brand.electricCyan,
              tabBarInactiveTintColor: t.mutedForeground,
              tabBarHideOnKeyboard: true,
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.1,
                marginTop: 1,
              },
              tabBarItemStyle: {
                minHeight: 48,
                minWidth: 48,
                paddingVertical: 4,
                justifyContent: 'center',
                alignItems: 'center',
              },
              tabBarStyle: isWide
                ? { display: 'none' }
                : {
                    backgroundColor: t.card,
                    borderTopColor: t.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    height: mobileTabHeight,
                    paddingBottom: Math.max(insets.bottom, 6),
                    paddingTop: 6,
                    elevation: 8,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                  },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, focused }) => (
                  <View style={[styles.tabIconPill, focused && styles.tabIconPillActive]}>
                    <Ionicons
                      name={focused ? 'home' : 'home-outline'}
                      size={21}
                      color={focused ? brand.electricCyan : (typeof color === 'string' ? color : undefined)}
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="history"
              options={{
                title: 'History',
                tabBarIcon: ({ color, focused }) => (
                  <View style={[styles.tabIconPill, focused && styles.tabIconPillActive]}>
                    <Ionicons
                      name={focused ? 'time' : 'time-outline'}
                      size={21}
                      color={focused ? brand.electricCyan : (typeof color === 'string' ? color : undefined)}
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="analytics"
              options={{
                title: 'Analytics',
                tabBarIcon: ({ color, focused }) => (
                  <View style={[styles.tabIconPill, focused && styles.tabIconPillActive]}>
                    <Ionicons
                      name={focused ? 'stats-chart' : 'stats-chart-outline'}
                      size={21}
                      color={focused ? brand.electricCyan : (typeof color === 'string' ? color : undefined)}
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: 'Settings',
                tabBarIcon: ({ color, focused }) => (
                  <View style={[styles.tabIconPill, focused && styles.tabIconPillActive]}>
                    <Ionicons
                      name={focused ? 'settings' : 'settings-outline'}
                      size={21}
                      color={focused ? brand.electricCyan : (typeof color === 'string' ? color : undefined)}
                    />
                  </View>
                ),
              }}
            />
            {/* Registered routes accessible via left sidebar or Settings hub on mobile */}
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

        {/* Floating Voice Orb (thumb-zone FAB for 1-tap instant voice call on mobile) */}
        {!isWide && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start voice session"
            accessibilityHint="Launch real-time AI voice conversation with Exia"
            onPress={() => router.push('/voice')}
            style={({ pressed }) => [
              styles.floatingOrb,
              {
                bottom: mobileTabHeight + 16,
                transform: [{ scale: pressed ? 0.94 : 1 }],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={styles.floatingOrbHalo} />
            <View style={styles.floatingOrbInner}>
              <Ionicons name="mic" size={26} color="#000000" />
            </View>
          </Pressable>
        )}
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
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  contentWide: {
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  canvasWrapperWide: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  tabIconPill: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 46,
    height: 28,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    marginBottom: 2,
  },
  tabIconPillActive: {
    backgroundColor: 'rgba(31, 213, 249, 0.14)',
  },
  floatingOrb: {
    position: 'absolute',
    right: 20,
    zIndex: 99,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.electricCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingOrbHalo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(31, 213, 249, 0.28)',
  },
  floatingOrbInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: brand.electricCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
