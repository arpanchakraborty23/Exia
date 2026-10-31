import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, useSegments } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaBadge, ExiaText, useTheme } from '@exia/shared-ui';

import { setApiBaseUrl } from '@/lib/api';
import {
  DEFAULT_CLOUD_API_URL,
  DEFAULT_LOCAL_API_URL,
  DesktopSetupConfig,
  getStoredSetupConfigSync,
  saveStoredSetupConfig,
} from '@/lib/desktop-config';

export function DesktopTopBar() {
  const t = useTheme();
  const pathname = usePathname();
  const segments = useSegments() as string[];
  const queryClient = useQueryClient();

  const [setupConfig, setSetupConfig] = useState<DesktopSetupConfig>(() =>
    getStoredSetupConfigSync(),
  );

  useEffect(() => {
    const handleStorage = () => {
      setSetupConfig(getStoredSetupConfigSync());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const currentTab = segments && segments[1] ? segments[1] : 'index';

  let currentTitle = 'Dashboard';

  if (currentTab === 'history' || pathname.includes('/history')) {
    currentTitle = 'History & Transcripts';
  } else if (currentTab === 'analytics' || pathname.includes('/analytics')) {
    currentTitle = 'Agent Observability';
  } else if (currentTab === 'mcp' || pathname.includes('/mcp')) {
    currentTitle = 'MCP Tools & Servers';
  } else if (currentTab === 'prompts' || pathname.includes('/prompts')) {
    currentTitle = 'Prompts & Skills';
  } else if (currentTab === 'settings' || pathname.includes('/settings')) {
    currentTitle = 'Settings & Studio Config';
  } else if (pathname.includes('/voice')) {
    currentTitle = 'Voice Studio Pro';
  } else if (pathname.includes('/session')) {
    currentTitle = 'Session Telemetry';
  }

  const isLocalActive = setupConfig.environmentType === 'local';

  const handleFastToggleGateway = async () => {
    const nextEnv = isLocalActive ? 'cloud' : 'local';
    const targetUrl = nextEnv === 'local' ? DEFAULT_LOCAL_API_URL : DEFAULT_CLOUD_API_URL;
    setApiBaseUrl(targetUrl);
    const updated = await saveStoredSetupConfig({
      environmentType: nextEnv,
      apiUrl: targetUrl,
      localMode: nextEnv === 'local',
    });
    setSetupConfig(updated);
    void queryClient.invalidateQueries({ queryKey: ['health'] });
  };

  const pointerStyle = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : undefined;

  return (
    <View
      style={[
        styles.topBar,
        {
          backgroundColor: t.card,
          borderBottomColor: t.border,
        },
      ]}
    >
      <View style={styles.innerContainer}>
        {/* Left: Desktop Studio Breadcrumbs */}
        <View style={styles.breadcrumbRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exia Desktop Dashboard"
            onPress={() => router.replace('/(tabs)')}
            style={[styles.crumbRoot, pointerStyle]}
          >
            <View style={styles.desktopIconBox}>
              <Ionicons name="desktop-outline" size={13} color={brand.electricCyan} />
            </View>
            <ExiaText style={styles.rootText}>EXIA Desktop</ExiaText>
          </Pressable>

          <Ionicons
            name="chevron-forward-outline"
            size={12}
            color={t.mutedForeground}
            style={styles.crumbSeparator}
          />

          <View style={styles.activeCrumb}>
            <ExiaText style={[styles.currentText, { color: t.foreground }]}>
              {currentTitle}
            </ExiaText>
            <ExiaBadge label="PRO STUDIO" tone="accent" />
          </View>
        </View>

        {/* Right: Quick Studio Actions & Desktop Status Indicators */}
        <View style={styles.actionsRow}>
          {/* Active Audio Input Indicator */}
          <View
            accessibilityLabel="Active Audio Input"
            style={[styles.statusPill, { borderColor: t.border, backgroundColor: t.input }]}
          >
            <Ionicons name="mic" size={12} color={brand.electricCyan} />
            <ExiaText numberOfLines={1} style={styles.audioLabel}>
              {setupConfig.audioInputDeviceLabel || 'System Mic'}
            </ExiaText>
            <View style={styles.liveAudioDot} />
          </View>

          {/* Local Daemon vs Cloud Gateway Switcher Pill */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Active Gateway: ${isLocalActive ? 'Local Daemon (127.0.0.1:8000)' : 'Cloud Gateway'}. Click to toggle.`}
            onPress={handleFastToggleGateway}
            style={[
              styles.statusPill,
              pointerStyle,
              {
                borderColor: isLocalActive ? brand.electricCyan : 'rgba(16, 185, 129, 0.35)',
                backgroundColor: isLocalActive ? 'rgba(31, 213, 249, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isLocalActive ? brand.electricCyan : brand.liveEmerald },
              ]}
            />
            <ExiaText
              style={[
                styles.statusText,
                { color: isLocalActive ? brand.electricCyan : brand.liveEmerald },
              ]}
            >
              {isLocalActive ? 'Local: 8000' : 'Cloud: Vercel'}
            </ExiaText>
            <Ionicons
              name="swap-horizontal-outline"
              size={11}
              color={isLocalActive ? brand.electricCyan : brand.liveEmerald}
            />
          </Pressable>

          {/* Quick Voice Studio Launcher */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Launch Voice Studio (Ctrl+Shift+V)"
            onPress={() => router.push('/voice' as any)}
            style={[
              styles.actionPill,
              pointerStyle,
              {
                borderColor: brand.electricCyan,
                backgroundColor: 'rgba(31, 213, 249, 0.12)',
              },
            ]}
          >
            <Ionicons name="mic-outline" size={13} color={brand.electricCyan} />
            <ExiaText style={[styles.actionPillText, { color: brand.electricCyan }]}>
              Voice Studio
            </ExiaText>
            <ExiaText variant="caption" style={styles.actionPillShortcut}>
              ⌘⇧V
            </ExiaText>
          </Pressable>

          {/* Setup Wizard Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Launch Setup Wizard (Ctrl+Shift+S)"
            onPress={() => router.push('/setup' as any)}
            style={[
              styles.actionPill,
              pointerStyle,
              {
                borderColor: t.border,
                backgroundColor: t.input,
              },
            ]}
          >
            <Ionicons name="construct-outline" size={13} color={t.mutedForeground} />
            <ExiaText style={[styles.actionPillText, { color: t.foreground }]}>
              Setup
            </ExiaText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 48,
    width: '100%',
    borderBottomWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  crumbRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  desktopIconBox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(31, 213, 249, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#ffffff',
  },
  crumbSeparator: {
    marginHorizontal: 2,
    opacity: 0.6,
  },
  activeCrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  currentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  audioLabel: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '500',
    maxWidth: 120,
  },
  liveAudioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brand.liveEmerald,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionPillShortcut: {
    fontSize: 10,
    color: 'rgba(31, 213, 249, 0.7)',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
});
