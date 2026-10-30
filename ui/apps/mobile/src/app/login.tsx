import { useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';

import { ApiError } from '@exia/api-client';
import { radius, spacing, typography } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { api, tokenStorage } from '@/lib/api';

/**
 * Sign-in screen — first ported screen (Milestone 3 of ui/README.md).
 * Talks to the FastAPI backend through the shared @exia/api-client and
 * stores the session token in the app's token-storage adapter.
 */
export default function Login() {
  const t = useTheme();
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
        <View style={styles.header}>
          <ExiaText variant="title">Sign in</ExiaText>
          <ExiaText variant="caption">Your private home AI assistant</ExiaText>
        </View>

        <ExiaCard>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={t.mutedForeground}
            style={[styles.input, { backgroundColor: t.input, borderColor: t.border, color: t.foreground }]}
            value={email}
          />
          <TextInput
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setPassword}
            onSubmitEditing={handleSignIn}
            placeholder="Password"
            placeholderTextColor={t.mutedForeground}
            secureTextEntry
            style={[styles.input, { backgroundColor: t.input, borderColor: t.border, color: t.foreground }]}
            value={password}
          />

          {error ? (
            <RNText accessibilityRole="alert" style={[styles.error, { color: t.destructive }]}>
              {error}
            </RNText>
          ) : null}

          <ExiaButton
            disabled={!canSubmit}
            label={submitting ? 'Signing in…' : 'Sign in'}
            onPress={handleSignIn}
          />
          {submitting ? <ActivityIndicator style={styles.spinner} /> : null}
        </ExiaCard>
      </KeyboardAvoidingView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: spacing.xs, marginBottom: spacing.xl },
  input: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: typography.fontSizes.base,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  error: { fontSize: typography.fontSizes.sm, marginBottom: spacing.md },
  spinner: { marginTop: spacing.md },
});
