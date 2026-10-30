import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { EmptyState, ScreenHeader } from '@/components/ui';

/**
 * Web-only placeholder for the voice session route.
 *
 * `@livekit/react-native` ships native WebRTC code that only runs in a
 * native build, so the full `/voice` experience (mic, camera, screen share,
 * speaker selection, chat) is available on the Android/iOS dev build and
 * TestFlight — running Expo Go or the web preview cannot host it.
 *
 * On web the app still browses transcripts, history, analytics, MCP
 * servers, prompts and model settings; voice sessions need a native build.
 */
export default function VoiceWeb() {
  const t = useTheme();

  return (
    <ExiaScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Voice session" subtitle="Native build required" />

        <ExiaCard style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(31, 213, 249, 0.1)' }]}>
            <Ionicons name="phone-portrait-outline" size={36} color={brand.electricCyan} />
          </View>

          <ExiaText style={styles.title}>Voice runs on the native app</ExiaText>

          <ExiaText variant="caption" style={styles.message}>
            The LiveKit WebRTC client uses native device modules (AudioSession, hardware codecs,
            and screen capture) that are unavailable in the browser preview.
          </ExiaText>

          <View style={[styles.codeBox, { backgroundColor: t.input, borderColor: t.border }]}>
            <View style={styles.terminalHeader}>
              <View style={[styles.termDot, { backgroundColor: '#ef4444' }]} />
              <View style={[styles.termDot, { backgroundColor: '#f59e0b' }]} />
              <View style={[styles.termDot, { backgroundColor: brand.liveEmerald }]} />
              <ExiaText variant="mono" style={styles.termTitle}>
                terminal
              </ExiaText>
            </View>
            <ExiaText variant="mono" style={[styles.command, { color: brand.electricCyan }]}>
              npx expo run:android
            </ExiaText>
            <ExiaText variant="caption" style={styles.commandAlt}>
              or npx expo run:ios
            </ExiaText>
          </View>

          <ExiaText variant="caption" style={styles.grantHint}>
            Build the dev client, open the Voice tab, and grant microphone & camera permissions.
          </ExiaText>
        </ExiaCard>

        <EmptyState
          title="What still works here"
          message="Transcripts, telemetry, MCP servers, prompts, model credentials and analytics all run in the web preview."
          actionLabel="Back to home"
          onAction={() => router.replace('/')}
        />
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 64,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  message: {
    lineHeight: 18,
    maxWidth: 380,
    textAlign: 'center',
  },
  codeBox: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  terminalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.sm,
  },
  termDot: {
    borderRadius: radius.full,
    height: 8,
    width: 8,
  },
  termTitle: {
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.5,
  },
  command: {
    fontSize: 13,
    fontWeight: '600',
  },
  commandAlt: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
  grantHint: {
    textAlign: 'center',
    fontSize: 12,
  },
});
