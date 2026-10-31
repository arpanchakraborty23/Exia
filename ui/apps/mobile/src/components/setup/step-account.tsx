import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ApiError } from '@exia/api-client';
import { ExiaButton, ExiaCard, ExiaInput, ExiaText, useTheme } from '@exia/shared-ui';

import { Badge, ExiaAvatar, Field, Segmented } from '@/components/ui';
import { api, tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY, useAuthToken } from '@/lib/auth';
import type { DesktopSetupConfig } from '@/lib/desktop-config';

export interface StepAccountProps {
  config: DesktopSetupConfig;
  onChangeConfig: (partial: Partial<DesktopSetupConfig>) => void;
}

export function StepAccount({ config, onChangeConfig }: StepAccountProps) {
  const t = useTheme();
  const queryClient = useQueryClient();
  const { data: existingToken } = useAuthToken();

  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'local'>(
    config.localMode ? 'local' : 'signin',
  );

  const [email, setEmail] = useState(config.userEmail || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(config.userName || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.auth.login(email.trim(), password);
      await tokenStorage.setToken(res.access_token);
      queryClient.setQueryData(AUTH_TOKEN_KEY, res.access_token);

      const userEmail = res.user?.email || email.trim();
      const userName = res.user?.name || name.trim() || 'Exia User';

      onChangeConfig({
        localMode: false,
        userEmail,
        userName,
      });

      setSuccessMessage(`Signed in as ${userEmail}`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : 'Authentication failed. Please check credentials or backend availability.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) return;
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.auth.register(name.trim(), email.trim(), password);
      const token = res.access_token || 'authenticated';
      await tokenStorage.setToken(token);
      queryClient.setQueryData(AUTH_TOKEN_KEY, token);

      const userEmail = res.user?.email || email.trim();
      const userName = res.user?.name || name.trim();

      onChangeConfig({
        localMode: false,
        userEmail,
        userName,
      });

      setSuccessMessage(`Account created successfully for ${userName}`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : 'Account creation failed. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnableLocalMode = async () => {
    // Local standalone mode sets a placeholder token so the app bypasses cloud login gates
    const localToken = 'exia-local-mode-token';
    await tokenStorage.setToken(localToken);
    queryClient.setQueryData(AUTH_TOKEN_KEY, localToken);

    onChangeConfig({
      localMode: true,
      userEmail: 'local@exia.desktop',
      userName: 'Local Operator',
    });

    setSuccessMessage('Local Standalone Mode activated (offline / self-hosted)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ExiaText variant="title">Account & Security</ExiaText>
        <ExiaText variant="caption">
          Sign in to sync your prompts, tool integrations, and telemetry, or proceed in offline Local Mode.
        </ExiaText>
      </View>

      {/* Segmented Mode Selector */}
      <Segmented
        options={['signin', 'register', 'local'] as const}
        labels={{
          signin: 'Sign In',
          register: 'Register',
          local: 'Local Mode',
        }}
        value={authMode}
        onChange={(mode) => {
          setAuthMode(mode);
          setError(null);
          setSuccessMessage(null);
        }}
      />

      {error ? (
        <View
          style={[
            styles.banner,
            { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: t.destructive },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={16} color={t.destructive} />
          <ExiaText variant="caption" style={{ color: t.destructive, flex: 1 }}>
            {error}
          </ExiaText>
        </View>
      ) : null}

      {successMessage ? (
        <View
          style={[
            styles.banner,
            { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: brand.liveEmerald },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color={brand.liveEmerald} />
          <ExiaText variant="caption" style={{ color: brand.liveEmerald, flex: 1 }}>
            {successMessage}
          </ExiaText>
        </View>
      ) : null}

      {authMode === 'signin' ? (
        <ExiaCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="log-in-outline" size={18} color={brand.electricCyan} />
            <ExiaText style={styles.cardTitle}>Sign In to Exia</ExiaText>
          </View>

          <Field label="Email Address">
            <ExiaInput
              value={email}
              onChangeText={setEmail}
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </Field>

          <Field label="Password">
            <ExiaInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={handleSignIn}
            />
          </Field>

          <ExiaButton
            label={submitting ? 'Authenticating…' : 'Sign In'}
            disabled={submitting || !email.trim() || !password}
            onPress={handleSignIn}
          />
        </ExiaCard>
      ) : null}

      {authMode === 'register' ? (
        <ExiaCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-add-outline" size={18} color={brand.electricCyan} />
            <ExiaText style={styles.cardTitle}>Create New Account</ExiaText>
          </View>

          <Field label="Full Name">
            <ExiaInput
              value={name}
              onChangeText={setName}
              placeholder="Operator"
              autoCapitalize="words"
            />
          </Field>

          <Field label="Email Address">
            <ExiaInput
              value={email}
              onChangeText={setEmail}
              placeholder="user@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          <Field label="Password">
            <ExiaInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={handleRegister}
            />
          </Field>

          <ExiaButton
            label={submitting ? 'Creating Account…' : 'Create Account'}
            disabled={submitting || !name.trim() || !email.trim() || !password}
            onPress={handleRegister}
          />
        </ExiaCard>
      ) : null}

      {authMode === 'local' ? (
        <ExiaCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="laptop-outline" size={18} color={brand.liveEmerald} />
            <ExiaText style={styles.cardTitle}>Local Standalone Mode</ExiaText>
          </View>

          <ExiaText variant="caption">
            Run Exia without signing in to a cloud account. Perfect for fully air-gapped, local Ollama, or private self-hosted setups.
          </ExiaText>

          <View style={[styles.localBenefits, { backgroundColor: t.input, borderColor: t.border }]}>
            <View style={styles.benefitRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={brand.liveEmerald} />
              <ExiaText variant="caption" style={styles.benefitText}>
                No cloud account or external authentication required
              </ExiaText>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="lock-closed-outline" size={16} color={brand.liveEmerald} />
              <ExiaText variant="caption" style={styles.benefitText}>
                Session data and MCP configurations stay strictly on your local disk
              </ExiaText>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="swap-horizontal-outline" size={16} color={brand.liveEmerald} />
              <ExiaText variant="caption" style={styles.benefitText}>
                Easily connect to a cloud account anytime from Settings
              </ExiaText>
            </View>
          </View>

          <ExiaButton
            label="Activate Local Mode"
            variant="secondary"
            onPress={handleEnableLocalMode}
          />
        </ExiaCard>
      ) : null}

      {existingToken ? (
        <View style={[styles.signedInBox, { backgroundColor: t.card, borderColor: t.border }]}>
          <ExiaAvatar size={36} />
          <View style={styles.signedInInfo}>
            <ExiaText style={styles.signedInTitle}>Currently Signed In</ExiaText>
            <ExiaText variant="caption">
              {config.localMode ? 'Local Mode Active' : config.userEmail || 'Active Session Token'}
            </ExiaText>
          </View>
          <Badge label="Authenticated" tone="accent" />
        </View>
      ) : null}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  localBenefits: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    flex: 1,
  },
  signedInBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  signedInInfo: {
    flex: 1,
    gap: 2,
  },
  signedInTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
});
