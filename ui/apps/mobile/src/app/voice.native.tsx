/**
 * LiveKit native bootstrap — importing this module runs `registerGlobals()`
 * at module scope (react-native-webrtc polyfills for livekit-client).
 */
import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  findNodeHandle,
  NativeModules,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  AndroidAudioTypePresets,
  AudioSession,
  BarVisualizer,
  isTrackReference,
  LiveKitRoom,
  registerGlobals,
  useChat,
  useConnectionState,
  useIsSpeaking,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from '@livekit/react-native';
import { ScreenCapturePickerView, mediaDevices } from '@livekit/react-native-webrtc';
import { Track } from 'livekit-client';
import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { api } from '@/lib/api';
// Importing this module runs registerGlobals() at module scope — the
// react-native-webrtc polyfills livekit-client needs on native.
import { liveKitOverridesFromConfig } from '@/lib/livekit';
import { Badge, ErrorState, ExiaAvatar, Loading } from '@/components/ui';
import { ChatPanel, type ChatEntry } from '@/components/voice/chat-panel';
import { VoiceControlBar } from '@/components/voice/voice-controls';

/**
 * Voice session — full-screen LiveKit room.
 *
 * Native port of the legacy web voice stage using the official LiveKit
 * React Native SDK example flows (`client-sdk-react-native/example`):
 * mic toggle, camera toggle + flip, screen share (iOS picker / Android
 * media projection), chat over the `lk.chat` text-stream topic, speaker
 * selection via AudioSession, and disconnect with backend session cleanup.
 * Route: /voice (immersive, no header).
 */
registerGlobals();

export default function Voice() {
  const token = useQuery({
    queryKey: ['livekit-token'],
    queryFn: async () => {
      // Same overrides flow as the legacy client: credentials saved in the
      // model config are passed to POST /api/agent/token.
      const config = await api.models.getConfig();
      return api.livekit.token(undefined, liveKitOverridesFromConfig(config));
    },
    retry: 1,
  });

  // Start the native audio session once we are about to connect; stop it on
  // unmount (official example lifecycle).
  useEffect(() => {
    if (!token.data) return;
    let cancelled = false;
    const start = async () => {
      await AudioSession.configureAudio({
        android: { audioTypeOptions: AndroidAudioTypePresets.communication },
      });
      if (!cancelled) await AudioSession.startAudioSession();
    };
    void start();
    return () => {
      cancelled = true;
      void AudioSession.stopAudioSession();
    };
  }, [token.data]);

  return (
    <ExiaScreen style={styles.flex}>
      <Stack.Screen options={{ headerShown: false }} />

      {token.isLoading ? <Loading label="Requesting session token…" /> : null}

      {token.isError ? (
        <ErrorState
          message={
            token.error instanceof Error
              ? token.error.message
              : 'Could not get a LiveKit token — check the backend and LiveKit credentials in Settings.'
          }
          onRetry={() => void token.refetch()}
        />
      ) : null}

      {token.data ? (
        <View style={styles.flex}>
          <LiveKitRoom
            audio
            connect
            options={{ adaptiveStream: { pixelDensity: 'screen' } }}
            serverUrl={token.data.server_url}
            token={token.data.token}
            video={false}
          >
            <VoiceStage sessionId={token.data.session_id} />
          </LiveKitRoom>
        </View>
      ) : null}
    </ExiaScreen>
  );
}

// ---------------------------------------------------------------------------
// Stage (rendered inside the room context)
// ---------------------------------------------------------------------------

function VoiceStage({ sessionId }: { sessionId: string }) {
  const t = useTheme();
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const {
    cameraTrack,
    isCameraEnabled,
    isMicrophoneEnabled,
    isScreenShareEnabled,
    localParticipant,
  } = useLocalParticipant();
  const { chatMessages, send } = useChat();

  const [chatOpen, setChatOpen] = useState(false);
  const [isFrontFacing, setIsFrontFacing] = useState(true);

  const connected = connectionState === 'connected';
  const agent = participants.find((p) => p.isAgent);

  // Stage video: local camera / screen share / remote video, first available.
  const videoTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const stageTrack = videoTracks.find(isTrackReference);

  // Agent audio drives the bar visualizer (subscribed remote microphone).
  const micTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: true },
  );
  const agentAudio = micTracks.find(
    (track): track is TrackReferenceOrPlaceholder =>
      isTrackReference(track) && !track.participant.isLocal,
  );
  const agentSpeaking = useIsSpeaking(agentAudio?.participant);

  // iOS screen share requires the system broadcast picker first
  // (official example flow); Android publishes directly.
  const screenCaptureRef = useRef<ComponentRef<typeof ScreenCapturePickerView> | null>(null);
  const screenCapturePickerView =
    Platform.OS === 'ios' ? <ScreenCapturePickerView ref={screenCaptureRef} /> : null;

  const startBroadcast = useCallback(async () => {
    if (Platform.OS === 'ios') {
      const reactTag = findNodeHandle(screenCaptureRef.current);
      if (reactTag === null) return;
      await NativeModules.ScreenCapturePickerViewManager.show(reactTag);
      await localParticipant.setScreenShareEnabled(true);
    } else {
      await localParticipant.setScreenShareEnabled(true);
    }
  }, [localParticipant]);

  // Camera flip — enumerate videoinput devices and switch (official example).
  const flipCamera = useCallback(async () => {
    if (!cameraTrack) return;
    const facingMode = isFrontFacing ? 'environment' : 'front';
    setIsFrontFacing(!isFrontFacing);
    const devices = (await mediaDevices.enumerateDevices()) as {
      kind: string;
      deviceId: string;
      facing?: string;
    }[];
    const next = devices.find(
      (device) => device.kind === 'videoinput' && device.facing === facingMode,
    );
    if (!next) return;
    await room.switchActiveDevice('videoinput', next.deviceId);
  }, [cameraTrack, isFrontFacing, room]);

  const handleSend = useCallback(
    async (text: string) => {
      await send(text);
    },
    [send],
  );

  const handleDisconnect = useCallback(() => {
    // Backend cleanup — mirrors the legacy app's disconnect effect.
    void api.livekit.endSession(sessionId).catch(() => undefined);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [sessionId]);

  const entries: ChatEntry[] = chatMessages.map((message) => ({
    id: message.id,
    text: message.message,
    mine: message.from?.isLocal ?? false,
  }));

  return (
    <View style={styles.flex}>
      {/* Status row */}
      <View style={styles.statusRow}>
        <Badge
          label={connected ? 'LIVE' : 'CONNECTING'}
          tone={connected ? 'ok' : 'muted'}
        />
        <ExiaText variant="caption" style={styles.statusText}>
          {connected
            ? agent
              ? `Agent ${agent.identity || agent.name || 'connected'}`
              : 'Waiting for the agent to join…'
            : 'Connecting to the voice room…'}
        </ExiaText>
      </View>

      {/* Stage: video when available, agent audio visualizer otherwise */}
      {stageTrack ? (
        <View style={[styles.stage, { backgroundColor: t.card, borderColor: t.border }]}>
          <VideoTrack
            mirror={stageTrack.participant.isLocal && stageTrack.source === Track.Source.Camera}
            trackRef={stageTrack}
            style={styles.video}
          />
        </View>
      ) : (
        <View style={[styles.stage, { backgroundColor: t.card, borderColor: t.border }]}>
          <ExiaAvatar size={72} />
          <View style={styles.visualizerBox}>
            {agentAudio ? (
              <BarVisualizer
                barCount={7}
                options={{ barColor: t.primary }}
                state={agentSpeaking ? 'speaking' : 'listening'}
                trackRef={agentAudio}
              />
            ) : null}
          </View>
          <ExiaText variant="caption" style={styles.stageHint}>
            {agentAudio
              ? agentSpeaking
                ? 'Agent is speaking…'
                : 'Listening — speak naturally'
              : 'Voice room live — the agent will join in a moment.'}
          </ExiaText>
        </View>
      )}

      {/* Chat transcript (toggled) */}
      {chatOpen ? (
        <ChatPanel
          entries={entries}
          onSend={(text) => {
            void handleSend(text);
          }}
          style={styles.chatPanel}
        />
      ) : null}

      {/* Controls */}
      <VoiceControlBar
        cameraEnabled={isCameraEnabled}
        chatOpen={chatOpen}
        connected={connected}
        micEnabled={isMicrophoneEnabled}
        onDisconnect={handleDisconnect}
        onFlipCamera={() => {
          void flipCamera();
        }}
        onSetCamera={(enabled) => {
          void localParticipant.setCameraEnabled(enabled);
        }}
        onSetMic={(enabled) => {
          void localParticipant.setMicrophoneEnabled(enabled);
        }}
        onSetScreenShare={(enabled) => {
          if (enabled) {
            void startBroadcast();
          } else {
            void localParticipant.setScreenShareEnabled(false);
          }
        }}
        onToggleChat={() => setChatOpen((open) => !open)}
        screenShareEnabled={isScreenShareEnabled}
      />

      {screenCapturePickerView}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusText: { flex: 1 },
  stage: {
    alignItems: 'center',
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  video: { flex: 1, width: '100%' },
  visualizerBox: { height: 120, width: '80%' },
  stageHint: { textAlign: 'center', color: brand.liveEmerald },
  chatPanel: { flex: 1, marginTop: spacing.md },
});
