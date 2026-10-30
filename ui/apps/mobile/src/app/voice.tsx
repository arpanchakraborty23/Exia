import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing } from '@exia/design-tokens';
import { ExiaCard, ExiaScreen, ExiaText } from '@exia/shared-ui';


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
  return (
    <ExiaScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Voice session" subtitle="Native build required" />

        <ExiaCard style={styles.card}>
          <View style={styles.iconRow}>
            <Ionicons name="phone-portrait-outline" size={40} color="#1fd5f9" />
          </View>
          <ExiaText style={styles.title}>Voice runs on the native app</ExiaText>
          <ExiaText variant="caption" style={styles.message}>
            LiveKit WebRTC stack has native code that Expo Go and the web
            preview cannot load. Build a dev client to try it:
          </ExiaText>
          <ExiaText variant="mono" style={styles.command}>
            npx expo run:android
          </ExiaText>
          <ExiaText variant="caption">
            then open the Voice tab and grant microphone permission.
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
  scroll: { paddingBottom: spacing.xxl },
  card: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg, paddingVertical: spacing.xl },
  iconRow: { marginBottom: spacing.sm },
  title: { fontWeight: '600' },
  message: { textAlign: 'center' },
  command: { textAlign: 'center' },
});
