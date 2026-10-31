import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaCard, ExiaText, useTheme } from '@exia/shared-ui';

import { Badge } from '@/components/ui';
import type { DesktopSetupConfig } from '@/lib/desktop-config';

export interface StepSummaryProps {
  config: DesktopSetupConfig;
}

export function StepSummary({ config }: StepSummaryProps) {
  const t = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <View style={[styles.successCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <Ionicons name="checkmark-done" size={38} color={brand.liveEmerald} />
        </View>
        <ExiaText variant="title" style={styles.title}>
          Setup Complete!
        </ExiaText>
        <ExiaText variant="caption" style={styles.subtitle}>
          Your Exia Desktop environment is configured and ready for multimodal voice assistance.
        </ExiaText>
      </View>

      <ExiaCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={18} color={brand.electricCyan} />
          <ExiaText style={styles.cardTitle}>Environment Configuration Summary</ExiaText>
        </View>

        <View style={styles.summaryList}>
          {/* API Gateway */}
          <View style={[styles.summaryItem, { borderColor: t.border }]}>
            <View style={styles.summaryItemLeft}>
              <Ionicons name="server-outline" size={16} color={brand.electricCyan} />
              <View style={styles.summaryItemText}>
                <ExiaText style={styles.summaryItemTitle}>Backend API Gateway</ExiaText>
                <ExiaText variant="mono" style={styles.summaryItemValue}>
                  {config.apiUrl}
                </ExiaText>
              </View>
            </View>
            <Badge
              label={
                config.environmentType === 'cloud'
                  ? 'Cloud'
                  : config.environmentType === 'local'
                    ? 'Localhost'
                    : 'Custom'
              }
              tone="accent"
            />
          </View>

          {/* LiveKit Voice */}
          <View style={[styles.summaryItem, { borderColor: t.border }]}>
            <View style={styles.summaryItemLeft}>
              <Ionicons name="radio-outline" size={16} color={brand.electricCyan} />
              <View style={styles.summaryItemText}>
                <ExiaText style={styles.summaryItemTitle}>LiveKit Voice Engine</ExiaText>
                <ExiaText variant="mono" style={styles.summaryItemValue}>
                  {config.livekitUrl || 'Managed by Backend'}
                </ExiaText>
              </View>
            </View>
            <Badge
              label={config.livekitPreset === 'cloud' ? 'Cloud Cluster' : 'Custom Server'}
              tone="neutral"
            />
          </View>

          {/* Audio Input */}
          <View style={[styles.summaryItem, { borderColor: t.border }]}>
            <View style={styles.summaryItemLeft}>
              <Ionicons name="mic-outline" size={16} color={brand.liveEmerald} />
              <View style={styles.summaryItemText}>
                <ExiaText style={styles.summaryItemTitle}>Audio Input Microphone</ExiaText>
                <ExiaText style={styles.summaryItemValue} numberOfLines={1}>
                  {config.audioInputDeviceLabel || 'System Default Microphone'}
                </ExiaText>
              </View>
            </View>
            <Badge label="Hardware Active" tone="accent" />
          </View>

          {/* Account Mode */}
          <View style={[styles.summaryItem, { borderColor: t.border }]}>
            <View style={styles.summaryItemLeft}>
              <Ionicons name="person-outline" size={16} color="#a855f7" />
              <View style={styles.summaryItemText}>
                <ExiaText style={styles.summaryItemTitle}>Operator Identity</ExiaText>
                <ExiaText style={styles.summaryItemValue}>
                  {config.localMode
                    ? 'Local Standalone Mode (Offline)'
                    : config.userEmail || 'Cloud Authenticated'}
                </ExiaText>
              </View>
            </View>
            <Badge
              label={config.localMode ? 'Local Mode' : 'Cloud Sync'}
              tone={config.localMode ? 'neutral' : 'accent'}
            />
          </View>
        </View>
      </ExiaCard>

      <ExiaCard style={styles.tipCard}>
        <View style={styles.tipRow}>
          <Ionicons name="bulb-outline" size={20} color={brand.electricCyan} />
          <View style={styles.tipText}>
            <ExiaText style={styles.tipTitle}>Quick Tip: Re-launch Wizard Anytime</ExiaText>
            <ExiaText variant="caption">
              You can re-launch this Setup Wizard at any time by going to{' '}
              <ExiaText style={{ fontWeight: '600', color: brand.electricCyan }}>
                Settings → General Settings → Setup Wizard
              </ExiaText>
              .
            </ExiaText>
          </View>
        </View>
      </ExiaCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 420,
  },
  card: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryList: {
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  summaryItemText: {
    flex: 1,
    gap: 2,
  },
  summaryItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryItemValue: {
    fontSize: 12,
  },
  tipCard: {
    marginTop: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
});
