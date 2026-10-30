import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { ApiError } from '@exia/api-client';
import { spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { api, tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY } from '@/lib/auth';
import { ExiaInput, Field } from '@/components/ui';

/**
 * Sign-in screen — first ported screen (Milestone 3 of ui/README.md).
 * Talks to the FastAPI backend through the shared @exia/api-client and
 * stores the session token in the app's token-storage adapter.
 * Route: /login (modal)
 */
export default function Login() {
  const t = useTheme();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSignIn() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.auth.login(email.trim(), password);
      await tokenStorage.setToken(res.access_token);
      // Seed the auth cache so the gate mounts the tabs, then navigate.
      queryClient.setQueryData(AUTH_TOKEN_KEY, res.access_token);
      router.replace('/');
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : 'Sign-in failed — is the backend running?',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ExiaScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ExiaText variant="title">Sign in</ExiaText>
        <ExiaText variant="caption" style={styles.subtitle}>
          Your private home AI assistant
        </ExiaText>

        <ExiaCard>
          <Field label="Email">
            <ExiaInput
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={t.mutedForeground}
              value={email}
            />
          </Field>
          <Field label="Password">
            <ExiaInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={setPassword}
              onSubmitEditing={handleSignIn}
              placeholder="Password"
              placeholderTextColor={t.mutedForeground}
              secureTextEntry
              value={password}
            />
          </Field>

          {error ? (
            <ExiaText accessibilityRole="alert" style={[styles.error, { color: t.destructive }]}>
              {error}
            </ExiaText>
          ) : null}

          <ExiaButton
            disabled={!canSubmit}
            label={submitting ? 'Signing in…' : 'Sign in'}
            onPress={handleSignIn}
          />
        </ExiaCard>
      </KeyboardAvoidingView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, marginTop: spacing.xxxl },
  subtitle: { marginBottom: spacing.xl },
  error: { marginBottom: spacing.md },
});
