import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaCard, ExiaText, useTheme } from '@exia/shared-ui';

import { ExiaAvatar, Badge } from '@/components/ui';
import { getEnvironmentDiagnostics } from '@/lib/desktop-config';

export function StepWelcome() {
  const t = useTheme();
  const diagnostics = React.useMemo(() => getEnvironmentDiagnostics(), []);

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <ExiaAvatar />
        <View style={styles.titleWrap}>
          <ExiaText variant="title" style={styles.title}>
            Welcome to Exia Desktop
          </ExiaText>
          <ExiaText variant="caption" style={styles.subtitle}>
            Multimodal AI Assistant & Real-time Voice Platform
          </ExiaText>
        </View>
        <Badge
          label={diagnostics.isElectron ? 'Desktop Host (Electron)' : 'Universal Web Client'}
          tone={diagnostics.isElectron ? 'accent' : 'neutral'}
        />
      </View>

      <ExiaCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="hardware-chip-outline" size={18} color={brand.electricCyan} />
          <ExiaText style={styles.sectionTitle}>Host Environment Diagnostics</ExiaText>
        </View>

        <View style={styles.diagGrid}>
          <View style={[styles.diagItem, { borderColor: t.border }]}>
            <ExiaText variant="caption">Runtime Platform</ExiaText>
            <View style={styles.rowAlign}>
              <Ionicons
                name={diagnostics.isElectron ? 'logo-windows' : 'globe-outline'}
                size={14}
                color={brand.electricCyan}
              />
              <ExiaText style={styles.diagValue}>
                {diagnostics.isElectron ? `Electron · ${diagnostics.platform}` : 'Universal Web Browser'}
              </ExiaText>
            </View>
          </View>

          <View style={[styles.diagItem, { borderColor: t.border }]}>
            <ExiaText variant="caption">Architecture</ExiaText>
            <View style={styles.rowAlign}>
              <Ionicons name="hardware-chip-outline" size={14} color={brand.electricCyan} />
              <ExiaText style={styles.diagValue}>{diagnostics.arch.toUpperCase()}</ExiaText>
            </View>
          </View>

          <View style={[styles.diagItem, { borderColor: t.border }]}>
            <ExiaText variant="caption">LiveKit WebRTC Engine</ExiaText>
            <View style={styles.rowAlign}>
              <Ionicons
                name={diagnostics.hasWebRTC ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={diagnostics.hasWebRTC ? brand.liveEmerald : t.destructive}
              />
              <ExiaText style={styles.diagValue}>
                {diagnostics.hasWebRTC ? 'Ready (Hardware Accelerated)' : 'Unavailable'}
              </ExiaText>
            </View>
          </View>

          <View style={[styles.diagItem, { borderColor: t.border }]}>
            <ExiaText variant="caption">Microphone & Audio Capture</ExiaText>
            <View style={styles.rowAlign}>
              <Ionicons
                name={diagnostics.hasMediaDevices ? 'mic-outline' : 'warning-outline'}
                size={14}
                color={diagnostics.hasMediaDevices ? brand.liveEmerald : '#f59e0b'}
              />
              <ExiaText style={styles.diagValue}>
                {diagnostics.hasMediaDevices ? 'Media Devices Available' : 'No Input Found'}
              </ExiaText>
            </View>
          </View>
        </View>
      </ExiaCard>

      <ExiaCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={18} color={brand.electricCyan} />
          <ExiaText style={styles.sectionTitle}>What We'll Configure</ExiaText>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(31, 213, 249, 0.12)' }]}>
              <Ionicons name="server-outline" size={16} color={brand.electricCyan} />
            </View>
            <View style={styles.featureText}>
              <ExiaText style={styles.featureTitle}>1. Backend API Gateway</ExiaText>
              <ExiaText variant="caption">Connect to Cloud Vercel deployment or Local FastAPI backend</ExiaText>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(31, 213, 249, 0.12)' }]}>
              <Ionicons name="radio-outline" size={16} color={brand.electricCyan} />
            </View>
            <View style={styles.featureText}>
              <ExiaText style={styles.featureTitle}>2. LiveKit WebRTC Voice Server</ExiaText>
              <ExiaText variant="caption">Set up sub-300ms speech-to-speech voice credentials</ExiaText>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Ionicons name="mic-outline" size={16} color={brand.liveEmerald} />
            </View>
            <View style={styles.featureText}>
              <ExiaText style={styles.featureTitle}>3. Audio & Microphone Hardware</ExiaText>
              <ExiaText variant="caption">Verify input devices, microphone permissions & audio decibel levels</ExiaText>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
              <Ionicons name="person-circle-outline" size={16} color="#a855f7" />
            </View>
            <View style={styles.featureText}>
              <ExiaText style={styles.featureTitle}>4. User Profile or Local Standalone Mode</ExiaText>
              <ExiaText variant="caption">Sign in with an existing account, create a new one, or run offline</ExiaText>
            </View>
          </View>
        </View>
      </ExiaCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  titleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  diagGrid: {
    gap: spacing.sm,
  },
  diagItem: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  diagValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  featureList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
