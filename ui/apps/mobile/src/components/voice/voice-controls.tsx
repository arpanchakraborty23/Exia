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

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaText, useTheme } from '@exia/shared-ui';

import { AudioSession } from '@livekit/react-native';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Voice session control bar — native port of the LiveKit AgentControlBar with
 * the exact control set of the official LiveKit React Native example
 * (client-sdk-react-native/example RoomControls):
 * mic toggle, camera toggle + flip, screen share, chat toggle, speaker picker,
 * and disconnect.
 */
export interface VoiceControlBarProps {
  micEnabled: boolean;
  cameraEnabled: boolean;
  screenShareEnabled: boolean;
  chatOpen: boolean;
  connected: boolean;
  unreadCount?: number;
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
  unreadCount = 0,
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
      style={[
        styles.bar,
        {
          backgroundColor: t.card,
          borderColor: t.border,
        },
        style,
      ]}
    >
      <View style={styles.controlsRow}>
        {/* Toggle microphone — off shows destructive tint (LiveKit legacy behavior) */}
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

        {/* Flip camera (front/back) — official example switchActiveDevice flow */}
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
          accessibilityLabel={chatOpen ? 'Close chat transcript' : 'Open chat transcript'}
          active={chatOpen}
          badgeCount={!chatOpen && unreadCount > 0 ? unreadCount : undefined}
          disabled={!connected}
          icon={chatOpen ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
          onPress={onToggleChat}
        />

        {/* Speaker (audio output) selection modal */}
        <IconButton
          accessibilityLabel="Select audio output speaker"
          disabled={!connected}
          icon="volume-high-outline"
          onPress={() => setSpeakerModalVisible(true)}
        />

        {/* Divider before end call */}
        <View style={[styles.divider, { backgroundColor: t.border }]} />

        {/* Disconnect / End call */}
        <IconButton
          accessibilityLabel="End voice call"
          destructive
          disabled={!connected}
          icon="call"
          iconStyle={styles.disconnectIcon}
          onPress={onDisconnect}
          style={styles.disconnectButton}
        />
      </View>

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
  badgeCount,
  iconStyle,
  style,
}: {
  icon: IoniconName;
  accessibilityLabel: string;
  onPress: () => void;
  active?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  badgeCount?: number;
  iconStyle?: object;
  style?: ViewStyle;
}) {
  const t = useTheme();

  const backgroundColor = active
    ? 'rgba(31, 213, 249, 0.15)' // electricCyan tint (LiveKit on state)
    : destructive
      ? 'rgba(239, 68, 68, 0.14)' // destructive tint (LiveKit off mic/disconnect state)
      : t.input;

  const borderColor = active
    ? 'rgba(31, 213, 249, 0.35)'
    : destructive
      ? 'rgba(239, 68, 68, 0.3)'
      : 'rgba(255, 255, 255, 0.05)';

  const color = active
    ? brand.electricCyan
    : destructive
      ? t.destructive
      : t.foreground;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, checked: active }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.35 : pressed ? 0.78 : 1,
          transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={20} color={color} style={iconStyle} />
      {badgeCount !== undefined && badgeCount > 0 ? (
        <View style={styles.badgePill}>
          <ExiaText style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : String(badgeCount)}
          </ExiaText>
        </View>
      ) : null}
    </Pressable>
  );
}

function getDeviceIcon(name: string): IoniconName {
  const lower = name.toLowerCase();
  if (lower.includes('bluetooth') || lower.includes('bt') || lower.includes('airpod')) {
    return 'bluetooth-outline';
  }
  if (lower.includes('head') || lower.includes('earphone')) {
    return 'headset-outline';
  }
  if (lower.includes('earpiece') || lower.includes('receiver') || lower.includes('phone')) {
    return 'ear-outline';
  }
  if (lower.includes('speaker')) {
    return 'volume-high-outline';
  }
  return 'volume-medium-outline';
}

/**
 * Audio output picker — AudioSession.getAudioOutputs()/selectAudioOutput(),
 * exactly matching the official LiveKit example's AudioOutputList flow.
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
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const load = async () => {
      try {
        const list = await AudioSession.getAudioOutputs();
        if (!cancelled) {
          setOutputs(list);
          if (list.length > 0 && !selectedDevice) {
            setSelectedDevice(list[0]);
          }
        }
      } catch (err) {
        console.warn('Could not query audio outputs:', err);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [visible, selectedDevice]);

  const select = async (deviceId: string) => {
    try {
      setSelectedDevice(deviceId);
      await AudioSession.selectAudioOutput(deviceId);
    } catch (err) {
      console.warn('Failed to select audio output:', err);
    }
    onClose();
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.modalSheet, { backgroundColor: t.card, borderColor: t.border }]}
        >
          {/* Sheet Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: t.border }]} />

          <View style={styles.modalHeader}>
            <View>
              <ExiaText style={styles.modalTitle}>Audio Output</ExiaText>
              <ExiaText variant="caption">Route audio to speaker, earpiece, or Bluetooth</ExiaText>
            </View>
            <Pressable
              accessibilityLabel="Close audio output picker"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeIconBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="close" size={20} color={t.mutedForeground} />
            </Pressable>
          </View>

          <FlatList
            data={outputs}
            keyExtractor={(item) => item}
            style={styles.deviceList}
            renderItem={({ item }) => {
              const isSelected = selectedDevice === item;
              return (
                <Pressable
                  accessibilityLabel={`Select audio output ${item}`}
                  accessibilityRole="button"
                  onPress={() => {
                    void select(item);
                  }}
                  style={({ pressed }) => [
                    styles.deviceRow,
                    {
                      backgroundColor: isSelected ? 'rgba(31, 213, 249, 0.08)' : t.input,
                      borderColor: isSelected ? 'rgba(31, 213, 249, 0.3)' : t.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View style={styles.deviceLeft}>
                    <Ionicons
                      name={getDeviceIcon(item)}
                      size={20}
                      color={isSelected ? brand.electricCyan : t.foreground}
                    />
                    <ExiaText
                      style={[
                        styles.deviceLabel,
                        isSelected ? { color: brand.electricCyan, fontWeight: '600' } : undefined,
                      ]}
                    >
                      {item}
                    </ExiaText>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={18} color={brand.electricCyan} />
                  ) : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="volume-mute-outline" size={32} color={t.mutedForeground} />
                <ExiaText variant="caption" style={styles.deviceEmpty}>
                  No active audio output devices reported.
                </ExiaText>
              </View>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: radius.xxl ?? 28,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  controlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs + 2,
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  divider: {
    height: 24,
    width: StyleSheet.hairlineWidth,
  },
  disconnectButton: {
    transform: [{ rotate: '135deg' }],
  },
  disconnectIcon: {
    marginLeft: 1,
  },
  badgePill: {
    alignItems: 'center',
    backgroundColor: brand.electricCyan,
    borderRadius: radius.full,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -2,
    top: -2,
  },
  badgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '700',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '65%',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    borderRadius: radius.full,
    height: 4,
    marginBottom: spacing.md,
    width: 36,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  closeIconBtn: {
    padding: spacing.xs,
  },
  deviceList: {
    marginTop: spacing.xs,
  },
  deviceRow: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  deviceLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
  },
  deviceLabel: {
    fontSize: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  deviceEmpty: {
    textAlign: 'center',
  },
});
