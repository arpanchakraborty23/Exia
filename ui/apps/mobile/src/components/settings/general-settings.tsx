import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  ACCENT_PALETTES,
  radius,
  spacing,
  type AccentColor,
  type ButtonRadius,
  type ButtonVariantStyle,
  type FontStyle,
  type ThemeMode,
} from '@exia/design-tokens';
import {
  ExiaButton,
  ExiaCard,
  ExiaText,
  useTheme,
  useThemeControl,
} from '@exia/shared-ui';

import { api, tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY, useAuthToken } from '@/lib/auth';
import { saveStoredPreferences } from '@/lib/theme-storage';
import { Badge, ExiaAvatar, Field, Segmented } from '@/components/ui';

const TIMEZONE_OPTIONS = [
  { value: 'auto', label: 'Auto-Detect (System)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America / New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America / Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe / London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe / Paris (CET/CEST)' },
  { value: 'Asia/Kolkata', label: 'Asia / Kolkata (IST)' },
  { value: 'Asia/Tokyo', label: 'Asia / Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia / Sydney (AEST/AEDT)' },
] as const;

export function GeneralSettings() {
  const t = useTheme();
  const themeCtrl = useThemeControl();
  const queryClient = useQueryClient();
  const { data: token } = useAuthToken();

  const [timezone, setTimezone] = useState<string>('auto');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'>('YYYY-MM-DD');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleSignOut = async () => {
    try {
      await tokenStorage.setToken(null);
      await queryClient.clear();
      queryClient.setQueryData(AUTH_TOKEN_KEY, null);
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  const handleModeChange = (mode: ThemeMode) => {
    themeCtrl.setMode(mode);
    void saveStoredPreferences({ mode });
  };

  const handleAccentChange = (accent: AccentColor) => {
    themeCtrl.setAccent(accent);
    void saveStoredPreferences({ accent });
  };

  const handleButtonRadiusChange = (radiusVal: ButtonRadius) => {
    themeCtrl.setButtonRadius(radiusVal);
    void saveStoredPreferences({ buttonRadius: radiusVal });
  };

  const handleButtonStyleChange = (styleVal: ButtonVariantStyle) => {
    themeCtrl.setButtonStyle(styleVal);
    void saveStoredPreferences({ buttonStyle: styleVal });
  };

  const handleFontStyleChange = (fontVal: FontStyle) => {
    themeCtrl.setFontStyle(fontVal);
    void saveStoredPreferences({ fontStyle: fontVal });
  };

  const handleExportData = async () => {
    setExporting(true);
    setExportSuccess(false);
    try {
      const [sessions, prompts, mcp, models] = await Promise.all([
        api.sessions.getSessions(1, 100).catch(() => ({ sessions: [], total: 0 })),
        api.prompts.list().catch(() => []),
        api.mcp.list().catch(() => []),
        api.models.getConfig().catch(() => null),
      ]);

      const exportBundle = {
        exported_at: new Date().toISOString(),
        version: '1.0.0',
        environment: 'Exia Multi-Platform Hub',
        user_preferences: {
          mode: themeCtrl.mode,
          accent: themeCtrl.accent,
          buttonRadius: themeCtrl.buttonRadius,
          buttonStyle: themeCtrl.buttonStyle,
          fontStyle: themeCtrl.fontStyle,
          timezone,
          timeFormat,
          dateFormat,
        },
        model_configuration: models,
        prompts,
        mcp_servers: mcp,
        sessions_history: sessions,
      };

      const jsonStr = JSON.stringify(exportBundle, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exia-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          title: 'Exia User Data Export',
          message: jsonStr,
        });
      }
      setExportSuccess(true);
    } catch (err) {
      if (Platform.OS !== 'web') {
        Alert.alert('Export Failed', err instanceof Error ? err.message : 'Unknown error during export');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleResetDefaults = () => {
    themeCtrl.resetTheme();
    setTimezone('auto');
    setTimeFormat('12h');
    setDateFormat('YYYY-MM-DD');
    void saveStoredPreferences({
      mode: 'dark',
      accent: 'cyan',
      buttonRadius: 'rounded',
      buttonStyle: 'solid',
      fontStyle: 'system',
      timezone: 'auto',
      timeFormat: '12h',
      dateFormat: 'YYYY-MM-DD',
    });
  };

  const accentKeys: AccentColor[] = ['cyan', 'emerald', 'violet', 'amber', 'crimson', 'blue', 'pink'];

  return (
    <View style={styles.container}>
      {/* 1. User Profile & Security */}
      <ExiaCard style={styles.card}>
        <View style={styles.profileRow}>
          <ExiaAvatar size={50} />
          <View style={styles.profileInfo}>
            <View style={styles.profileTitleRow}>
              <ExiaText variant="title" style={styles.userName}>
                Operator
              </ExiaText>
              <Badge label="OPERATOR" tone="info" />
            </View>
            <ExiaText variant="caption">
              {token ? 'Active JWT Session' : 'Offline / Signed Out'}
            </ExiaText>
          </View>
        </View>

        <View style={[styles.separator, { backgroundColor: t.border }]} />

        <View style={styles.authActionsRow}>
          <ExiaButton
            label="Sign Out"
            variant="destructive"
            onPress={handleSignOut}
            style={styles.signOutButton}
          />
        </View>
      </ExiaCard>

      {/* 2. Theme & Appearance Customizer */}
      <ExiaCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette-outline" size={20} color={t.primary} />
          <ExiaText variant="title" style={styles.sectionTitle}>
            Theme & Appearance
          </ExiaText>
        </View>

        {/* Theme Mode */}
        <Field label="Theme Mode">
          <Segmented
            options={['dark', 'oled', 'light', 'system'] as const}
            value={themeCtrl.mode}
            onChange={handleModeChange}
            accessibilityLabel="Theme Mode"
          />
        </Field>

        {/* Accent Colors */}
        <Field label="Accent Palette">
          <View style={styles.swatchGrid}>
            {accentKeys.map((accKey) => {
              const pal = ACCENT_PALETTES[accKey];
              const isSelected = themeCtrl.accent === accKey;
              return (
                <Pressable
                  key={accKey}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${pal.name}`}
                  onPress={() => handleAccentChange(accKey)}
                  style={[
                    styles.swatchButton,
                    {
                      borderColor: isSelected ? t.foreground : 'transparent',
                      transform: [{ scale: isSelected ? 1.08 : 1 }],
                    },
                  ]}
                >
                  <View style={[styles.swatchCircle, { backgroundColor: pal.hex }]}>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={pal.primaryForeground}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <ExiaText variant="caption" style={styles.accentLabel}>
            Selected: {ACCENT_PALETTES[themeCtrl.accent]?.name} ({ACCENT_PALETTES[themeCtrl.accent]?.hex})
          </ExiaText>
        </Field>

        {/* Button Controls */}
        <Field label="Button Corner Radius">
          <Segmented
            options={['rounded', 'pill', 'sharp'] as const}
            value={themeCtrl.buttonRadius}
            onChange={handleButtonRadiusChange}
            accessibilityLabel="Button Corner Radius"
          />
        </Field>

        <Field label="Button Style Variant">
          <Segmented
            options={['solid', 'glass', 'outline'] as const}
            value={themeCtrl.buttonStyle}
            onChange={handleButtonStyleChange}
            accessibilityLabel="Button Style Variant"
          />
        </Field>

        {/* Live Interactive Preview Box */}
        <View style={[styles.previewBox, { backgroundColor: t.input, borderColor: t.border }]}>
          <ExiaText variant="caption" style={styles.previewTitle}>
            Live Interactive Button Preview
          </ExiaText>
          <View style={styles.previewRow}>
            <ExiaButton
              label="Primary"
              variant="primary"
              style={styles.previewBtn}
              onPress={() => {}}
            />
            <ExiaButton
              label="Secondary"
              variant="secondary"
              style={styles.previewBtn}
              onPress={() => {}}
            />
            <ExiaButton
              label="Destructive"
              variant="destructive"
              style={styles.previewBtn}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Typography / Font Style */}
        <Field label="Typography Font Preset">
          <Segmented
            options={['system', 'modern', 'mono', 'rounded'] as const}
            value={themeCtrl.fontStyle}
            onChange={handleFontStyleChange}
            accessibilityLabel="Font Style"
          />
        </Field>
      </ExiaCard>

      {/* 3. Timezone & Localization */}
      <ExiaCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={20} color={t.primary} />
          <ExiaText variant="title" style={styles.sectionTitle}>
            Timezone & Localization
          </ExiaText>
        </View>

        <Field label="Regional Timezone">
          <View style={styles.timezoneList}>
            {TIMEZONE_OPTIONS.map((tz) => {
              const active = timezone === tz.value;
              return (
                <Pressable
                  key={tz.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setTimezone(tz.value);
                    void saveStoredPreferences({ timezone: tz.value });
                  }}
                  style={[
                    styles.tzItem,
                    {
                      backgroundColor: active ? t.input : 'transparent',
                      borderColor: active ? t.primary : t.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={active ? t.primary : t.mutedForeground}
                  />
                  <ExiaText
                    variant={active ? 'body' : 'caption'}
                    style={{ color: active ? t.foreground : t.mutedForeground }}
                  >
                    {tz.label}
                  </ExiaText>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="Clock Display Format">
          <Segmented
            options={['12h', '24h'] as const}
            value={timeFormat}
            onChange={(val) => {
              setTimeFormat(val);
              void saveStoredPreferences({ timeFormat: val });
            }}
            accessibilityLabel="Clock Display Format"
          />
        </Field>

        <Field label="Date Format">
          <Segmented
            options={['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'] as const}
            value={dateFormat}
            onChange={(val) => {
              setDateFormat(val);
              void saveStoredPreferences({ dateFormat: val });
            }}
            accessibilityLabel="Date Format"
          />
        </Field>
      </ExiaCard>

      {/* 4. Data Download, Cache & Maintenance */}
      <ExiaCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-download-outline" size={20} color={t.primary} />
          <ExiaText variant="title" style={styles.sectionTitle}>
            Data Management & Maintenance
          </ExiaText>
        </View>

        <ExiaText variant="caption">
          Export your complete personal AI data, including conversational session history,
          custom prompt directive matrix, configured MCP tools, and model preferences into a JSON file.
        </ExiaText>

        <View style={styles.dataActions}>
          <ExiaButton
            label={exporting ? 'Compiling JSON bundle…' : 'Export All Data (JSON)'}
            variant="primary"
            disabled={exporting}
            onPress={handleExportData}
          />
          {exportSuccess ? (
            <Badge label="Data bundle exported successfully" tone="ok" />
          ) : null}

          <View style={[styles.separator, { backgroundColor: t.border }]} />

          <ExiaButton
            label="Reset Theme to Factory Defaults"
            variant="secondary"
            onPress={handleResetDefaults}
          />
        </View>
      </ExiaCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  authActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signOutButton: {
    minWidth: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  swatchButton: {
    padding: 3,
    borderRadius: radius.full,
    borderWidth: 2,
  },
  swatchCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentLabel: {
    marginTop: spacing.xs,
  },
  previewBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  previewTitle: {
    fontWeight: '500',
  },
  previewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewBtn: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  timezoneList: {
    gap: spacing.xs,
  },
  tzItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dataActions: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
});
