/**
 * App-level UI helpers built on @exia/shared-ui primitives and design tokens.
 * Non-route code lives outside src/app/ (AGENTS.md rule).
 */
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import {
  ExiaBadge,
  type ExiaBadgeProps,
  type ExiaBadgeTone,
  ExiaButton,
  ExiaCard,
  ExiaInput,
  type ExiaInputProps,
  ExiaText,
  useTheme,
} from '@exia/shared-ui';

export { ExiaInput, type ExiaInputProps };
export { ExiaBadge, type ExiaBadgeProps, type ExiaBadgeTone };
export type BadgeTone = ExiaBadgeTone;
export const Badge = ExiaBadge;

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
        {subtitle ? (
          <ExiaText variant="caption" style={styles.headerSubtitle}>
            {subtitle}
          </ExiaText>
        ) : null}
      </View>
    </View>
  );
}



// ---------------------------------------------------------------------------
// Loading / empty / error states (every screen has all four)
// ---------------------------------------------------------------------------

export function Skeleton({
  width,
  height = 16,
  borderRadius = radius.md,
  style,
}: {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const [opacity] = React.useState(() => new Animated.Value(0.3));

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          backgroundColor: t.muted,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({
  lines = 3,
  style,
}: {
  lines?: number;
  style?: ViewStyle;
}) {
  return (
    <ExiaCard style={[styles.skeletonCard, style]}>
      <Skeleton width="45%" height={18} />
      <Skeleton width="90%" height={14} />
      {lines > 2 ? <Skeleton width="65%" height={14} /> : null}
    </ExiaCard>
  );
}

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
// Segmented control (form primitive)
// ---------------------------------------------------------------------------

export interface SegmentedProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  labels?: Partial<Record<T, string>>;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  labels,
}: SegmentedProps<T>) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 380 && options.length > 3;

  const content = options.map((option) => {
    const active = option === value;
    const displayLabel = labels?.[option] ?? option;
    return (
      <Pressable
        key={option}
        accessibilityRole="radio"
        accessibilityLabel={`${accessibilityLabel ?? 'Option'}: ${displayLabel}`}
        accessibilityState={{ selected: active }}
        onPress={() => onChange(option)}
        style={({ pressed }) => [
          styles.segmentItem,
          !isCompact && styles.segmentItemFlex,
          active && {
            backgroundColor: t.primary,
            shadowColor: t.primary,
            shadowOpacity: 0.25,
            shadowRadius: 3,
            elevation: 2,
          },
          { opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <ExiaText
          numberOfLines={1}
          style={[
            styles.segmentText,
            {
              color: active ? t.primaryForeground : t.mutedForeground,
              fontWeight: active ? '600' : '500',
            },
          ]}
        >
          {displayLabel}
        </ExiaText>
      </Pressable>
    );
  });

  if (isCompact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.segmentedTrack, { backgroundColor: t.input, borderColor: t.border }]}
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.segmentedTrack, { backgroundColor: t.input, borderColor: t.border }]}
    >
      {content}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Brand avatar (login/register identity block — ported from the legacy login)
// ---------------------------------------------------------------------------

export function ExiaAvatar({ size = 64 }: { size?: number }) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Exia"
      style={styles.avatarWrap}
    >
      <View
        style={[
          styles.avatarFrame,
          {
            borderColor: t.border,
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.3),
          },
        ]}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={styles.avatarImage}
        />
      </View>
      {/* Online status indicator (liveEmerald — live status only) */}
      <View
        style={[
          styles.avatarDot,
          {
            borderColor: t.background,
            width: Math.max(10, size * 0.22),
            height: Math.max(10, size * 0.22),
          },
        ]}
      />
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
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl },
  centeredCaption: { textAlign: 'center' },
  skeletonCard: { gap: spacing.sm, padding: spacing.lg, marginVertical: spacing.xs },
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
  segmentedTrack: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    alignItems: 'center',
    gap: 3,
  },
  segmentItem: {
    minHeight: 36,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemFlex: {
    flex: 1,
  },
  segmentText: {
    fontSize: 12,
    textAlign: 'center',
  },
  segmented: { flexDirection: 'row', gap: spacing.sm },
  segmentOption: { flex: 1 },
  segmentButton: { minHeight: 40, paddingVertical: spacing.sm },
  avatarWrap: { alignSelf: 'center', marginBottom: spacing.lg },
  avatarFrame: {
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 64,
  },
  avatarImage: { height: '100%', width: '100%' },
  avatarDot: {
    backgroundColor: brand.liveEmerald,
    borderColor: '#090909', // dark background ring
    borderRadius: radius.full,
    borderWidth: 2,
    bottom: -2,
    position: 'absolute',
    right: -2,
  },
});
