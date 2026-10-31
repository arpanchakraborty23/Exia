/**
 * @exia/design-tokens
 *
 * Ported from the Exia design system in ui/apps/web/styles/globals.css
 * ("Sleek AI Product" — OpenAI / Perplexity / Linear aesthetics).
 *
 * Philosophy: frosted glass, ultra-subtle borders, generous whitespace,
 * minimal decoration, maximum clarity. Emerald (#10b981) is reserved for
 * live status only; electric cyan is the LiveKit-brand primary in dark mode.
 */

export type ThemeMode = 'light' | 'dark' | 'oled' | 'system';

export type AccentColor =
  | 'cyan'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'crimson'
  | 'blue'
  | 'pink';

export type ButtonRadius = 'rounded' | 'pill' | 'sharp';

export type ButtonVariantStyle = 'solid' | 'glass' | 'outline';

export type FontStyle = 'system' | 'modern' | 'mono' | 'rounded';

export interface ColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  /** LiveKit voice surface ladder (1 = canvas, 5 = most elevated) */
  lkSurface1: string;
  lkSurface2: string;
  lkSurface3: string;
  lkSurface4: string;
  lkSurface5: string;
  /** Emerald (#10b981) — reserved for live status only */
  liveEmerald: string;
}

export interface AccentDefinition {
  name: string;
  hex: string;
  primary: string;
  primaryHover: string;
  ring: string;
  primaryForeground: string;
  lightPrimary: string;
  lightHover: string;
  badgeTone: string;
}

export const ACCENT_PALETTES: Record<AccentColor, AccentDefinition> = {
  cyan: {
    name: 'Electric Cyan',
    hex: '#1fd5f9',
    primary: '#1fd5f9',
    primaryHover: '#45dcfa',
    ring: '#1fd5f9',
    primaryForeground: '#000000',
    lightPrimary: '#0070f3',
    lightHover: '#0051b3',
    badgeTone: '#1fd5f9',
  },
  emerald: {
    name: 'Live Emerald',
    hex: '#10b981',
    primary: '#10b981',
    primaryHover: '#34d399',
    ring: '#10b981',
    primaryForeground: '#000000',
    lightPrimary: '#059669',
    lightHover: '#047857',
    badgeTone: '#10b981',
  },
  violet: {
    name: 'Cyber Violet',
    hex: '#a855f7',
    primary: '#a855f7',
    primaryHover: '#c084fc',
    ring: '#a855f7',
    primaryForeground: '#ffffff',
    lightPrimary: '#9333ea',
    lightHover: '#7e22ce',
    badgeTone: '#a855f7',
  },
  amber: {
    name: 'Sunset Amber',
    hex: '#f59e0b',
    primary: '#f59e0b',
    primaryHover: '#fbbf24',
    ring: '#f59e0b',
    primaryForeground: '#000000',
    lightPrimary: '#d97706',
    lightHover: '#b45309',
    badgeTone: '#f59e0b',
  },
  crimson: {
    name: 'Tactical Red',
    hex: '#ef4444',
    primary: '#ef4444',
    primaryHover: '#f87171',
    ring: '#ef4444',
    primaryForeground: '#ffffff',
    lightPrimary: '#dc2626',
    lightHover: '#b91c1c',
    badgeTone: '#ef4444',
  },
  blue: {
    name: 'Royal Blue',
    hex: '#3b82f6',
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    ring: '#3b82f6',
    primaryForeground: '#ffffff',
    lightPrimary: '#2563eb',
    lightHover: '#1d4ed8',
    badgeTone: '#3b82f6',
  },
  pink: {
    name: 'Neon Pink',
    hex: '#ec4899',
    primary: '#ec4899',
    primaryHover: '#f472b6',
    ring: '#ec4899',
    primaryForeground: '#ffffff',
    lightPrimary: '#db2777',
    lightHover: '#be185d',
    badgeTone: '#ec4899',
  },
};

export const colors: Record<Exclude<ThemeMode, 'system'>, ColorTokens> = {
  light: {
    background: '#fafafa',
    foreground: '#0a0a0a',
    card: '#ffffff',
    cardForeground: '#0a0a0a',
    popover: '#ffffff',
    popoverForeground: '#0a0a0a',
    primary: '#002cf2',
    primaryHover: '#0022c4',
    primaryForeground: '#ffffff',
    secondary: '#f5f5f5',
    secondaryForeground: '#171717',
    muted: '#f5f5f5',
    mutedForeground: '#52525b',
    accent: '#f5f5f5',
    accentForeground: '#0a0a0a',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: 'rgba(0, 0, 0, 0.08)',
    input: 'rgba(0, 0, 0, 0.06)',
    ring: '#002cf2',
    sidebar: '#ffffff',
    sidebarForeground: '#404040',
    sidebarPrimary: '#002cf2',
    sidebarPrimaryForeground: '#ffffff',
    sidebarAccent: '#f7f7f7',
    sidebarAccentForeground: '#0a0a0a',
    sidebarBorder: 'rgba(0, 0, 0, 0.06)',
    sidebarRing: '#002cf2',
    lkSurface1: '#f8f8f8',
    lkSurface2: '#f0f0f0',
    lkSurface3: '#e8e8e8',
    lkSurface4: '#dcdcdc',
    lkSurface5: '#d0d0d0',
    liveEmerald: '#10b981',
  },
  dark: {
    background: '#090909',
    foreground: '#ededed',
    card: '#111111',
    cardForeground: '#ededed',
    popover: '#161616',
    popoverForeground: '#ededed',
    primary: '#1fd5f9',
    primaryHover: '#45dcfa',
    primaryForeground: '#000000',
    secondary: '#1a1a1a',
    secondaryForeground: '#c0c0c0',
    muted: '#141414',
    mutedForeground: '#a1a1aa',
    accent: '#1c1c1c',
    accentForeground: '#e0e0e0',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: 'rgba(255, 255, 255, 0.07)',
    input: 'rgba(255, 255, 255, 0.05)',
    ring: '#1fd5f9',
    sidebar: '#050505',
    sidebarForeground: '#999999',
    sidebarPrimary: '#1fd5f9',
    sidebarPrimaryForeground: '#000000',
    sidebarAccent: '#131313',
    sidebarAccentForeground: '#d0d0d0',
    sidebarBorder: 'rgba(255, 255, 255, 0.05)',
    sidebarRing: '#1fd5f9',
    lkSurface1: '#111111',
    lkSurface2: '#161616',
    lkSurface3: '#1c1c1c',
    lkSurface4: '#242424',
    lkSurface5: '#2e2e2e',
    liveEmerald: '#10b981',
  },
  oled: {
    background: '#000000',
    foreground: '#f3f4f6',
    card: '#080808',
    cardForeground: '#f3f4f6',
    popover: '#0d0d0d',
    popoverForeground: '#f3f4f6',
    primary: '#1fd5f9',
    primaryHover: '#45dcfa',
    primaryForeground: '#000000',
    secondary: '#121212',
    secondaryForeground: '#d1d5db',
    muted: '#0e0e0e',
    mutedForeground: '#a1a1aa',
    accent: '#141414',
    accentForeground: '#e5e7eb',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: 'rgba(255, 255, 255, 0.10)',
    input: 'rgba(255, 255, 255, 0.06)',
    ring: '#1fd5f9',
    sidebar: '#000000',
    sidebarForeground: '#9ca3af',
    sidebarPrimary: '#1fd5f9',
    sidebarPrimaryForeground: '#000000',
    sidebarAccent: '#0a0a0a',
    sidebarAccentForeground: '#e5e7eb',
    sidebarBorder: 'rgba(255, 255, 255, 0.08)',
    sidebarRing: '#1fd5f9',
    lkSurface1: '#000000',
    lkSurface2: '#0a0a0a',
    lkSurface3: '#121212',
    lkSurface4: '#1a1a1a',
    lkSurface5: '#242424',
    liveEmerald: '#10b981',
  },
};

/**
 * Dynamically resolves ColorTokens for the specified mode and accent color.
 */
export function getThemeTokens(
  mode: ThemeMode = 'dark',
  accent: AccentColor = 'cyan',
): ColorTokens {
  const resolvedMode: Exclude<ThemeMode, 'system'> =
    mode === 'system' ? 'dark' : mode === 'light' ? 'light' : mode === 'oled' ? 'oled' : 'dark';

  const base = colors[resolvedMode];
  const acc = ACCENT_PALETTES[accent] ?? ACCENT_PALETTES.cyan;

  const isLight = resolvedMode === 'light';
  const primary = isLight ? acc.lightPrimary : acc.primary;
  const primaryHover = isLight ? acc.lightHover : acc.primaryHover;
  const primaryForeground = acc.primaryForeground;
  const ring = primary;

  return {
    ...base,
    primary,
    primaryHover,
    primaryForeground,
    ring,
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryForeground,
    sidebarRing: ring,
  };
}

/** Brand accents referenced by the design system comments in globals.css */
export const brand = {
  /** Electric cyan — LiveKit brand, dark-mode primary */
  electricCyan: '#1fd5f9',
  /** Web-mode primary blue */
  primaryBlue: '#002cf2',
  /** Emerald — live status ONLY */
  liveEmerald: '#10b981',
  chart: ['#002cf2', '#1fd5f9', '#10b981', '#f59e0b', '#ec4899'],
} as const;

export type StatusTone = 'ok' | 'muted' | 'warn' | 'info';

/** Semantic status indicators conforming to the Exia design system */
export const status = {
  /** Emerald — live status ONLY */
  ok: '#10b981',
  warn: '#f59e0b',
  error: '#ef4444',
  info: '#1fd5f9',
} as const;

/** Base corner radius (globals.css --radius: 0.625rem) */
export const radius = {
  base: 10,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

/** 4pt-based spacing scale */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Typography scale (clean sans; mono reserved for data) */
export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  } as const,
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
};

export const tokens = { colors, brand, status, radius, spacing, typography, ACCENT_PALETTES, getThemeTokens } as const;
