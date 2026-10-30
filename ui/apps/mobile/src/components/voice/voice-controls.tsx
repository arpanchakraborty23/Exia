import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '@exia/design-tokens';
import { ExiaText, useTheme } from '@exia/shared-ui';

import { AudioSession } from '@livekit/react-native';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Voice session control bar — native port of the legacy AgentControlBar with
 * the exact control set of the official LiveKit React Native example
 * (client-sdk-react-native/example RoomControls):
 * mic toggle, camera toggle + flip, screen share, chat, speaker picker,
 * disconnect.
 */
export interface VoiceControlBarProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  screenShareEnabled: boolean;
  chatOpen: boolean;
  connected: boolean;
  onSetMic: (enabled: boolean) => void;
  onSetCamera: (enabled: boolean) => void;
  onFlipCamera: () => void;
  onSetScreenShare: (enabled: boolean) => void;
  onToggleChat: () => void;
  onDisconnect: () => void;
  style?: ViewStyle;
}

export function VoiceControlBar({
  micEnabled,
  cameraEnabled,
  screenShareEnabled,
  chatOpen,
  connected,
  onSetMic,
  onSetCamera,
  onFlipCamera,
  onSetScreenShare,
  onToggleChat,
  onDisconnect,
  style,
}: VoiceControlBarProps) {
  const t = useTheme();
  const [speakerModalVisible, setSpeakerModalVisible] = useState(false);

  return (
    <View
      accessibilityLabel="Voice assistant controls"
      style={[styles.bar, { backgroundColor: t.card, borderColor: t.border }, style]}
    >
      {/* Toggle microphone — off shows destructive tint (legacy behavior) */}
      <IconButton
        accessibilityLabel={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        active={micEnabled}
        destructive={!micEnabled}
        disabled={!connected}
        icon={micEnabled ? 'mic' : 'mic-off'}
        onPress={() => onSetMic(!micEnabled)}
      />

      {/* Toggle camera */}
      <IconButton
        accessibilityLabel={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
        active={cameraEnabled}
        disabled={!connected}
        icon={cameraEnabled ? 'videocam' : 'videocam-off'}
        onPress={() => onSetCamera(!cameraEnabled)}
      />

      {/* Flip camera (front/back) — official example's switchActiveDevice flow */}
      <IconButton
        accessibilityLabel="Flip camera"
        disabled={!connected || !cameraEnabled}
        icon="camera-reverse-outline"
        onPress={onFlipCamera}
      />

      {/* Toggle screen share */}
      <IconButton
        accessibilityLabel={screenShareEnabled ? 'Stop screen share' : 'Start screen share'}
        active={screenShareEnabled}
        disabled={!connected}
        icon={screenShareEnabled ? 'tv' : 'tv-outline'}
        onPress={() => onSetScreenShare(!screenShareEnabled)}
      />

      {/* Toggle chat transcript */}
      <IconButton
        accessibilityLabel={chatOpen ? 'Close chat' : 'Open chat'}
        active={chatOpen}
        disabled={!connected}
        icon={chatOpen ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
        onPress={onToggleChat}
      />

      {/* Speaker (audio output) selection */}
      <IconButton
        accessibilityLabel="Select speaker"
        disabled={!connected}
        icon="volume-high-outline"
        onPress={() => setSpeakerModalVisible(true)}
      />

      {/* Disconnect */}
      <IconButton
        accessibilityLabel="End session"
        destructive
        disabled={!connected}
        icon="close"
        onPress={onDisconnect}
      />

      <SpeakerPickerModal
        onClose={() => setSpeakerModalVisible(false)}
        visible={speakerModalVisible}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Local building blocks
// ---------------------------------------------------------------------------

function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  active = false,
  destructive = false,
  disabled = false,
}: {
  icon: IoniconName;
  accessibilityLabel: string;
  onPress: () => void;
  active?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();

  const backgroundColor = active
    ? 'rgba(31, 213, 249, 0.16)' // primary tint (legacy "on" state)
    : destructive
      ? 'rgba(239, 68, 68, 0.12)' // destructive tint (legacy "off" mic state)
      : t.input;
  const color = active ? '#1fd5f9' : destructive ? t.destructive : t.foreground;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, checked: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

/**
 * Audio output picker — AudioSession.getAudioOutputs()/selectAudioOutput(),
 * exactly the official example's AudioOutputList flow. Device names are
 * platform strings on native (Android audio devices / iOS route picker).
 */
function SpeakerPickerModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const t = useTheme();
  const [outputs, setOutputs] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const load = async () => {
      const list = await AudioSession.getAudioOutputs();
      if (!cancelled) setOutputs(list);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const select = async (deviceId: string) => {
    await AudioSession.selectAudioOutput(deviceId);
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { backgroundColor: t.card, borderColor: t.border }]}>
          <ExiaText style={styles.modalTitle}>Select audio output</ExiaText>
          <FlatList
            data={outputs}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                accessibilityLabel={`Select speaker ${item}`}
                accessibilityRole="button"
                onPress={() => {
                  void select(item);
                }}
                style={({ pressed }) => [
                  styles.deviceRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="volume-high-outline" size={18} color={t.primary} />
                <ExiaText style={styles.deviceLabel}>{item}</ExiaText>
              </Pressable>
            )}
            ListEmptyComponent={
              <ExiaText variant="caption" style={styles.deviceEmpty}>
                No output devices reported yet.
              </ExiaText>
            }
          />
          <Pressable
            accessibilityLabel="Close speaker picker"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.modalClose, { opacity: pressed ? 0.8 : 1 }]}
          >
            <ExiaText>Close</ExiaText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-evenly',
    padding: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '60%',
    padding: spacing.lg,
  },
  modalTitle: { fontWeight: '600', marginBottom: spacing.md },
  deviceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.xs,
  },
  deviceLabel: { flex: 1 },
  deviceEmpty: { paddingVertical: spacing.lg, textAlign: 'center' },
  modalClose: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
});
