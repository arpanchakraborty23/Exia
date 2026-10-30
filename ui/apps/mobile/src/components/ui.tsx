/**
 * App-level UI helpers built on @exia/shared-ui primitives and design tokens.
 * Non-route code lives outside src/app/ (AGENTS.md rule).
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaText, useTheme } from '@exia/shared-ui';

// ---------------------------------------------------------------------------
// Screen header (title + optional back)
// ---------------------------------------------------------------------------

export function ScreenHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={t.foreground} />
        </Pressable>
      ) : null}
      <View style={styles.headerText}>
        <ExiaText variant="title">{title}</ExiaText>
        {subtitle ? <ExiaText variant="caption">{subtitle}</ExiaText> : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

export type BadgeTone = 'ok' | 'muted' | 'warn' | 'info';

export function Badge({ label, tone = 'muted' }: { label: string; tone?: BadgeTone }) {
  const t = useTheme();
  const palette: Record<BadgeTone, { bg: string; fg: string }> = {
    ok: { bg: 'rgba(16, 185, 129, 0.16)', fg: '#10b981' }, // liveEmerald — live status only
    muted: { bg: t.muted, fg: t.mutedForeground },
    warn: { bg: 'rgba(245, 158, 11, 0.16)', fg: '#f59e0b' },
    info: { bg: 'rgba(31, 213, 249, 0.16)', fg: t.primary },
  };
  const colors = palette[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <ExiaText style={{ color: colors.fg, fontSize: 11, fontWeight: '600' }}>{label}</ExiaText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Loading / empty / error states (every screen has all four)
// ---------------------------------------------------------------------------

export function Loading({ label = 'Loading…' }: { label?: string }) {
  const t = useTheme();
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={t.primary} />
      <ExiaText variant="caption" style={styles.centeredCaption}>
        {label}
      </ExiaText>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <ExiaCard style={styles.stateCard}>
      <ExiaText style={styles.stateTitle}>{title}</ExiaText>
      <ExiaText variant="caption" style={styles.stateMessage}>
        {message}
      </ExiaText>
      {actionLabel && onAction ? (
        <ExiaButton label={actionLabel} onPress={onAction} style={styles.stateAction} />
      ) : null}
    </ExiaCard>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTheme();
  return (
    <ExiaCard style={styles.stateCard}>
      <Ionicons name="cloud-offline-outline" size={28} color={t.destructive} />
      <ExiaText style={styles.stateTitle}>Something went wrong</ExiaText>
      <ExiaText variant="caption" style={styles.stateMessage}>
        {message}
      </ExiaText>
      <ExiaButton label="Retry" variant="secondary" onPress={onRetry} style={styles.stateAction} />
    </ExiaCard>
  );
}

// ---------------------------------------------------------------------------
// Form field wrapper
// ---------------------------------------------------------------------------

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ExiaText variant="caption">{label}</ExiaText>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Two-tap delete confirm (Alert.alert buttons don't work on web)
// ---------------------------------------------------------------------------

export function DeleteButton({ onPress, label = 'Delete' }: { onPress: () => void; label?: string }) {
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(id);
  }, [confirming]);

  return (
    <ExiaButton
      accessibilityLabel={confirming ? 'Confirm delete' : label}
      label={confirming ? 'Tap to confirm' : label}
      variant="destructive"
      onPress={() => {
        if (confirming) {
          setConfirming(false);
          onPress();
        } else {
          setConfirming(true);
        }
      }}
      style={styles.deleteButton}
    />
  );
}

// ---------------------------------------------------------------------------
// Themed text input + segmented control (form primitives)
// ---------------------------------------------------------------------------

export function ExiaInput({ style, ...rest }: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      {...rest}
      style={[
        styles.input,
        { backgroundColor: t.input, borderColor: t.border, color: t.foreground },
        style,
      ]}
    />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.segmented}
    >
      {options.map((option) => (
        <View key={option} style={styles.segmentOption}>
          <ExiaButton
            accessibilityLabel={`${accessibilityLabel ?? 'Option'}: ${option}`}
            accessibilityState={{ selected: option === value }}
            label={option}
            variant={option === value ? 'primary' : 'secondary'}
            onPress={() => onChange(option)}
            style={styles.segmentButton}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { gap: 2, flex: 1 },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl },
  centeredCaption: { textAlign: 'center' },
  stateCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  stateTitle: { fontWeight: '600' },
  stateMessage: { textAlign: 'center' },
  stateAction: { alignSelf: 'stretch', marginTop: spacing.sm },
  field: { gap: spacing.xs, marginBottom: spacing.md },
  deleteButton: { paddingVertical: spacing.sm, minHeight: 36 },
  input: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  segmented: { flexDirection: 'row', gap: spacing.sm },
  segmentOption: { flex: 1 },
  segmentButton: { minHeight: 40, paddingVertical: spacing.sm },
});
