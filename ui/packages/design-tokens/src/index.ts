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

export type ThemeMode = 'light' | 'dark';

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
}

export const colors: Record<ThemeMode, ColorTokens> = {
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
    mutedForeground: '#737373',
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
    mutedForeground: '#666666',
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
  },
};

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

/** Base corner radius (globals.css --radius: 0.625rem) */
export const radius = {
  base: 10,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
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

export const tokens = { colors, brand, radius, spacing, typography } as const;
