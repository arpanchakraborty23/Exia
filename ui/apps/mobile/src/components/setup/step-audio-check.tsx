import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaText, useTheme } from '@exia/shared-ui';

import { Badge } from '@/components/ui';
import type { DesktopSetupConfig } from '@/lib/desktop-config';

export interface StepAudioCheckProps {
  config: DesktopSetupConfig;
  onChangeConfig: (partial: Partial<DesktopSetupConfig>) => void;
}

interface AudioDevice {
  deviceId: string;
  label: string;
}

export function StepAudioCheck({ config, onChangeConfig }: StepAudioCheckProps) {
  const t = useTheme();

  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>(
    config.audioInputDeviceId || 'default',
  );
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isTesting, setIsTesting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0); // 0 to 100
  const [peakDetected, setPeakDetected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop testing and release hardware
  const stopAudioTest = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        void audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    setIsTesting(false);
    setVolumeLevel(0);
  };

  useEffect(() => {
    return () => {
      stopAudioTest();
    };
  }, []);

  const loadAudioDevices = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));

      setDevices(audioInputs);

      if (audioInputs.length > 0 && (!config.audioInputDeviceId || config.audioInputDeviceId === 'default')) {
        const primary = audioInputs[0];
        setSelectedDevice(primary.deviceId);
        onChangeConfig({
          audioInputDeviceId: primary.deviceId,
          audioInputDeviceLabel: primary.label,
        });
      }
    } catch {
      // ignore
    }
  };

  const startAudioTest = async () => {
    setErrorMessage(null);
    stopAudioTest();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Microphone access is not supported in this runtime environment.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDevice && selectedDevice !== 'default'
          ? { deviceId: { exact: selectedDevice } }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermissionState('granted');
      setIsTesting(true);

      // Re-enumerate to get human-readable labels now that permission was granted
      await loadAudioDevices();

      // Set up AudioContext & AnalyserNode
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Scale 0-255 to 0-100%
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setVolumeLevel(normalized);

        if (normalized > 15) {
          setPeakDetected(true);
        }

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (err: unknown) {
      setPermissionState('denied');
      setErrorMessage(
        (err as Error)?.message || 'Failed to access microphone. Please check system permissions.',
      );
      stopAudioTest();
    }
  };

  const handleSelectDevice = (device: AudioDevice) => {
    setSelectedDevice(device.deviceId);
    onChangeConfig({
      audioInputDeviceId: device.deviceId,
      audioInputDeviceLabel: device.label,
    });
    if (isTesting) {
      // restart test with new device
      setTimeout(() => {
        void startAudioTest();
      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ExiaText variant="title">Audio & Microphone Check</ExiaText>
        <ExiaText variant="caption">
          Verify your input microphone device and check live sound levels for real-time speech conversation.
        </ExiaText>
      </View>

      <ExiaCard style={styles.card}>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <Ionicons
              name={
                permissionState === 'granted'
                  ? 'shield-checkmark'
                  : permissionState === 'denied'
                    ? 'alert-circle'
                    : 'shield-outline'
              }
              size={18}
              color={
                permissionState === 'granted'
                  ? brand.liveEmerald
                  : permissionState === 'denied'
                    ? t.destructive
                    : brand.electricCyan
              }
            />
            <ExiaText style={styles.cardTitle}>Microphone Hardware Status</ExiaText>
          </View>
          <Badge
            label={
              permissionState === 'granted'
                ? 'Authorized'
                : permissionState === 'denied'
                  ? 'Permission Blocked'
                  : 'Ready to Test'
            }
            tone={
              permissionState === 'granted'
                ? 'accent'
                : permissionState === 'denied'
                  ? 'neutral'
                  : 'neutral'
            }
          />
        </View>

        {errorMessage ? (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: t.destructive },
            ]}
          >
            <Ionicons name="warning-outline" size={16} color={t.destructive} />
            <ExiaText variant="caption" style={{ color: t.destructive, flex: 1 }}>
              {errorMessage}
            </ExiaText>
          </View>
        ) : null}

        {/* Live VU Meter Visualizer */}
        <View style={[styles.visualizerBox, { backgroundColor: t.input, borderColor: t.border }]}>
          <View style={styles.meterHeader}>
            <View style={styles.meterTitleRow}>
              <View
                style={[
                  styles.pulseDot,
                  {
                    backgroundColor: isTesting ? brand.liveEmerald : t.mutedForeground,
                  },
                ]}
              />
              <ExiaText style={styles.meterLabel}>
                {isTesting ? 'Live Input Level (Speak into microphone)' : 'Microphone Inactive'}
              </ExiaText>
            </View>
            <ExiaText variant="mono" style={styles.percentText}>
              {volumeLevel}%
            </ExiaText>
          </View>

          {/* Progress bar container */}
          <View style={[styles.barTrack, { backgroundColor: t.border }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.max(2, volumeLevel)}%`,
                  backgroundColor:
                    volumeLevel > 75
                      ? '#ef4444'
                      : volumeLevel > 40
                        ? brand.liveEmerald
                        : brand.electricCyan,
                },
              ]}
            />
          </View>

          <View style={styles.meterScale}>
            <ExiaText variant="caption">0 dB</ExiaText>
            <ExiaText variant="caption">-24 dB</ExiaText>
            <ExiaText variant="caption">-12 dB</ExiaText>
            <ExiaText variant="caption">0 dB Peak</ExiaText>
          </View>
        </View>

        {/* Audio Test Action */}
        <View style={styles.actionRow}>
          <ExiaButton
            label={isTesting ? 'Stop Audio Test' : 'Test Microphone'}
            variant={isTesting ? 'secondary' : 'primary'}
            onPress={isTesting ? stopAudioTest : startAudioTest}
          />
        </View>

        {peakDetected ? (
          <View
            style={[
              styles.detectedBadge,
              { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: brand.liveEmerald },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={brand.liveEmerald} />
            <ExiaText variant="caption" style={{ color: brand.liveEmerald }}>
              Voice audio successfully detected! Your microphone is ready.
            </ExiaText>
          </View>
        ) : null}
      </ExiaCard>

      {/* Input Device Selection */}
      <ExiaCard style={styles.card}>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <Ionicons name="headset-outline" size={18} color={brand.electricCyan} />
            <ExiaText style={styles.cardTitle}>Select Input Device</ExiaText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={loadAudioDevices}
            hitSlop={8}
            style={styles.refreshBtn}
          >
            <Ionicons name="refresh-outline" size={16} color={brand.electricCyan} />
            <ExiaText variant="caption" style={{ color: brand.electricCyan }}>
              Rescan
            </ExiaText>
          </Pressable>
        </View>

        {devices.length === 0 ? (
          <ExiaText variant="caption">
            Click &quot;Test Microphone&quot; above to scan and list available audio recording devices.
          </ExiaText>
        ) : (
          <View style={styles.deviceList}>
            {devices.map((d) => {
              const isSelected = selectedDevice === d.deviceId;
              return (
                <Pressable
                  key={d.deviceId}
                  accessibilityRole="button"
                  onPress={() => handleSelectDevice(d)}
                  style={[
                    styles.deviceItem,
                    {
                      backgroundColor: t.card,
                      borderColor: isSelected ? brand.electricCyan : t.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="mic-outline"
                    size={16}
                    color={isSelected ? brand.electricCyan : t.mutedForeground}
                  />
                  <ExiaText
                    style={[
                      styles.deviceLabel,
                      { color: isSelected ? brand.electricCyan : t.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {d.label}
                  </ExiaText>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={16} color={brand.electricCyan} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
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
  card: {
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  visualizerBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  meterLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    height: 12,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  meterScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  actionRow: {
    marginTop: spacing.xs,
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deviceList: {
    gap: spacing.xs,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  deviceLabel: {
    flex: 1,
    fontSize: 13,
  },
});
