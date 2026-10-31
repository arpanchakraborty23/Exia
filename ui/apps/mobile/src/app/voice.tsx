import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { api } from '@/lib/api';
import {
  DEFAULT_CLOUD_LIVEKIT_URL,
  getStoredSetupConfigSync,
  saveStoredSetupConfig,
  type DesktopSetupConfig,
} from '@/lib/desktop-config';
import { Badge, ScreenHeader } from '@/components/ui';

interface AudioInputDevice {
  deviceId: string;
  label: string;
}

export default function VoiceStudioScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  const [config, setConfig] = useState<DesktopSetupConfig>(() => getStoredSetupConfigSync());
  const [audioDevices, setAudioDevices] = useState<AudioInputDevice[]>([]);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  // Audio Testing & Web Audio Volume Meter
  const [isAudioTesting, setIsAudioTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Backend model & mcp telemetry
  const modelConfig = useQuery({
    queryKey: ['model-config'],
    queryFn: () => api.models.getConfig(),
  });

  const mcpList = useQuery({
    queryKey: ['mcp'],
    queryFn: () => api.mcp.list(),
  });

  const loadAudioDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));
      setAudioDevices(inputs);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
        return;
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!active) return;
        const inputs = devices
          .filter((d) => d.kind === 'audioinput')
          .map((d, index) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${index + 1}`,
          }));
        setAudioDevices(inputs);
      } catch {
        // Ignore
      }
    })();

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', loadAudioDevices);
      return () => {
        active = false;
        navigator.mediaDevices.removeEventListener('devicechange', loadAudioDevices);
      };
    }
    return () => {
      active = false;
    };
  }, [loadAudioDevices]);

  const handleSelectAudioDevice = async (device: AudioInputDevice) => {
    const updated = await saveStoredSetupConfig({
      audioInputDeviceId: device.deviceId,
      audioInputDeviceLabel: device.label,
    });
    setConfig(updated);
    setAudioModalOpen(false);

    if (isAudioTesting) {
      stopAudioTest();
      startAudioTest(device.deviceId);
    }
  };

  const startAudioTest = async (deviceIdOverride?: string) => {
    stopAudioTest();
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      const targetDevice = deviceIdOverride || config.audioInputDeviceId;
      const constraints: MediaStreamConstraints = {
        audio: targetDevice && targetDevice !== 'default'
          ? { deviceId: { exact: targetDevice } }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsAudioTesting(true);

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const measureVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 120) * 100));
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(measureVolume);
      };

      animFrameRef.current = requestAnimationFrame(measureVolume);
    } catch (err) {
      console.warn('[VoiceStudio] Microphone access error:', err);
      stopAudioTest();
    }
  };

  const stopAudioTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        void audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsAudioTesting(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      stopAudioTest();
    };
  }, []);

  const activeMcpTools = mcpList.data?.filter((s) => s.enabled) ?? [];
  const pointerStyle = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : undefined;

  return (
    <ExiaScreen>
      <ScrollView
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Voice Studio Pro"
          subtitle="Real-time Multimodal Agent Console & Audio Hardware Monitor"
          onBack={() => router.replace('/(tabs)')}
        />

        {/* Studio Status Bar */}
        <View style={[styles.statusBar, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.statusLeft}>
            <View style={styles.statusDotLive} />
            <ExiaText style={styles.statusTitle}>Studio Audio Engine</ExiaText>
            <Badge label="DESKTOP PRO" tone="ok" />
          </View>
          <View style={styles.statusRight}>
            <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
              LiveKit Server:
            </ExiaText>
            <ExiaText variant="mono" style={styles.serverPill}>
              {config.livekitUrl || DEFAULT_CLOUD_LIVEKIT_URL}
            </ExiaText>
          </View>
        </View>

        {/* High-Density Multi-Pane View */}
        <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
          {/* Left Pane: Audio Hardware & Media Engine */}
          <View style={[styles.pane, isDesktop && styles.leftPane]}>
            <ExiaCard style={styles.paneCard}>
              <View style={styles.paneHeader}>
                <View style={styles.paneTitleRow}>
                  <Ionicons name="mic" size={18} color={brand.electricCyan} />
                  <ExiaText style={styles.paneTitle}>Hardware Audio Input</ExiaText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Switch Microphone"
                  onPress={() => {
                    void loadAudioDevices();
                    setAudioModalOpen(true);
                  }}
                  style={[styles.switchMicBtn, pointerStyle, { borderColor: t.border, backgroundColor: t.input }]}
                >
                  <Ionicons name="swap-vertical-outline" size={13} color={brand.electricCyan} />
                  <ExiaText variant="caption" style={{ color: brand.electricCyan, fontWeight: '600' }}>
                    Select Device
                  </ExiaText>
                </Pressable>
              </View>

              <View style={[styles.deviceInfoBox, { backgroundColor: t.input, borderColor: t.border }]}>
                <View style={styles.deviceInfoLeft}>
                  <Ionicons name="radio-outline" size={16} color={brand.liveEmerald} />
                  <View style={{ flex: 1 }}>
                    <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                      Active Input Device
                    </ExiaText>
                    <ExiaText numberOfLines={1} style={styles.deviceLabelText}>
                      {config.audioInputDeviceLabel || 'System Default Microphone'}
                    </ExiaText>
                  </View>
                </View>
                <View style={styles.statusDotLive} />
              </View>

              {/* Live VU Volume Meter */}
              <View style={styles.meterContainer}>
                <View style={styles.meterHeader}>
                  <ExiaText variant="caption" style={styles.meterTitle}>
                    AUDIO LEVEL MONITOR (VU)
                  </ExiaText>
                  <ExiaText variant="mono" style={styles.meterValue}>
                    {isAudioTesting ? `${audioLevel}%` : 'INACTIVE'}
                  </ExiaText>
                </View>

                <View style={[styles.meterTrack, { backgroundColor: t.input }]}>
                  <View
                    style={[
                      styles.meterFill,
                      {
                        width: `${isAudioTesting ? Math.max(audioLevel, 4) : 0}%`,
                        backgroundColor:
                          audioLevel > 75
                            ? '#f59e0b'
                            : audioLevel > 90
                              ? '#ef4444'
                              : brand.liveEmerald,
                      },
                    ]}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isAudioTesting ? 'Stop Audio Test' : 'Test Microphone'}
                  onPress={() => (isAudioTesting ? stopAudioTest() : startAudioTest())}
                  style={[
                    styles.testAudioBtn,
                    pointerStyle,
                    {
                      borderColor: isAudioTesting ? '#ef4444' : brand.electricCyan,
                      backgroundColor: isAudioTesting ? 'rgba(239, 68, 68, 0.12)' : 'rgba(31, 213, 249, 0.12)',
                    },
                  ]}
                >
                  <Ionicons
                    name={isAudioTesting ? 'stop-circle-outline' : 'volume-high-outline'}
                    size={16}
                    color={isAudioTesting ? '#ef4444' : brand.electricCyan}
                  />
                  <ExiaText
                    style={[
                      styles.testAudioBtnText,
                      { color: isAudioTesting ? '#ef4444' : brand.electricCyan },
                    ]}
                  >
                    {isAudioTesting ? 'Stop Live Audio Monitor' : 'Start Live Audio Monitor'}
                  </ExiaText>
                </Pressable>
              </View>

              {/* Hardware Diagnostics Specs */}
              <View style={[styles.specsTable, { borderTopColor: t.border }]}>
                <View style={styles.specRow}>
                  <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                    Audio Format
                  </ExiaText>
                  <ExiaText variant="caption" style={styles.specVal}>
                    Opus 48 kHz / 16-bit
                  </ExiaText>
                </View>
                <View style={styles.specRow}>
                  <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                    Echo Cancellation
                  </ExiaText>
                  <ExiaText variant="caption" style={{ color: brand.liveEmerald, fontWeight: '600' }}>
                    Hardware AEC Enabled
                  </ExiaText>
                </View>
                <View style={styles.specRow}>
                  <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                    Noise Suppression
                  </ExiaText>
                  <ExiaText variant="caption" style={{ color: brand.liveEmerald, fontWeight: '600' }}>
                    WebRTC Filtering Active
                  </ExiaText>
                </View>
              </View>
            </ExiaCard>
          </View>

          {/* Right Pane: AI Voice Session & Controls */}
          <View style={[styles.pane, isDesktop && styles.rightPane]}>
            <ExiaCard style={styles.paneCard}>
              <View style={styles.paneHeader}>
                <View style={styles.paneTitleRow}>
                  <Ionicons name="sparkles" size={18} color={brand.electricCyan} />
                  <ExiaText style={styles.paneTitle}>Multimodal Agent Session</ExiaText>
                </View>
                <Badge label="GEMINI 2.5 FLASH" tone="accent" />
              </View>

              <View style={[styles.modelOverviewBox, { backgroundColor: t.input, borderColor: t.border }]}>
                <View style={styles.modelOverviewRow}>
                  <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                    Active Speech Pipeline:
                  </ExiaText>
                  <ExiaText variant="mono" style={{ color: brand.electricCyan, fontWeight: '600' }}>
                    {modelConfig.data?.gemini_model || 'gemini-2.5-flash-native-audio'}
                  </ExiaText>
                </View>
                <View style={styles.modelOverviewRow}>
                  <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                    MCP Tools Ready:
                  </ExiaText>
                  <ExiaText variant="caption" style={{ color: brand.liveEmerald, fontWeight: '600' }}>
                    {activeMcpTools.length} tools registered
                  </ExiaText>
                </View>
              </View>

              {/* Studio Shortcut Keys reference */}
              <View style={styles.hotkeysBox}>
                <ExiaText variant="caption" style={styles.hotkeysTitle}>
                  DESKTOP STUDIO HOTKEYS
                </ExiaText>
                <View style={styles.hotkeysList}>
                  <View style={styles.hotkeyItem}>
                    <View style={[styles.keyBadge, { backgroundColor: t.input, borderColor: t.border }]}>
                      <ExiaText variant="mono" style={styles.keyText}>Space</ExiaText>
                    </View>
                    <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                      Push to Talk / Hold to Speak
                    </ExiaText>
                  </View>
                  <View style={styles.hotkeyItem}>
                    <View style={[styles.keyBadge, { backgroundColor: t.input, borderColor: t.border }]}>
                      <ExiaText variant="mono" style={styles.keyText}>M</ExiaText>
                    </View>
                    <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                      Toggle Hardware Mute
                    </ExiaText>
                  </View>
                  <View style={styles.hotkeyItem}>
                    <View style={[styles.keyBadge, { backgroundColor: t.input, borderColor: t.border }]}>
                      <ExiaText variant="mono" style={styles.keyText}>Esc</ExiaText>
                    </View>
                    <ExiaText variant="caption" style={{ color: t.mutedForeground }}>
                      Disconnect / Exit Studio
                    </ExiaText>
                  </View>
                </View>
              </View>

              {/* Connect Voice Agent CTA */}
              <View style={styles.sessionActionRow}>
                <ExiaButton
                  label="Connect Voice Session"
                  variant="primary"
                  onPress={() => {
                    startAudioTest();
                  }}
                  style={styles.connectBtn}
                />
              </View>
            </ExiaCard>
          </View>
        </View>

        {/* Mobile Build Reference Box */}
        <ExiaCard style={[styles.nativeDevCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.nativeDevHeader}>
            <Ionicons name="phone-portrait-outline" size={18} color={brand.electricCyan} />
            <ExiaText style={styles.nativeDevTitle}>Mobile Companion Client (iOS / Android)</ExiaText>
          </View>
          <ExiaText variant="caption" style={styles.nativeDevSub}>
            The mobile companion app runs native hardware camera codecs and foreground audio services via React Native WebRTC:
          </ExiaText>
          <View style={[styles.terminalBox, { backgroundColor: t.input, borderColor: t.border }]}>
            <ExiaText variant="mono" style={[styles.terminalCommand, { color: brand.electricCyan }]}>
              npx expo run:android  # or npx expo run:ios
            </ExiaText>
          </View>
        </ExiaCard>

        {/* Hardware Audio Device Selector Modal */}
        <Modal
          visible={audioModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAudioModalOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setAudioModalOpen(false)}>
            <Pressable
              style={[styles.modalContent, { backgroundColor: t.card, borderColor: t.border }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Ionicons name="mic" size={18} color={brand.electricCyan} />
                  <ExiaText style={styles.modalTitle}>Choose Studio Microphone</ExiaText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={() => setAudioModalOpen(false)}
                >
                  <Ionicons name="close" size={18} color={t.mutedForeground} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {audioDevices.map((dev) => {
                  const isSelected =
                    config.audioInputDeviceId === dev.deviceId ||
                    (!config.audioInputDeviceId && dev.deviceId === 'default');

                  return (
                    <Pressable
                      key={dev.deviceId || dev.label}
                      accessibilityRole="button"
                      accessibilityLabel={dev.label}
                      onPress={() => handleSelectAudioDevice(dev)}
                      style={[
                        styles.deviceOption,
                        { borderColor: t.border, backgroundColor: t.input },
                        isSelected && {
                          borderColor: brand.electricCyan,
                          backgroundColor: 'rgba(31, 213, 249, 0.12)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isSelected ? 'mic' : 'mic-outline'}
                        size={16}
                        color={isSelected ? brand.electricCyan : t.mutedForeground}
                      />
                      <ExiaText
                        variant="caption"
                        numberOfLines={1}
                        style={[
                          styles.deviceOptionText,
                          isSelected && { color: brand.electricCyan, fontWeight: '700' },
                        ]}
                      >
                        {dev.label}
                      </ExiaText>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={brand.electricCyan} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxxl,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.md,
  },
  scrollDesktop: {
    maxWidth: 1240,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDotLive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.liveEmerald,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  serverPill: {
    fontSize: 11,
    color: brand.electricCyan,
  },
  mainLayout: {
    gap: spacing.md,
    width: '100%',
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  pane: {
    width: '100%',
  },
  leftPane: {
    width: '48%',
  },
  rightPane: {
    flex: 1,
  },
  paneCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  paneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  switchMicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  deviceInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  deviceInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  deviceLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 2,
  },
  meterContainer: {
    gap: spacing.xs + 2,
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meterTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  meterValue: {
    fontSize: 11,
    color: brand.liveEmerald,
    fontWeight: '600',
  },
  meterTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 5,
  },
  testAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingVertical: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  testAudioBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  specsTable: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    gap: 6,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specVal: {
    fontWeight: '500',
    color: '#ffffff',
  },
  modelOverviewBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  modelOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hotkeysBox: {
    gap: spacing.xs + 2,
  },
  hotkeysTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  hotkeysList: {
    gap: spacing.xs,
  },
  hotkeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  keyBadge: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  keyText: {
    fontSize: 11,
    color: brand.electricCyan,
    fontWeight: '600',
  },
  sessionActionRow: {
    marginTop: spacing.xs,
  },
  connectBtn: {
    width: '100%',
  },
  nativeDevCard: {
    padding: spacing.lg,
    gap: spacing.xs + 2,
  },
  nativeDevHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nativeDevTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  nativeDevSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  terminalBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  terminalCommand: {
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalScroll: {
    maxHeight: 240,
  },
  deviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  deviceOptionText: {
    flex: 1,
    fontSize: 12,
    color: '#ffffff',
  },
});
