import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, useSegments } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaBadge, ExiaText, useTheme } from '@exia/shared-ui';

import { setApiBaseUrl, tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY } from '@/lib/auth';
import {
  DEFAULT_CLOUD_API_URL,
  DEFAULT_LOCAL_API_URL,
  DesktopSetupConfig,
  getStoredSetupConfigSync,
  saveStoredSetupConfig,
} from '@/lib/desktop-config';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  id: string;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
  route: string;
  shortcut: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'index',
    label: 'Dashboard',
    icon: 'home-outline',
    activeIcon: 'home',
    route: '/(tabs)',
    shortcut: '⌘1',
  },
  {
    id: 'history',
    label: 'History',
    icon: 'time-outline',
    activeIcon: 'time',
    route: '/history',
    shortcut: '⌘2',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'stats-chart-outline',
    activeIcon: 'stats-chart',
    route: '/analytics',
    shortcut: '⌘3',
  },
  {
    id: 'mcp',
    label: 'MCP Servers',
    icon: 'hardware-chip-outline',
    activeIcon: 'hardware-chip',
    route: '/mcp',
    shortcut: '⌘4',
  },
  {
    id: 'prompts',
    label: 'Prompts & Skills',
    icon: 'sparkles-outline',
    activeIcon: 'sparkles',
    route: '/prompts',
    shortcut: '⌘5',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
    route: '/settings',
    shortcut: '⌘,',
  },
];

const COLLAPSED_STORAGE_KEY = 'exia_desktop_sidebar_collapsed';

export interface DesktopSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface AudioInputDevice {
  deviceId: string;
  label: string;
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

  const handleToggle = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
          } catch {
            // Ignore
          }
        }
        return next;
      });
    }
  }, [onToggleCollapse]);

  const [setupConfig, setSetupConfig] = useState<DesktopSetupConfig>(() =>
    getStoredSetupConfigSync(),
  );

  // Audio input devices enumeration & state
  const [audioDevices, setAudioDevices] = useState<AudioInputDevice[]>([]);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  const loadAudioDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const inputs = all
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));
      setAudioDevices(inputs);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
        return;
      }
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        if (!active) return;
        const inputs = all
          .filter((d) => d.kind === 'audioinput')
          .map((d, index) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${index + 1}`,
          }));
        setAudioDevices(inputs);
      } catch {
        // Ignore
      }
    })();

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', loadAudioDevices);
      return () => {
        active = false;
        navigator.mediaDevices.removeEventListener('devicechange', loadAudioDevices);
      };
    }
    return () => {
      active = false;
    };
  }, [loadAudioDevices]);

  const handleSelectAudioDevice = async (device: AudioInputDevice) => {
    const updated = await saveStoredSetupConfig({
      audioInputDeviceId: device.deviceId,
      audioInputDeviceLabel: device.label,
    });
    setSetupConfig(updated);
    setAudioModalOpen(false);
  };

  // Local Daemon vs Cloud Gateway Switcher
  const handleToggleEnvironment = async (targetEnv: 'cloud' | 'local') => {
    const isLocal = targetEnv === 'local';
    const targetUrl = isLocal ? DEFAULT_LOCAL_API_URL : DEFAULT_CLOUD_API_URL;
    setApiBaseUrl(targetUrl);
    const updated = await saveStoredSetupConfig({
      environmentType: targetEnv,
      apiUrl: targetUrl,
      localMode: isLocal,
    });
    setSetupConfig(updated);
    void queryClient.invalidateQueries({ queryKey: ['health'] });
  };

  // Keyboard shortcut routing
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

  // Desktop native keyboard shortcuts and custom IPC event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;

      if (e.key === '1') {
        e.preventDefault();
        handleNavigate('/(tabs)');
      } else if (e.key === '2') {
        e.preventDefault();
        handleNavigate('/history');
      } else if (e.key === '3') {
        e.preventDefault();
        handleNavigate('/analytics');
      } else if (e.key === '4') {
        e.preventDefault();
        handleNavigate('/mcp');
      } else if (e.key === '5') {
        e.preventDefault();
        handleNavigate('/prompts');
      } else if (e.key === ',') {
        e.preventDefault();
        handleNavigate('/settings');
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleToggle();
      } else if (e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        router.push('/voice' as any);
      } else if (e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        router.push('/setup' as any);
      }
    };

    const handleCustomNav = (e: Event) => {
      const custom = e as CustomEvent<{ route: string }>;
      if (custom?.detail?.route) {
        handleNavigate(custom.detail.route);
      }
    };

    const handleCustomToggleSidebar = () => {
      handleToggle();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('exia:desktop-nav', handleCustomNav);
    window.addEventListener('exia:toggle-sidebar', handleCustomToggleSidebar);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('exia:desktop-nav', handleCustomNav);
      window.removeEventListener('exia:toggle-sidebar', handleCustomToggleSidebar);
    };
  }, [internalCollapsed, handleToggle]);

  const sidebarWidth = isCollapsed ? 68 : 240;
  const isLocalActive = setupConfig.environmentType === 'local';

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
          accessibilityLabel={isCollapsed ? 'Expand sidebar' : 'Exia Desktop Studio'}
          onPress={() => (isCollapsed ? handleToggle() : handleNavigate('/(tabs)'))}
          style={styles.brandRow}
        >
          <View style={styles.logoBadge}>
            <Ionicons name="desktop-outline" size={17} color={brand.electricCyan} />
            <View style={styles.logoDotGlow} />
          </View>
          {!isCollapsed && (
            <View style={styles.brandTextContainer}>
              <View style={styles.titleRow}>
                <ExiaText style={styles.brandTitle}>EXIA Desktop</ExiaText>
                <ExiaBadge label="DESKTOP" tone="accent" />
              </View>
              <ExiaText variant="caption" style={styles.brandSubtitle}>
                Desktop Studio · Native
              </ExiaText>
            </View>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
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

      {/* Voice Studio CTA with PRO Badge */}
      <View style={[styles.ctaWrapper, isCollapsed && styles.ctaWrapperCollapsed]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Launch Voice Studio (Ctrl+Shift+V)"
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
              <ExiaBadge label="PRO" tone="accent" />
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
              accessibilityLabel={`${item.label} (${item.shortcut})`}
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
                size={19}
                color={active ? brand.electricCyan : t.mutedForeground}
              />
              {!isCollapsed && (
                <View style={styles.navLabelRow}>
                  <ExiaText
                    style={[
                      styles.navLabel,
                      { color: active ? brand.electricCyan : t.foreground },
                      active && styles.navLabelActive,
                    ]}
                  >
                    {item.label}
                  </ExiaText>
                  <ExiaText variant="caption" style={styles.shortcutPill}>
                    {item.shortcut}
                  </ExiaText>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Desktop Hardware & Gateway Controls Section */}
      <View
        style={[
          styles.footer,
          isCollapsed && styles.footerCollapsed,
          { borderTopColor: t.border },
        ]}
      >
        {/* Local Daemon vs Cloud Gateway Switcher */}
        {!isCollapsed ? (
          <View style={styles.gatewaySection}>
            <View style={styles.gatewayLabelRow}>
              <ExiaText variant="caption" style={styles.gatewaySectionTitle}>
                BACKEND GATEWAY
              </ExiaText>
              <View style={[styles.statusDot, { backgroundColor: brand.liveEmerald }]} />
            </View>
            <View style={[styles.segmentedToggle, { backgroundColor: t.input, borderColor: t.border }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Switch to Cloud Gateway"
                onPress={() => handleToggleEnvironment('cloud')}
                style={[
                  styles.segmentOption,
                  !isLocalActive && {
                    backgroundColor: 'rgba(31, 213, 249, 0.15)',
                    borderColor: brand.electricCyan,
                  },
                ]}
              >
                <Ionicons
                  name="cloud-outline"
                  size={12}
                  color={!isLocalActive ? brand.electricCyan : t.mutedForeground}
                />
                <ExiaText
                  variant="caption"
                  style={[
                    styles.segmentText,
                    { color: !isLocalActive ? brand.electricCyan : t.mutedForeground },
                    !isLocalActive && styles.segmentTextActive,
                  ]}
                >
                  Cloud
                </ExiaText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Switch to Local Daemon 127.0.0.1:8000"
                onPress={() => handleToggleEnvironment('local')}
                style={[
                  styles.segmentOption,
                  isLocalActive && {
                    backgroundColor: 'rgba(31, 213, 249, 0.15)',
                    borderColor: brand.electricCyan,
                  },
                ]}
              >
                <Ionicons
                  name="terminal-outline"
                  size={12}
                  color={isLocalActive ? brand.electricCyan : t.mutedForeground}
                />
                <ExiaText
                  variant="caption"
                  style={[
                    styles.segmentText,
                    { color: isLocalActive ? brand.electricCyan : t.mutedForeground },
                    isLocalActive && styles.segmentTextActive,
                  ]}
                >
                  Local: 8000
                </ExiaText>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Gateway: ${isLocalActive ? 'Local Daemon (8000)' : 'Cloud'}. Click to switch.`}
            onPress={() => handleToggleEnvironment(isLocalActive ? 'cloud' : 'local')}
            style={[
              styles.collapsedGatewayBtn,
              { backgroundColor: t.input, borderColor: isLocalActive ? brand.electricCyan : t.border },
            ]}
          >
            <Ionicons
              name={isLocalActive ? 'terminal' : 'cloud'}
              size={14}
              color={isLocalActive ? brand.electricCyan : brand.liveEmerald}
            />
          </Pressable>
        )}

        {/* Hardware Audio Device Status & Quick Selector */}
        {!isCollapsed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select Hardware Microphone"
            onPress={() => {
              void loadAudioDevices();
              setAudioModalOpen(true);
            }}
            style={[styles.audioCard, { backgroundColor: t.input, borderColor: t.border }]}
          >
            <View style={styles.audioCardHeader}>
              <View style={styles.audioCardTitleGroup}>
                <Ionicons name="mic-outline" size={13} color={brand.electricCyan} />
                <ExiaText variant="caption" style={styles.audioCardTitle}>
                  Hardware Audio
                </ExiaText>
              </View>
              <View style={[styles.statusDot, { backgroundColor: brand.liveEmerald }]} />
            </View>
            <View style={styles.audioDeviceRow}>
              <ExiaText variant="caption" numberOfLines={1} style={styles.audioDeviceName}>
                {setupConfig.audioInputDeviceLabel || 'System Default Mic'}
              </ExiaText>
              <Ionicons name="chevron-down" size={12} color={t.mutedForeground} />
            </View>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Audio Input Device Selector"
            onPress={() => {
              void loadAudioDevices();
              setAudioModalOpen(true);
            }}
            style={[styles.collapsedAudioBtn, { backgroundColor: t.input, borderColor: t.border }]}
          >
            <Ionicons name="mic-outline" size={15} color={brand.electricCyan} />
            <View style={styles.collapsedAudioDot} />
          </Pressable>
        )}

        {/* Setup Wizard Launcher */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Launch Desktop Setup Wizard (Ctrl+Shift+S)"
          onPress={() => router.push('/setup' as any)}
          style={[
            styles.footerBtn,
            isCollapsed && styles.footerBtnCollapsed,
            { borderColor: t.border, backgroundColor: t.input },
          ]}
        >
          <Ionicons name="construct-outline" size={15} color={brand.electricCyan} />
          {!isCollapsed && (
            <View style={styles.setupBtnRow}>
              <ExiaText variant="caption" style={styles.footerBtnLabel}>
                Setup Wizard
              </ExiaText>
              <ExiaText variant="caption" style={styles.shortcutPill}>
                ⌘⇧S
              </ExiaText>
            </View>
          )}
        </Pressable>

        {/* Sign Out Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign Out of Exia Desktop"
          onPress={handleSignOut}
          style={[
            styles.footerBtn,
            isCollapsed && styles.footerBtnCollapsed,
            { borderColor: t.border },
          ]}
        >
          <Ionicons name="log-out-outline" size={15} color={t.destructive} />
          {!isCollapsed && (
            <ExiaText variant="caption" style={{ color: t.destructive, fontWeight: '500' }}>
              Sign Out
            </ExiaText>
          )}
        </Pressable>
      </View>

      {/* Hardware Audio Input Device Selector Modal */}
      <Modal
        visible={audioModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAudioModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAudioModalOpen(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: t.card, borderColor: t.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="mic" size={18} color={brand.electricCyan} />
                <ExiaText style={styles.modalTitle}>Select Hardware Audio Input</ExiaText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close audio device selector"
                onPress={() => setAudioModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={16} color={t.mutedForeground} />
              </Pressable>
            </View>

            <ExiaText variant="caption" style={styles.modalSubtitle}>
              Choose the primary microphone for Exia Voice Studio and real-time speech processing.
            </ExiaText>

            <ScrollView style={styles.deviceList} showsVerticalScrollIndicator={false}>
              {audioDevices.length === 0 ? (
                <View style={styles.noDevicesBox}>
                  <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                    No hardware audio inputs enumerated. Check microphone permissions.
                  </ExiaText>
                </View>
              ) : (
                audioDevices.map((dev) => {
                  const isSelected =
                    setupConfig.audioInputDeviceId === dev.deviceId ||
                    (!setupConfig.audioInputDeviceId && dev.deviceId === 'default');

                  return (
                    <Pressable
                      key={dev.deviceId || dev.label}
                      accessibilityRole="button"
                      accessibilityLabel={dev.label}
                      onPress={() => handleSelectAudioDevice(dev)}
                      style={[
                        styles.deviceItem,
                        { borderColor: t.border, backgroundColor: t.input },
                        isSelected && {
                          borderColor: brand.electricCyan,
                          backgroundColor: 'rgba(31, 213, 249, 0.12)',
                        },
                      ]}
                    >
                      <View style={styles.deviceItemLeft}>
                        <Ionicons
                          name={isSelected ? 'mic' : 'mic-outline'}
                          size={16}
                          color={isSelected ? brand.electricCyan : t.mutedForeground}
                        />
                        <ExiaText
                          variant="caption"
                          numberOfLines={1}
                          style={[
                            styles.deviceItemLabel,
                            isSelected && { color: brand.electricCyan, fontWeight: '600' },
                          ]}
                        >
                          {dev.label}
                        </ExiaText>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={brand.electricCyan} />
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh Audio Devices"
                onPress={loadAudioDevices}
                style={[styles.modalFooterBtn, { borderColor: t.border }]}
              >
                <Ionicons name="refresh-outline" size={14} color={t.mutedForeground} />
                <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                  Refresh List
                </ExiaText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingVertical: spacing.md,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    position: 'relative',
  },
  logoDotGlow: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brand.liveEmerald,
  },
  brandTextContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
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
    marginBottom: spacing.sm,
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
    paddingVertical: 9,
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
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    marginVertical: 1,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 11,
  },
  navLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  navLabelActive: {
    fontWeight: '700',
  },
  shortcutPill: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontFamily: 'monospace',
    fontWeight: '500',
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
  gatewaySection: {
    gap: 4,
  },
  gatewayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gatewaySectionTitle: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  segmentedToggle: {
    flexDirection: 'row',
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    borderRadius: radius.sm - 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '500',
  },
  segmentTextActive: {
    fontWeight: '700',
  },
  collapsedGatewayBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioCard: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    gap: 3,
  },
  audioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioCardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  audioCardTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  audioDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  audioDeviceName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
  },
  collapsedAudioBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  collapsedAudioDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: brand.liveEmerald,
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
  setupBtnRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerBtnLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  deviceList: {
    maxHeight: 220,
  },
  noDevicesBox: {
    padding: spacing.md,
    alignItems: 'center',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  deviceItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  deviceItemLabel: {
    flex: 1,
    fontSize: 12,
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: spacing.sm,
  },
  modalFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
});
