import { describe, expect, it } from 'vitest';

import {
  ACCENT_PALETTES,
  brand,
  colors,
  getThemeTokens,
  radius,
  spacing,
  status,
  typography,
  type AccentColor,
} from './index';

describe('design-tokens: colors & brand', () => {
  it('defines dark theme palette conforming to Exia design system', () => {
    expect(colors.dark.background).toBe('#090909');
    expect(colors.dark.card).toBe('#111111');
    expect(colors.dark.primary).toBe('#1fd5f9');
    expect(colors.dark.ring).toBe('#1fd5f9');
    expect(colors.dark.liveEmerald).toBe('#10b981');
    expect(colors.dark.lkSurface1).toBe('#111111');
    expect(colors.dark.lkSurface5).toBe('#2e2e2e');
  });

  it('defines light theme palette', () => {
    expect(colors.light.background).toBe('#fafafa');
    expect(colors.light.card).toBe('#ffffff');
    expect(colors.light.primary).toBe('#002cf2');
    expect(colors.light.liveEmerald).toBe('#10b981');
    expect(colors.light.lkSurface1).toBe('#f8f8f8');
    expect(colors.light.lkSurface5).toBe('#d0d0d0');
  });

  it('defines oled pure black theme palette', () => {
    expect(colors.oled.background).toBe('#000000');
    expect(colors.oled.card).toBe('#080808');
    expect(colors.oled.liveEmerald).toBe('#10b981');
  });

  it('exports brand and status tokens', () => {
    expect(brand.electricCyan).toBe('#1fd5f9');
    expect(brand.liveEmerald).toBe('#10b981');
    expect(status.ok).toBe('#10b981');
    expect(status.warn).toBe('#f59e0b');
    expect(status.error).toBe('#ef4444');
    expect(status.info).toBe('#1fd5f9');
  });

  it('generates dynamic theme tokens across all 7 accents', () => {
    const accents: AccentColor[] = ['cyan', 'emerald', 'violet', 'amber', 'crimson', 'blue', 'pink'];
    for (const accent of accents) {
      const def = ACCENT_PALETTES[accent];
      expect(def).toBeDefined();

      const darkTheme = getThemeTokens('dark', accent);
      expect(darkTheme.primary).toBe(def.primary);
      expect(darkTheme.ring).toBe(def.ring);

      const lightTheme = getThemeTokens('light', accent);
      expect(lightTheme.primary).toBe(def.lightPrimary);

      const oledTheme = getThemeTokens('oled', accent);
      expect(oledTheme.background).toBe('#000000');
      expect(oledTheme.primary).toBe(def.primary);
    }
  });
});

describe('design-tokens: spacing & radius', () => {
  it('follows 4pt grid for spacing', () => {
    Object.values(spacing).forEach((val) => {
      expect(val % 4).toBe(0);
    });
  });

  it('defines consistent corner radii', () => {
    expect(radius.base).toBe(10);
    expect(radius.md).toBe(10);
    expect(radius.lg).toBe(14);
    expect(radius.full).toBe(9999);
  });

  it('defines typography scale', () => {
    expect(typography.fontSizes.base).toBe(16);
    expect(typography.fontSizes.xl).toBe(24);
    expect(typography.fontWeights.regular).toBe('400');
    expect(typography.fontWeights.semibold).toBe('600');
  });
});
