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
  Pressable,
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
import { Ionicons } from '@expo/vector-icons';
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
 * Native port of the LiveKit Agent UI following the official LiveKit
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const connected = connectionState === 'connected';
  const agent = participants.find((p) => p.isAgent);

  // Call duration counter
  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [connected]);

  const formattedDuration = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(
    elapsedSeconds % 60,
  ).padStart(2, '0')}`;

  // Stage video: Screen share first, then remote camera, then local camera
  const videoTracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const stageTrack = (
    videoTracks.find((tr) => isTrackReference(tr) && tr.source === Track.Source.ScreenShare) ??
    videoTracks.find(
      (tr) => isTrackReference(tr) && !tr.participant.isLocal && tr.source === Track.Source.Camera,
    ) ??
    videoTracks.find((tr) => isTrackReference(tr) && tr.source === Track.Source.Camera)
  ) as TrackReference | undefined;

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

  // Mutual track exclusivity: Camera vs Screen Share
  const handleSetCamera = useCallback(
    async (enabled: boolean) => {
      if (enabled && isScreenShareEnabled) {
        await localParticipant.setScreenShareEnabled(false);
      }
      await localParticipant.setCameraEnabled(enabled);
    },
    [isScreenShareEnabled, localParticipant],
  );

  const handleSetScreenShare = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        if (isCameraEnabled) {
          await localParticipant.setCameraEnabled(false);
        }
        await startBroadcast();
      } else {
        await localParticipant.setScreenShareEnabled(false);
      }
    },
    [isCameraEnabled, localParticipant, startBroadcast],
  );

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
    try {
      void room.disconnect();
    } catch {
      // Disconnect safe-catch
    }
    // Backend cleanup — mirrors the legacy app's disconnect effect.
    void api.livekit.endSession(sessionId).catch(() => undefined);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [sessionId, room]);

  const entries: ChatEntry[] = chatMessages.map((message) => ({
    id: message.id,
    text: message.message,
    mine: message.from?.isLocal ?? false,
    timestamp: message.timestamp,
  }));

  return (
    <View style={styles.flex}>
      {/* Status Bar */}
      <View style={styles.statusRow}>
        <View style={styles.statusLeft}>
          <Pressable
            accessibilityLabel="Back to sessions"
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleDisconnect}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="arrow-back" size={20} color={t.foreground} />
          </Pressable>
          <Badge
            label={connected ? 'LIVE' : 'CONNECTING'}
            tone={connected ? 'ok' : 'muted'}
          />
          <ExiaText numberOfLines={1} variant="caption" style={styles.statusText}>
            {connected
              ? agent
                ? agentSpeaking
                  ? 'Agent speaking…'
                  : 'Listening…'
                : 'Waiting for agent…'
              : 'Connecting to room…'}
          </ExiaText>
        </View>

        {connected ? (
          <View style={[styles.durationPill, { backgroundColor: t.input, borderColor: t.border }]}>
            <View style={styles.durationDot} />
            <ExiaText variant="mono" style={styles.durationText}>
              {formattedDuration}
            </ExiaText>
          </View>
        ) : null}
      </View>

      {/* When Chat is open, show a compact Stage header above ChatPanel */}
      {chatOpen ? (
        <View style={styles.chatOpenLayout}>
          {/* Compact stage banner */}
          <View
            style={[
              styles.compactStageBanner,
              { backgroundColor: t.card, borderColor: t.border },
            ]}
          >
            {stageTrack ? (
              <View style={styles.compactVideoWrap}>
                <VideoTrack
                  mirror={
                    stageTrack.participant.isLocal &&
                    stageTrack.source === Track.Source.Camera
                  }
                  trackRef={stageTrack}
                  style={styles.compactVideo}
                />
              </View>
            ) : (
              <View style={styles.compactStageInfo}>
                <ExiaAvatar size={36} />
                <View style={styles.compactStageTextWrap}>
                  <ExiaText style={styles.compactStageTitle}>
                    {agent?.name || agent?.identity || 'Exia Assistant'}
                  </ExiaText>
                  <ExiaText variant="caption" style={{ color: brand.liveEmerald }}>
                    {agentSpeaking ? 'Speaking…' : 'Listening…'}
                  </ExiaText>
                </View>
                {agentAudio ? (
                  <View style={styles.compactVisualizerBox}>
                    <BarVisualizer
                      barCount={5}
                      options={{ barColor: brand.electricCyan }}
                      state={agentSpeaking ? 'speaking' : 'listening'}
                      trackRef={agentAudio}
                    />
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* Chat transcript */}
          <ChatPanel
            entries={entries}
            isAgentThinking={agentSpeaking}
            onClose={() => setChatOpen(false)}
            onSend={(text) => {
              void handleSend(text);
            }}
            style={styles.chatPanel}
          />
        </View>
      ) : (
        /* Full Stage when chat is closed */
        <View style={styles.stageContainer}>
          {stageTrack ? (
            <View style={[styles.stage, { backgroundColor: t.card, borderColor: t.border }]}>
              <VideoTrack
                mirror={
                  stageTrack.participant.isLocal &&
                  stageTrack.source === Track.Source.Camera
                }
                trackRef={stageTrack}
                style={styles.video}
              />

              {/* Video source pill overlay */}
              <View style={styles.videoTrackBadge}>
                <Ionicons
                  name={
                    stageTrack.source === Track.Source.ScreenShare ? 'tv' : 'videocam'
                  }
                  size={13}
                  color={brand.electricCyan}
                />
                <ExiaText style={styles.videoTrackBadgeText}>
                  {stageTrack.source === Track.Source.ScreenShare
                    ? 'Screen Share'
                    : stageTrack.participant.isLocal
                      ? 'Camera'
                      : 'Agent Video'}
                </ExiaText>
              </View>

              {/* In-stage camera flip button when camera is active */}
              {isCameraEnabled && stageTrack.participant.isLocal ? (
                <Pressable
                  accessibilityLabel="Flip camera"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    void flipCamera();
                  }}
                  style={styles.floatingFlipBtn}
                >
                  <Ionicons name="camera-reverse" size={18} color="#ffffff" />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={[styles.stage, { backgroundColor: t.card, borderColor: t.border }]}>
              {/* Linear / Perplexity subtle ambient aura glow */}
              <View style={styles.ambientAura} />

              <ExiaAvatar size={80} />

              <View style={styles.visualizerBox}>
                {agentAudio ? (
                  <BarVisualizer
                    barCount={7}
                    options={{ barColor: brand.electricCyan }}
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
        </View>
      )}

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
          void handleSetCamera(enabled);
        }}
        onSetMic={(enabled) => {
          void localParticipant.setMicrophoneEnabled(enabled);
        }}
        onSetScreenShare={(enabled) => {
          void handleSetScreenShare(enabled);
        }}
        onToggleChat={() => setChatOpen((open) => !open)}
        screenShareEnabled={isScreenShareEnabled}
        style={styles.controlBar}
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
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    flex: 1,
  },
  backBtn: {
    padding: spacing.xs,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
  },
  durationPill: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  durationDot: {
    backgroundColor: brand.liveEmerald,
    borderRadius: radius.full,
    height: 6,
    width: 6,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stageContainer: {
    flex: 1,
    marginBottom: spacing.md,
  },
  stage: {
    alignItems: 'center',
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  ambientAura: {
    backgroundColor: 'rgba(31, 213, 249, 0.08)',
    borderRadius: 9999,
    height: 180,
    position: 'absolute',
    width: 180,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  videoTrackBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.xs,
    left: spacing.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    position: 'absolute',
    top: spacing.md,
  },
  videoTrackBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  floatingFlipBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: radius.full,
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 38,
  },
  visualizerBox: {
    height: 120,
    width: '80%',
  },
  stageHint: {
    color: brand.liveEmerald,
    fontSize: 12,
    textAlign: 'center',
  },
  chatOpenLayout: {
    flex: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  compactStageBanner: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    height: 64,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
  },
  compactVideoWrap: {
    flex: 1,
    width: '100%',
  },
  compactVideo: {
    flex: 1,
    width: '100%',
  },
  compactStageInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactStageTextWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  compactStageTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactVisualizerBox: {
    height: 32,
    width: 80,
  },
  chatPanel: {
    flex: 1,
  },
  controlBar: {
    marginTop: 'auto',
  },
});
