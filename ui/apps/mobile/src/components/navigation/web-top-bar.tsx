import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, useSegments } from 'expo-router';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaBadge, ExiaText, useTheme } from '@exia/shared-ui';

export function WebTopBar() {
  const t = useTheme();
  const pathname = usePathname();
  const segments = useSegments() as string[];

  const currentTab = (segments && segments[1]) ? segments[1] : 'index';

  let currentTitle = 'Dashboard';

  if (currentTab === 'history' || pathname.includes('/history')) {
    currentTitle = 'History';
  } else if (currentTab === 'analytics' || pathname.includes('/analytics')) {
    currentTitle = 'Analytics';
  } else if (currentTab === 'mcp' || pathname.includes('/mcp')) {
    currentTitle = 'MCP Servers';
  } else if (currentTab === 'prompts' || pathname.includes('/prompts')) {
    currentTitle = 'Prompts & Skills';
  } else if (currentTab === 'settings' || pathname.includes('/settings')) {
    currentTitle = 'Settings';
  } else if (pathname.includes('/voice')) {
    currentTitle = 'Voice Studio';
  } else if (pathname.includes('/session')) {
    currentTitle = 'Session Details';
  }

  const openDownloadPage = () => {
    void Linking.openURL('https://github.com/arpanchakraborty23/Exia/releases');
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
        {/* Left: Breadcrumbs */}
        <View style={styles.breadcrumbRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dashboard"
            onPress={() => router.replace('/(tabs)')}
            style={[styles.crumbRoot, pointerStyle]}
          >
            <View style={styles.cloudIconBox}>
              <Ionicons name="globe-outline" size={13} color={brand.electricCyan} />
            </View>
            <ExiaText style={styles.rootText}>EXIA Web</ExiaText>
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
            <ExiaBadge label="CLOUD" tone="accent" />
          </View>
        </View>

        {/* Right: Quick actions & Status */}
        <View style={styles.actionsRow}>
          {/* Cloud Gateway Status Indicator */}
          <View
            accessibilityLabel="Cloud Gateway Online"
            style={[
              styles.statusPill,
              {
                borderColor: 'rgba(16, 185, 129, 0.25)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
              },
            ]}
          >
            <View style={styles.statusDot} />
            <ExiaText style={styles.statusText}>Cloud Gateway: Online</ExiaText>
          </View>

          {/* Quick Voice Launcher */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Launch Voice Session"
            onPress={() => router.push('/voice' as any)}
            style={[
              styles.actionPill,
              pointerStyle,
              {
                borderColor: brand.electricCyan,
                backgroundColor: 'rgba(31, 213, 249, 0.1)',
              },
            ]}
          >
            <Ionicons name="mic-outline" size={13} color={brand.electricCyan} />
            <ExiaText style={[styles.actionPillText, { color: brand.electricCyan }]}>
              Live Voice
            </ExiaText>
          </Pressable>

          {/* Download Desktop Client */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download Desktop Client"
            onPress={openDownloadPage}
            style={[
              styles.actionPill,
              pointerStyle,
              {
                borderColor: t.border,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
              },
            ]}
          >
            <Ionicons name="desktop-outline" size={13} color={t.mutedForeground} />
            <ExiaText style={[styles.actionPillText, { color: t.foreground }]}>
              Desktop App
            </ExiaText>
            <Ionicons name="open-outline" size={11} color={t.mutedForeground} />
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
    zIndex: 10,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  cloudIconBox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(31, 213, 249, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootText: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.electricCyan,
    letterSpacing: 0.3,
  },
  crumbSeparator: {
    marginHorizontal: 2,
    opacity: 0.7,
  },
  activeCrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: brand.liveEmerald,
  },
  statusText: {
    fontSize: 11,
    color: brand.liveEmerald,
    fontWeight: '500',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
