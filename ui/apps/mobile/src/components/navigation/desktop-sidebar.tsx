import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, useSegments } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaBadge, ExiaText, useTheme } from '@exia/shared-ui';

import { tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY } from '@/lib/auth';
import { getStoredSetupConfigSync } from '@/lib/desktop-config';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  id: string;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'index',
    label: 'Dashboard',
    icon: 'home-outline',
    activeIcon: 'home',
    route: '/(tabs)',
  },
  {
    id: 'history',
    label: 'History',
    icon: 'time-outline',
    activeIcon: 'time',
    route: '/history',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'stats-chart-outline',
    activeIcon: 'stats-chart',
    route: '/analytics',
  },
  {
    id: 'mcp',
    label: 'MCP Servers',
    icon: 'hardware-chip-outline',
    activeIcon: 'hardware-chip',
    route: '/mcp',
  },
  {
    id: 'prompts',
    label: 'Prompts & Skills',
    icon: 'sparkles-outline',
    activeIcon: 'sparkles',
    route: '/prompts',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
    route: '/settings',
  },
];

const COLLAPSED_STORAGE_KEY = 'exia_desktop_sidebar_collapsed';

export interface DesktopSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DesktopSidebar({
  collapsed: controlledCollapsed,
  onToggleCollapse,
}: DesktopSidebarProps) {
  const t = useTheme();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const segments = useSegments() as string[];

  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
        if (saved !== null) return saved === 'true';
      } catch {
        // Ignore localStorage error
      }
    }
    return false;
  });

  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
        } catch {
          // Ignore
        }
      }
    }
  };

  const setupConfig = getStoredSetupConfigSync();
  const currentTab = segments[1] || 'index';

  const isRouteActive = (item: NavItem) => {
    if (item.id === 'index') {
      return (
        currentTab === 'index' ||
        pathname === '/' ||
        pathname === '' ||
        pathname === '/(tabs)'
      );
    }
    return currentTab === item.id || pathname.includes(`/${item.id}`);
  };

  const handleNavigate = (route: string) => {
    if (route === '/(tabs)') {
      router.replace('/(tabs)');
    } else {
      router.push(route as any);
    }
  };

  const handleSignOut = async () => {
    await tokenStorage.setToken(null);
    queryClient.setQueryData(AUTH_TOKEN_KEY, null);
    router.replace('/login');
  };

  const sidebarWidth = isCollapsed ? 68 : 240;

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: sidebarWidth,
          backgroundColor: t.card,
          borderRightColor: t.border,
        },
      ]}
    >
      {/* Sidebar Header & Brand */}
      <View style={[styles.header, isCollapsed && styles.headerCollapsed]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Exia Studio'}
          onPress={() => (isCollapsed ? handleToggle() : handleNavigate('/(tabs)'))}
          style={styles.brandRow}
        >
          <View style={styles.logoBadge}>
            <View style={styles.logoDot} />
          </View>
          {!isCollapsed && (
            <View style={styles.brandTextContainer}>
              <ExiaText style={styles.brandTitle}>EXIA</ExiaText>
              <ExiaText variant="caption" style={styles.brandSubtitle}>
                AI Studio · Desktop
              </ExiaText>
            </View>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onPress={handleToggle}
          style={[styles.collapseBtn, { borderColor: t.border }]}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward-outline' : 'chevron-back-outline'}
            size={16}
            color={t.mutedForeground}
          />
        </Pressable>
      </View>

      {/* Voice Studio CTA */}
      <View style={[styles.ctaWrapper, isCollapsed && styles.ctaWrapperCollapsed]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Launch Voice Session"
          onPress={() => router.push('/voice' as any)}
          style={[
            styles.ctaButton,
            isCollapsed && styles.ctaButtonCollapsed,
            { backgroundColor: 'rgba(31, 213, 249, 0.12)', borderColor: brand.electricCyan },
          ]}
        >
          <Ionicons name="mic" size={18} color={brand.electricCyan} />
          {!isCollapsed && (
            <View style={styles.ctaTextContainer}>
              <ExiaText style={styles.ctaTitle}>Voice Studio</ExiaText>
              <ExiaBadge label="LIVE" tone="accent" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Navigation List */}
      <View style={styles.navSection}>
        {NAV_ITEMS.map((item) => {
          const active = isRouteActive(item);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => handleNavigate(item.route)}
              style={[
                styles.navItem,
                isCollapsed && styles.navItemCollapsed,
                active && {
                  backgroundColor: 'rgba(31, 213, 249, 0.12)',
                  borderLeftColor: brand.electricCyan,
                },
                !active && { borderLeftColor: 'transparent' },
              ]}
            >
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={20}
                color={active ? brand.electricCyan : t.mutedForeground}
              />
              {!isCollapsed && (
                <ExiaText
                  style={[
                    styles.navLabel,
                    { color: active ? brand.electricCyan : t.foreground },
                    active && styles.navLabelActive,
                  ]}
                >
                  {item.label}
                </ExiaText>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Footer Section */}
      <View
        style={[
          styles.footer,
          isCollapsed && styles.footerCollapsed,
          { borderTopColor: t.border },
        ]}
      >
        {/* Backend status indicator */}
        <View style={[styles.statusBox, isCollapsed && styles.statusBoxCollapsed]}>
          <View style={styles.statusDot} />
          {!isCollapsed && (
            <ExiaText variant="caption" numberOfLines={1} style={styles.statusText}>
              {setupConfig.environmentType === 'cloud'
                ? 'Cloud: Vercel'
                : setupConfig.environmentType === 'local'
                  ? 'Local: 8000'
                  : 'Custom Gateway'}
            </ExiaText>
          )}
        </View>

        {/* Setup Wizard shortcut */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Setup Wizard"
          onPress={() => router.push('/setup' as any)}
          style={[
            styles.footerBtn,
            isCollapsed && styles.footerBtnCollapsed,
            { borderColor: t.border },
          ]}
        >
          <Ionicons name="construct-outline" size={16} color={t.mutedForeground} />
          {!isCollapsed && (
            <ExiaText variant="caption" style={styles.footerBtnLabel}>
              Setup Wizard
            </ExiaText>
          )}
        </Pressable>

        {/* Sign Out button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
          onPress={handleSignOut}
          style={[
            styles.footerBtn,
            isCollapsed && styles.footerBtnCollapsed,
            { borderColor: t.border },
          ]}
        >
          <Ionicons name="log-out-outline" size={16} color={t.destructive} />
          {!isCollapsed && (
            <ExiaText variant="caption" style={{ color: t.destructive, fontWeight: '500' }}>
              Sign Out
            </ExiaText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    flexDirection: 'column',
    borderRightWidth: 1,
    zIndex: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  headerCollapsed: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(31, 213, 249, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.electricCyan,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: brand.electricCyan,
  },
  brandTextContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: 10,
    color: brand.electricCyan,
    fontWeight: '500',
  },
  collapseBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaWrapper: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  ctaWrapperCollapsed: {
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  ctaButtonCollapsed: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  ctaTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: brand.electricCyan,
  },
  navSection: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    marginVertical: 2,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  navLabelActive: {
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  footerCollapsed: {
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  statusBoxCollapsed: {
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.liveEmerald,
  },
  statusText: {
    fontSize: 11,
    color: brand.liveEmerald,
    fontWeight: '500',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  footerBtnCollapsed: {
    width: 38,
    height: 38,
    paddingVertical: 0,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  footerBtnLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
