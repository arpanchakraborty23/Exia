import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaInput, ExiaText, useTheme } from '@exia/shared-ui';

import { Badge, Field } from '@/components/ui';
import {
  DEFAULT_CLOUD_API_URL,
  DEFAULT_LOCAL_API_URL,
  type DesktopSetupConfig,
} from '@/lib/desktop-config';
import { setApiBaseUrl } from '@/lib/api';

export interface StepBackendUrlProps {
  config: DesktopSetupConfig;
  onChangeConfig: (partial: Partial<DesktopSetupConfig>) => void;
}

export function StepBackendUrl({ config, onChangeConfig }: StepBackendUrlProps) {
  const t = useTheme();

  const [customUrl, setCustomUrl] = useState(
    config.environmentType === 'custom' ? config.apiUrl : '',
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    latencyMs?: number;
    message?: string;
    target?: string;
  }>({ status: 'idle' });

  const activeUrl =
    config.environmentType === 'cloud'
      ? DEFAULT_CLOUD_API_URL
      : config.environmentType === 'local'
        ? DEFAULT_LOCAL_API_URL
        : customUrl.trim();

  const handleSelectPreset = (env: 'cloud' | 'local' | 'custom') => {
    let url = DEFAULT_CLOUD_API_URL;
    if (env === 'local') url = DEFAULT_LOCAL_API_URL;
    if (env === 'custom') url = customUrl || 'http://127.0.0.1:8000/api';

    onChangeConfig({
      environmentType: env,
      apiUrl: url,
    });
    setApiBaseUrl(url);
    setTestResult({ status: 'idle' });
  };

  const handleCustomUrlChange = (text: string) => {
    setCustomUrl(text);
    if (config.environmentType === 'custom') {
      onChangeConfig({ apiUrl: text });
      setApiBaseUrl(text);
    }
  };

  const handlePingHealth = async () => {
    setTesting(true);
    setTestResult({ status: 'idle' });
    const targetUrl = activeUrl.replace(/\/+$/, '');
    const healthUrl = `${targetUrl}/health`;

    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(healthUrl, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      const latencyMs = Math.round(Date.now() - start);

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        setTestResult({
          status: 'success',
          latencyMs,
          message: `Server returned status 200 OK (${json.status || 'healthy'})`,
          target: json.target || targetUrl,
        });
        onChangeConfig({
          lastHealthCheck: {
            status: 'ok',
            latencyMs,
            testedAt: new Date().toISOString(),
            target: targetUrl,
          },
        });
      } else {
        setTestResult({
          status: 'error',
          latencyMs,
          message: `Server responded with HTTP ${res.status}: ${res.statusText}`,
        });
      }
    } catch (err: unknown) {
      const latencyMs = Math.round(Date.now() - start);
      const isAbort = (err as Error)?.name === 'AbortError';
      setTestResult({
        status: 'error',
        latencyMs,
        message: isAbort
          ? 'Connection timed out after 4.5 seconds'
          : `Failed to connect to ${targetUrl}. Is the backend running?`,
      });
      onChangeConfig({
        lastHealthCheck: {
          status: 'error',
          latencyMs,
          testedAt: new Date().toISOString(),
          target: targetUrl,
        },
      });
    } finally {
      clearTimeout(timeout);
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ExiaText variant="title">Backend API Gateway</ExiaText>
        <ExiaText variant="caption">
          Select or customize the endpoint Exia uses for sessions, prompts, MCP tools, and auth.
        </ExiaText>
      </View>

      {/* Preset 1: Official Cloud */}
      <Pressable
        accessibilityRole="button"
        onPress={() => handleSelectPreset('cloud')}
        style={[
          styles.presetCard,
          {
            backgroundColor: t.card,
            borderColor: config.environmentType === 'cloud' ? brand.electricCyan : t.border,
          },
        ]}
      >
        <View style={styles.presetHeader}>
          <View style={styles.radioRow}>
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor: config.environmentType === 'cloud' ? brand.electricCyan : t.border,
                },
              ]}
            >
              {config.environmentType === 'cloud' ? (
                <View style={[styles.radioDot, { backgroundColor: brand.electricCyan }]} />
              ) : null}
            </View>
            <View>
              <ExiaText style={styles.presetTitle}>Cloud Production Backend</ExiaText>
              <ExiaText variant="mono" style={styles.presetUrl}>
                {DEFAULT_CLOUD_API_URL}
              </ExiaText>
            </View>
          </View>
          <Badge label="Cloud · Default" tone="accent" />
        </View>
        <ExiaText variant="caption">
          Fully managed, globally distributed Vercel serverless gateway with zero setup.
        </ExiaText>
      </Pressable>

      {/* Preset 2: Localhost Backend */}
      <Pressable
        accessibilityRole="button"
        onPress={() => handleSelectPreset('local')}
        style={[
          styles.presetCard,
          {
            backgroundColor: t.card,
            borderColor: config.environmentType === 'local' ? brand.electricCyan : t.border,
          },
        ]}
      >
        <View style={styles.presetHeader}>
          <View style={styles.radioRow}>
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor: config.environmentType === 'local' ? brand.electricCyan : t.border,
                },
              ]}
            >
              {config.environmentType === 'local' ? (
                <View style={[styles.radioDot, { backgroundColor: brand.electricCyan }]} />
              ) : null}
            </View>
            <View>
              <ExiaText style={styles.presetTitle}>Local Development Backend</ExiaText>
              <ExiaText variant="mono" style={styles.presetUrl}>
                {DEFAULT_LOCAL_API_URL}
              </ExiaText>
            </View>
          </View>
          <Badge label="FastAPI · Port 8000" tone="neutral" />
        </View>
        <ExiaText variant="caption">
          Local Python FastAPI backend running on your machine (backend/src/main.py).
        </ExiaText>
      </Pressable>

      {/* Preset 3: Custom Endpoint */}
      <Pressable
        accessibilityRole="button"
        onPress={() => handleSelectPreset('custom')}
        style={[
          styles.presetCard,
          {
            backgroundColor: t.card,
            borderColor: config.environmentType === 'custom' ? brand.electricCyan : t.border,
          },
        ]}
      >
        <View style={styles.presetHeader}>
          <View style={styles.radioRow}>
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor: config.environmentType === 'custom' ? brand.electricCyan : t.border,
                },
              ]}
            >
              {config.environmentType === 'custom' ? (
                <View style={[styles.radioDot, { backgroundColor: brand.electricCyan }]} />
              ) : null}
            </View>
            <ExiaText style={styles.presetTitle}>Custom Self-Hosted Server</ExiaText>
          </View>
          <Badge label="LAN / VPS" tone="neutral" />
        </View>

        {config.environmentType === 'custom' ? (
          <View style={styles.customInputWrap}>
            <Field label="Custom API URL (include /api suffix)">
              <ExiaInput
                value={customUrl}
                onChangeText={handleCustomUrlChange}
                placeholder="http://192.168.1.100:8000/api"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>
          </View>
        ) : null}
      </Pressable>

      {/* Connection Test Card */}
      <ExiaCard style={styles.testCard}>
        <View style={styles.testHeaderRow}>
          <View style={styles.testHeaderLeft}>
            <Ionicons name="pulse-outline" size={18} color={brand.electricCyan} />
            <ExiaText style={styles.testCardTitle}>Health Check & Test Ping</ExiaText>
          </View>
          <ExiaButton
            label={testing ? 'Testing…' : 'Test Connection'}
            size="sm"
            variant="secondary"
            disabled={testing || !activeUrl}
            onPress={handlePingHealth}
          />
        </View>

        <View style={[styles.targetBox, { backgroundColor: t.input, borderColor: t.border }]}>
          <ExiaText variant="caption">Target Endpoint:</ExiaText>
          <ExiaText variant="mono" style={styles.targetUrl}>
            {activeUrl || 'None specified'}
          </ExiaText>
        </View>

        {testResult.status === 'success' ? (
          <View
            style={[
              styles.resultBanner,
              { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: brand.liveEmerald },
            ]}
          >
            <Ionicons name="checkmark-circle" size={18} color={brand.liveEmerald} />
            <View style={styles.resultText}>
              <ExiaText style={[styles.resultTitle, { color: brand.liveEmerald }]}>
                Connection Successful ({testResult.latencyMs}ms latency)
              </ExiaText>
              <ExiaText variant="caption">{testResult.message}</ExiaText>
            </View>
          </View>
        ) : null}

        {testResult.status === 'error' ? (
          <View
            style={[
              styles.resultBanner,
              { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: t.destructive },
            ]}
          >
            <Ionicons name="alert-circle" size={18} color={t.destructive} />
            <View style={styles.resultText}>
              <ExiaText style={[styles.resultTitle, { color: t.destructive }]}>
                Unable to Reach Server ({testResult.latencyMs}ms)
              </ExiaText>
              <ExiaText variant="caption">{testResult.message}</ExiaText>
              {config.environmentType === 'local' ? (
                <ExiaText variant="caption" style={styles.hintText}>
                  Tip: Start the local server with: uvicorn backend.src.main:app --port 8000
                </ExiaText>
              ) : null}
            </View>
          </View>
        ) : null}
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
  customInputWrap: {
    marginTop: spacing.sm,
  },
  testCard: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  testHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  testCardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  targetBox: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  targetUrl: {
    fontSize: 12,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  resultText: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  hintText: {
    marginTop: 4,
    fontStyle: 'italic',
  },
});
