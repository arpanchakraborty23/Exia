import React, { useState } from 'react';
import {
  Linking,
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

import { tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY } from '@/lib/auth';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  id: string;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
  route: string;
}

const WEB_NAV_ITEMS: NavItem[] = [
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

const COLLAPSED_STORAGE_KEY = 'exia_web_sidebar_collapsed';

export interface WebSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function WebSidebar({
  collapsed: controlledCollapsed,
  onToggleCollapse,
}: WebSidebarProps) {
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

  const currentTab = (segments && segments[1]) ? segments[1] : 'index';

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

  const openDownloadPage = () => {
    void Linking.openURL('https://github.com/arpanchakraborty23/Exia/releases');
  };

  const sidebarWidth = isCollapsed ? 68 : 240;
  const pointerStyle = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : undefined;

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
      {/* Web Header & Brand */}
      <View style={[styles.header, isCollapsed && styles.headerCollapsed]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Exia Web Studio'}
          {...({ title: isCollapsed ? 'Expand sidebar' : 'EXIA Web Studio' } as any)}
          onPress={() => (isCollapsed ? handleToggle() : handleNavigate('/(tabs)'))}
          style={[styles.brandRow, isCollapsed && styles.brandRowCollapsed, pointerStyle]}
        >
          <View style={styles.logoBadge}>
            <Ionicons name="globe-outline" size={17} color={brand.electricCyan} />
          </View>
          {!isCollapsed && (
            <View style={styles.brandTextContainer}>
              <View style={styles.titleRow}>
                <ExiaText style={styles.brandTitle}>EXIA</ExiaText>
                <ExiaBadge label="WEB" tone="accent" />
              </View>
              <ExiaText variant="caption" style={styles.brandSubtitle}>
                Cloud Studio · Online
              </ExiaText>
            </View>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          {...({ title: isCollapsed ? 'Expand sidebar' : 'Collapse sidebar' } as any)}
          onPress={handleToggle}
          style={({ hovered }: any) => [
            styles.collapseBtn,
            pointerStyle,
            {
              borderColor: hovered ? brand.electricCyan : t.border,
              backgroundColor: hovered ? 'rgba(31, 213, 249, 0.08)' : 'transparent',
            },
          ]}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward-outline' : 'chevron-back-outline'}
            size={16}
            color={t.mutedForeground}
          />
        </Pressable>
      </View>

      {/* Web Voice Studio CTA */}
      <View style={[styles.ctaWrapper, isCollapsed && styles.ctaWrapperCollapsed]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Launch Web Voice Session"
          {...({ title: 'Launch Voice Studio (Cloud)' } as any)}
          onPress={() => router.push('/voice' as any)}
          style={({ hovered }: any) => [
            styles.ctaButton,
            isCollapsed && styles.ctaButtonCollapsed,
            pointerStyle,
            {
              backgroundColor: hovered
                ? 'rgba(31, 213, 249, 0.18)'
                : 'rgba(31, 213, 249, 0.12)',
              borderColor: brand.electricCyan,
            },
          ]}
        >
          <Ionicons name="mic-outline" size={18} color={brand.electricCyan} />
          {!isCollapsed && (
            <View style={styles.ctaTextContainer}>
              <ExiaText style={styles.ctaTitle}>Voice Studio</ExiaText>
              <ExiaBadge label="CLOUD" tone="accent" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Navigation List */}
      <View style={styles.navSection}>
        {WEB_NAV_ITEMS.map((item) => {
          const active = isRouteActive(item);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              {...({ title: isCollapsed ? item.label : undefined } as any)}
              onPress={() => handleNavigate(item.route)}
              style={({ hovered }: any) => [
                styles.navItem,
                isCollapsed && styles.navItemCollapsed,
                pointerStyle,
                active && {
                  backgroundColor: 'rgba(31, 213, 249, 0.12)',
                  borderLeftColor: brand.electricCyan,
                },
                !active && {
                  borderLeftColor: 'transparent',
                  backgroundColor: hovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                },
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

      {/* Web-Specific Download App Section */}
      <View style={[styles.webExtraSection, isCollapsed && styles.webExtraSectionCollapsed]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Download Desktop App"
          {...({ title: 'Download Desktop App (.exe)' } as any)}
          onPress={openDownloadPage}
          style={({ hovered }: any) => [
            styles.downloadBtn,
            isCollapsed && styles.downloadBtnCollapsed,
            pointerStyle,
            {
              borderColor: hovered ? brand.electricCyan : t.border,
              backgroundColor: hovered
                ? 'rgba(31, 213, 249, 0.08)'
                : 'rgba(255, 255, 255, 0.03)',
            },
          ]}
        >
          <Ionicons name="desktop-outline" size={16} color={brand.electricCyan} />
          {!isCollapsed && (
            <View style={styles.downloadTextContainer}>
              <View style={styles.downloadTitleRow}>
                <ExiaText style={styles.downloadTitle}>Desktop App</ExiaText>
                <Ionicons name="open-outline" size={11} color={t.mutedForeground} />
              </View>
              <ExiaText variant="caption" style={styles.downloadSubtitle}>
                Get .exe client
              </ExiaText>
            </View>
          )}
        </Pressable>
      </View>

      {/* Web Footer Section */}
      <View
        style={[
          styles.footer,
          isCollapsed && styles.footerCollapsed,
          { borderTopColor: t.border },
        ]}
      >
        {/* Cloud Status indicator */}
        <View
          style={[styles.statusBox, isCollapsed && styles.statusBoxCollapsed]}
          {...({ title: 'Cloud Gateway: Online & TLS Secured' } as any)}
        >
          <View style={styles.statusDotWrapper}>
            <View style={styles.statusDot} />
          </View>
          {!isCollapsed && (
            <View style={styles.statusTextCol}>
              <ExiaText variant="caption" numberOfLines={1} style={styles.statusText}>
                Cloud Gateway: Online
              </ExiaText>
              <ExiaText variant="caption" style={styles.statusSubtext}>
                Global Edge · TLS 1.3
              </ExiaText>
            </View>
          )}
        </View>

        {/* Sign Out button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
          {...({ title: 'Sign Out' } as any)}
          onPress={handleSignOut}
          style={({ hovered }: any) => [
            styles.footerBtn,
            isCollapsed && styles.footerBtnCollapsed,
            pointerStyle,
            {
              borderColor: hovered ? t.destructive : t.border,
              backgroundColor: hovered ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
            },
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
    paddingHorizontal: spacing.xs,
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
  brandRowCollapsed: {
    justifyContent: 'center',
    flex: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(31, 213, 249, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: brand.electricCyan,
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
    paddingHorizontal: spacing.xs,
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
  webExtraSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  webExtraSectionCollapsed: {
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  downloadBtnCollapsed: {
    width: 38,
    height: 38,
    paddingVertical: 0,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadTextContainer: {
    flex: 1,
  },
  downloadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  downloadTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  downloadSubtitle: {
    fontSize: 10,
    color: brand.electricCyan,
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
    gap: spacing.sm,
    paddingVertical: 4,
  },
  statusBoxCollapsed: {
    justifyContent: 'center',
  },
  statusDotWrapper: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.liveEmerald,
  },
  statusTextCol: {
    flex: 1,
  },
  statusText: {
    fontSize: 11,
    color: brand.liveEmerald,
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 9,
    opacity: 0.6,
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
});
