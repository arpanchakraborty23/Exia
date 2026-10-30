import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@exia/api-client';
import { spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { api, tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY } from '@/lib/auth';
import { ExiaAvatar, ExiaInput, Field } from '@/components/ui';

/**
 * Account creation screen — POSTs to the backend's /auth/create-account,
 * which returns an access token (auto sign-in on success).
 * Route: /register (modal)
 */
export default function Register() {
  const t = useTheme();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleCreateAccount() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.auth.register(name.trim(), email.trim(), password);
      if (res.access_token) {
        await tokenStorage.setToken(res.access_token);
        queryClient.setQueryData(AUTH_TOKEN_KEY, res.access_token);
        router.replace('/');
      } else {
        // Account created without a session token — go sign in.
        router.replace('/login');
      }
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : 'Account creation failed — is the backend running?',
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
        <View style={styles.header}>
          <ExiaAvatar />
          <ExiaText variant="title">Create account</ExiaText>
          <ExiaText variant="caption">Register a new operator profile for your system</ExiaText>
        </View>

        <ExiaCard>
          <Field label="Name">
            <ExiaInput
              accessibilityLabel="Name"
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={t.mutedForeground}
              value={name}
            />
          </Field>
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
              autoComplete="new-password"
              onChangeText={setPassword}
              onSubmitEditing={handleCreateAccount}
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
            label={submitting ? 'Creating account…' : 'Create account'}
            onPress={handleCreateAccount}
          />
        </ExiaCard>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to sign in"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.signInLink}
        >
          <ExiaText variant="caption">Already have an account? Sign in</ExiaText>
        </Pressable>
      </KeyboardAvoidingView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, marginTop: spacing.xxxl },
  header: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xl },
  error: { marginBottom: spacing.md },
  signInLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
});
