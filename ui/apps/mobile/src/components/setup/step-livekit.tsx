import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaCard, ExiaInput, ExiaText, useTheme } from '@exia/shared-ui';

import { Badge, Field } from '@/components/ui';
import {
  DEFAULT_CLOUD_LIVEKIT_URL,
  type DesktopSetupConfig,
} from '@/lib/desktop-config';

export interface StepLivekitProps {
  config: DesktopSetupConfig;
  onChangeConfig: (partial: Partial<DesktopSetupConfig>) => void;
}

export function StepLivekit({ config, onChangeConfig }: StepLivekitProps) {
  const t = useTheme();

  const [showSecret, setShowSecret] = useState(false);

  const handleSelectPreset = (preset: 'cloud' | 'custom') => {
    onChangeConfig({
      livekitPreset: preset,
      livekitUrl: preset === 'cloud' ? DEFAULT_CLOUD_LIVEKIT_URL : config.livekitUrl || '',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ExiaText variant="title">LiveKit WebRTC Voice Engine</ExiaText>
        <ExiaText variant="caption">
          Exia Desktop connects directly via WebRTC to provide ultra low-latency (&lt;300ms) full-duplex conversational voice.
        </ExiaText>
      </View>

      {/* Cloud Preset Option */}
      <Pressable
        accessibilityRole="button"
        onPress={() => handleSelectPreset('cloud')}
        style={[
          styles.presetCard,
          {
            backgroundColor: t.card,
            borderColor: config.livekitPreset === 'cloud' ? brand.electricCyan : t.border,
          },
        ]}
      >
        <View style={styles.presetHeader}>
          <View style={styles.radioRow}>
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor: config.livekitPreset === 'cloud' ? brand.electricCyan : t.border,
                },
              ]}
            >
              {config.livekitPreset === 'cloud' ? (
                <View style={[styles.radioDot, { backgroundColor: brand.electricCyan }]} />
              ) : null}
            </View>
            <View>
              <ExiaText style={styles.presetTitle}>Exia Cloud Voice Cluster</ExiaText>
              <ExiaText variant="mono" style={styles.presetUrl}>
                {DEFAULT_CLOUD_LIVEKIT_URL}
              </ExiaText>
            </View>
          </View>
          <Badge label="Automatic Provisioning" tone="accent" />
        </View>
        <ExiaText variant="caption">
          Tokens and voice rooms are automatically negotiated by your backend gateway. No local API secrets required.
        </ExiaText>
      </Pressable>

      {/* Custom LiveKit Option */}
      <Pressable
        accessibilityRole="button"
        onPress={() => handleSelectPreset('custom')}
        style={[
          styles.presetCard,
          {
            backgroundColor: t.card,
            borderColor: config.livekitPreset === 'custom' ? brand.electricCyan : t.border,
          },
        ]}
      >
        <View style={styles.presetHeader}>
          <View style={styles.radioRow}>
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor: config.livekitPreset === 'custom' ? brand.electricCyan : t.border,
                },
              ]}
            >
              {config.livekitPreset === 'custom' ? (
                <View style={[styles.radioDot, { backgroundColor: brand.electricCyan }]} />
              ) : null}
            </View>
            <ExiaText style={styles.presetTitle}>Custom / Self-Hosted LiveKit Server</ExiaText>
          </View>
          <Badge label="Self-Hosted" tone="neutral" />
        </View>
        <ExiaText variant="caption">
          Connect to your own local or enterprise LiveKit server (e.g. Docker or cloud VM).
        </ExiaText>

        {config.livekitPreset === 'custom' ? (
          <View style={styles.customForm}>
            <Field label="LiveKit WebSocket URL">
              <ExiaInput
                value={config.livekitUrl}
                onChangeText={(text) => onChangeConfig({ livekitUrl: text })}
                placeholder="wss://livekit.yourdomain.com"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            <Field label="LiveKit API Key">
              <ExiaInput
                value={config.livekitApiKey || ''}
                onChangeText={(text) => onChangeConfig({ livekitApiKey: text })}
                placeholder="APIxxxxxxxxxxxx"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            <Field label="LiveKit API Secret">
              <View style={styles.secretRow}>
                <View style={styles.secretInputWrap}>
                  <ExiaInput
                    value={config.livekitApiSecret || ''}
                    onChangeText={(text) => onChangeConfig({ livekitApiSecret: text })}
                    placeholder="secret_xxxxxxxxxxxx"
                    secureTextEntry={!showSecret}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowSecret((v) => !v)}
                  style={[styles.toggleBtn, { backgroundColor: t.secondary }]}
                >
                  <Ionicons
                    name={showSecret ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={t.foreground}
                  />
                </Pressable>
              </View>
            </Field>
          </View>
        ) : null}
      </Pressable>

      <ExiaCard style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={20} color={brand.electricCyan} />
          <View style={styles.infoText}>
            <ExiaText style={styles.infoTitle}>Desktop Audio Pipeline</ExiaText>
            <ExiaText variant="caption">
              Exia Desktop runs Electron with hardware audio privileges pre-authorized, delivering direct native microphone input and low-jitter audio packet delivery.
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
  header: {
    gap: 4,
    marginBottom: spacing.xs,
  },
  presetCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
  },
  presetTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  presetUrl: {
    fontSize: 12,
    marginTop: 2,
  },
  customForm: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  secretRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  secretInputWrap: {
    flex: 1,
  },
  toggleBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
  },
  infoCard: {
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
