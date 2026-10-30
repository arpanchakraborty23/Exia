/**
 * @exia/shared-ui
 *
 * Portable primitives built ONLY on React Native components (View, Text,
 * Pressable) — no HTML elements, no CSS. Web-only styling belongs in the
 * web layer. Accessibility (labels, roles, hit targets) is mandatory.
 */

import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text as RNText,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography, type ThemeMode } from '@exia/design-tokens';

export function useTheme(mode: ThemeMode = 'dark') {
  return colors[mode];
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export interface ExiaTextProps extends TextProps {
  mode?: ThemeMode;
  variant?: 'title' | 'body' | 'caption' | 'mono';
}

export function ExiaText({ mode = 'dark', variant = 'body', style, ...rest }: ExiaTextProps) {
  const t = colors[mode];
  const variantStyle: TextStyle =
    variant === 'title'
      ? { fontSize: typography.fontSizes.xl, fontWeight: '600' }
      : variant === 'caption'
        ? { fontSize: typography.fontSizes.xs, color: t.mutedForeground }
        : variant === 'mono'
          ? { fontSize: typography.fontSizes.sm, fontVariant: ['tabular-nums'] }
          : { fontSize: typography.fontSizes.base };

  return <RNText {...rest} style={[{ color: t.foreground }, variantStyle, style]} />;
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export interface ExiaButtonProps extends PressableProps {
  mode?: ThemeMode;
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export function ExiaButton({
  mode = 'dark',
  label,
  variant = 'primary',
  disabled,
  onPress,
  style,
  ...rest
}: ExiaButtonProps) {
  const t = colors[mode];
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const bg =
    variant === 'destructive'
      ? t.destructive
      : variant === 'secondary'
        ? t.secondary
        : t.primary;
  const fg =
    variant === 'secondary'
      ? t.secondaryForeground
      : variant === 'destructive'
        ? t.destructiveForeground
        : t.primaryForeground;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          minHeight: 44, // touch-target minimum
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : hovered && !disabled ? 0.92 : 1,
          borderWidth: focused ? 2 : 0,
          borderColor: focused ? t.ring : 'transparent',
        },
        style as ViewStyle,
      ]}
    >
      <RNText style={{ color: fg, fontSize: typography.fontSizes.base, fontWeight: '500' }}>
        {label}
      </RNText>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen (page canvas)
// ---------------------------------------------------------------------------

export interface ExiaScreenProps {
  mode?: ThemeMode;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ExiaScreen({ mode = 'dark', children, style }: ExiaScreenProps) {
  const t = colors[mode];
  return (
    <View style={[{ flex: 1, backgroundColor: t.background, padding: spacing.lg }, style]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Card (elevated surface)
// ---------------------------------------------------------------------------

export interface ExiaCardProps {
  mode?: ThemeMode;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ExiaCard({ mode = 'dark', children, style }: ExiaCardProps) {
  const t = colors[mode];
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.border,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
