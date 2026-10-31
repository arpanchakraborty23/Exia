/**
 * @exia/shared-ui
 *
 * Portable primitives built ONLY on React Native components (View, Text,
 * Pressable) — no HTML elements, no CSS. Web-only styling belongs in the
 * web layer. Accessibility (labels, roles, hit targets) is mandatory.
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import {
  brand,
  colors,
  getThemeTokens,
  radius,
  spacing,
  typography,
  type AccentColor,
  type ButtonRadius,
  type ButtonVariantStyle,
  type ColorTokens,
  type FontStyle,
  type ThemeMode,
} from '@exia/design-tokens';

// ---------------------------------------------------------------------------
// Theme Context & Provider
// ---------------------------------------------------------------------------

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light' | 'oled';
  accent: AccentColor;
  buttonRadius: ButtonRadius;
  buttonStyle: ButtonVariantStyle;
  fontStyle: FontStyle;
  tokens: ColorTokens;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setButtonRadius: (radius: ButtonRadius) => void;
  setButtonStyle: (style: ButtonVariantStyle) => void;
  setFontStyle: (font: FontStyle) => void;
  resetTheme: () => void;
}

const defaultThemeContext: ThemeContextValue = {
  mode: 'dark',
  resolvedMode: 'dark',
  accent: 'cyan',
  buttonRadius: 'rounded',
  buttonStyle: 'solid',
  fontStyle: 'system',
  tokens: colors.dark,
  setMode: () => {},
  setAccent: () => {},
  setButtonRadius: () => {},
  setButtonStyle: () => {},
  setFontStyle: () => {},
  resetTheme: () => {},
};

export const ThemeContext = createContext<ThemeContextValue>(defaultThemeContext);

export interface ThemeProviderProps {
  initialMode?: ThemeMode;
  initialAccent?: AccentColor;
  initialButtonRadius?: ButtonRadius;
  initialButtonStyle?: ButtonVariantStyle;
  initialFontStyle?: FontStyle;
  onPreferencesChange?: (prefs: {
    mode: ThemeMode;
    accent: AccentColor;
    buttonRadius: ButtonRadius;
    buttonStyle: ButtonVariantStyle;
    fontStyle: FontStyle;
  }) => void;
  children: React.ReactNode;
}

export function ThemeProvider({
  initialMode = 'dark',
  initialAccent = 'cyan',
  initialButtonRadius = 'rounded',
  initialButtonStyle = 'solid',
  initialFontStyle = 'system',
  onPreferencesChange,
  children,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [accent, setAccentState] = useState<AccentColor>(initialAccent);
  const [buttonRadius, setButtonRadiusState] = useState<ButtonRadius>(initialButtonRadius);
  const [buttonStyle, setButtonStyleState] = useState<ButtonVariantStyle>(initialButtonStyle);
  const [fontStyle, setFontStyleState] = useState<FontStyle>(initialFontStyle);

  const resolvedMode = useMemo<'dark' | 'light' | 'oled'>(() => {
    if (mode === 'system') return 'dark';
    return mode;
  }, [mode]);

  const tokens = useMemo<ColorTokens>(() => {
    return getThemeTokens(mode, accent);
  }, [mode, accent]);

  const notifyChange = (updates: Partial<{
    mode: ThemeMode;
    accent: AccentColor;
    buttonRadius: ButtonRadius;
    buttonStyle: ButtonVariantStyle;
    fontStyle: FontStyle;
  }>) => {
    onPreferencesChange?.({
      mode: updates.mode ?? mode,
      accent: updates.accent ?? accent,
      buttonRadius: updates.buttonRadius ?? buttonRadius,
      buttonStyle: updates.buttonStyle ?? buttonStyle,
      fontStyle: updates.fontStyle ?? fontStyle,
    });
  };

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    notifyChange({ mode: m });
  };

  const setAccent = (a: AccentColor) => {
    setAccentState(a);
    notifyChange({ accent: a });
  };

  const setButtonRadius = (r: ButtonRadius) => {
    setButtonRadiusState(r);
    notifyChange({ buttonRadius: r });
  };

  const setButtonStyle = (s: ButtonVariantStyle) => {
    setButtonStyleState(s);
    notifyChange({ buttonStyle: s });
  };

  const setFontStyle = (f: FontStyle) => {
    setFontStyleState(f);
    notifyChange({ fontStyle: f });
  };

  const resetTheme = () => {
    setModeState('dark');
    setAccentState('cyan');
    setButtonRadiusState('rounded');
    setButtonStyleState('solid');
    setFontStyleState('system');
    notifyChange({
      mode: 'dark',
      accent: 'cyan',
      buttonRadius: 'rounded',
      buttonStyle: 'solid',
      fontStyle: 'system',
    });
  };

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    resolvedMode,
    accent,
    buttonRadius,
    buttonStyle,
    fontStyle,
    tokens,
    setMode,
    setAccent,
    setButtonRadius,
    setButtonStyle,
    setFontStyle,
    resetTheme,
  }), [mode, resolvedMode, accent, buttonRadius, buttonStyle, fontStyle, tokens]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(explicitMode?: ThemeMode) {
  const ctx = useContext(ThemeContext);
  if (explicitMode) {
    const resolved = explicitMode === 'system' ? 'dark' : explicitMode;
    return colors[resolved];
  }
  return ctx.tokens;
}

export function useThemeControl() {
  return useContext(ThemeContext);
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export interface ExiaTextProps extends TextProps {
  mode?: ThemeMode;
  variant?: 'title' | 'body' | 'caption' | 'mono';
  style?: StyleProp<TextStyle>;
}

export function ExiaText({ mode, variant = 'body', style, ...rest }: ExiaTextProps) {
  const ctx = useContext(ThemeContext);
  const t = mode ? colors[mode === 'system' ? 'dark' : mode] : ctx.tokens;
  const fontStyle = ctx.fontStyle;

  const fontFamilyStyle: TextStyle =
    fontStyle === 'mono' || variant === 'mono'
      ? { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontVariant: ['tabular-nums'] }
      : fontStyle === 'rounded'
        ? { letterSpacing: 0.2 }
        : fontStyle === 'modern'
          ? { letterSpacing: -0.3 }
          : {};

  const variantStyle: TextStyle =
    variant === 'title'
      ? { fontSize: typography.fontSizes.xl, fontWeight: '600' }
      : variant === 'caption'
        ? { fontSize: typography.fontSizes.xs, color: t.mutedForeground }
        : variant === 'mono'
          ? { fontSize: typography.fontSizes.sm, fontVariant: ['tabular-nums'] }
          : { fontSize: typography.fontSizes.base };

  return <RNText {...rest} style={[{ color: t.foreground }, variantStyle, fontFamilyStyle, style]} />;
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export interface ExiaButtonProps extends PressableProps {
  mode?: ThemeMode;
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function ExiaButton({
  mode,
  label,
  variant = 'primary',
  size = 'md',
  disabled,
  onPress,
  style,
  textStyle,
  ...rest
}: ExiaButtonProps) {
  const ctx = useContext(ThemeContext);
  const t = mode ? colors[mode === 'system' ? 'dark' : mode] : ctx.tokens;
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  // Border radius based on theme control
  const borderRadius =
    ctx.buttonRadius === 'pill'
      ? radius.full
      : ctx.buttonRadius === 'sharp'
        ? 4
        : radius.md;

  const isOutline = ctx.buttonStyle === 'outline';
  const isGlass = ctx.buttonStyle === 'glass';

  let bg =
    variant === 'destructive'
      ? t.destructive
      : variant === 'secondary'
        ? t.secondary
        : t.primary;

  let fg =
    variant === 'secondary'
      ? t.secondaryForeground
      : variant === 'destructive'
        ? t.destructiveForeground
        : t.primaryForeground;

  let borderCol = 'transparent';
  let borderWidth = 0;

  if (isOutline) {
    borderWidth = 1.5;
    borderCol = bg;
    fg = bg;
    bg = 'transparent';
  } else if (isGlass) {
    borderWidth = StyleSheet.hairlineWidth;
    borderCol = bg;
    fg = variant === 'secondary' ? t.foreground : bg;
    bg = variant === 'secondary' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(31, 213, 249, 0.12)';
  }

  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const paddingH = isSm ? spacing.md : isLg ? spacing.xxl : spacing.xl;
  const paddingV = isSm ? spacing.xs + 2 : isLg ? spacing.lg : spacing.md;
  const minHeight = isSm ? 34 : isLg ? 52 : 44;
  const fontSize = isSm ? typography.fontSizes.sm : isLg ? typography.fontSizes.lg : typography.fontSizes.base;

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
          borderRadius,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          minHeight,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : hovered && !disabled ? 0.92 : 1,
          borderWidth: focused ? 2 : borderWidth,
          borderColor: focused ? t.ring : borderCol,
        },
        style as ViewStyle,
      ]}
    >
      <RNText style={[{ color: fg, fontSize, fontWeight: '500' }, textStyle]}>
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
  style?: StyleProp<ViewStyle>;
}

export function ExiaScreen({ mode, children, style }: ExiaScreenProps) {
  const ctx = useContext(ThemeContext);
  const t = mode ? colors[mode === 'system' ? 'dark' : mode] : ctx.tokens;
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
  style?: StyleProp<ViewStyle>;
}

export function ExiaCard({ mode, children, style }: ExiaCardProps) {
  const ctx = useContext(ThemeContext);
  const t = mode ? colors[mode === 'system' ? 'dark' : mode] : ctx.tokens;
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

// ---------------------------------------------------------------------------
// Input (Text field)
// ---------------------------------------------------------------------------

export interface ExiaInputProps extends TextInputProps {
  mode?: ThemeMode;
  style?: StyleProp<TextStyle>;
}

export function ExiaInput({
  mode,
  style,
  placeholderTextColor,
  selectionColor,
  onFocus,
  onBlur,
  multiline,
  ...rest
}: ExiaInputProps) {
  const ctx = useContext(ThemeContext);
  const t = mode ? colors[mode === 'system' ? 'dark' : mode] : ctx.tokens;
  const [focused, setFocused] = React.useState(false);

  const inputRadius =
    ctx.buttonRadius === 'pill'
      ? radius.xl
      : ctx.buttonRadius === 'sharp'
        ? 4
        : radius.md;

  return (
    <TextInput
      {...rest}
      multiline={multiline}
      placeholderTextColor={placeholderTextColor ?? t.mutedForeground}
      selectionColor={selectionColor ?? t.primary}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        {
          backgroundColor: t.input,
          borderColor: focused ? t.ring : t.border,
          borderWidth: focused ? 1.5 : StyleSheet.hairlineWidth,
          borderRadius: inputRadius,
          color: t.foreground,
          fontSize: typography.fontSizes.base,
          minHeight: 44, // touch-target minimum
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Badge (Status indicator)
// ---------------------------------------------------------------------------

export type ExiaBadgeTone = 'ok' | 'muted' | 'warn' | 'info';

export interface ExiaBadgeProps {
  mode?: ThemeMode;
  label: string;
  tone?: ExiaBadgeTone;
  style?: StyleProp<ViewStyle>;
}

export function ExiaBadge({
  mode,
  label,
  tone = 'muted',
  style,
}: ExiaBadgeProps) {
  const ctx = useContext(ThemeContext);
  const t = mode ? colors[mode === 'system' ? 'dark' : mode] : ctx.tokens;
  const palette: Record<ExiaBadgeTone, { bg: string; fg: string }> = {
    ok: { bg: 'rgba(16, 185, 129, 0.16)', fg: t.liveEmerald ?? brand.liveEmerald }, // liveEmerald — live status only
    muted: { bg: t.muted, fg: t.mutedForeground },
    warn: { bg: 'rgba(245, 158, 11, 0.16)', fg: '#f59e0b' },
    info: { bg: 'rgba(31, 213, 249, 0.16)', fg: t.primary },
  };
  const colorsConfig = palette[tone];

  return (
    <View
      style={[
        {
          backgroundColor: colorsConfig.bg,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 3,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <RNText style={{ color: colorsConfig.fg, fontSize: 11, fontWeight: '600' }}>
        {label}
      </RNText>
    </View>
  );
}
