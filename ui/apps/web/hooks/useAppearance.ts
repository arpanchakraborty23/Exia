'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export type BaseThemeId = 'obsidian' | 'oled' | 'navy' | 'light' | 'system';
export type GlassStyleId = 'frosted' | 'crystal' | 'neon' | 'matte';
export type AccentColorId =
  | 'cyan'
  | 'emerald'
  | 'violet'
  | 'cobalt'
  | 'crimson'
  | 'amber'
  | 'pink'
  | 'mint'
  | 'silver';

export interface AccentColor {
  id: AccentColorId;
  name: string;
  color: string;
  hover: string;
  glow: string;
  description: string;
}

export interface GlassStyle {
  id: GlassStyleId;
  name: string;
  desc: string;
}

export interface BaseTheme {
  id: BaseThemeId;
  name: string;
  desc: string;
  badge?: string;
}

export const ACCENT_PALETTES: AccentColor[] = [
  {
    id: 'cyan',
    name: 'Electric Cyan',
    color: '#1fd5f9',
    hover: '#45dcfa',
    glow: 'rgba(31, 213, 249, 0.3)',
    description: 'LiveKit signature electric pulse',
  },
  {
    id: 'emerald',
    name: 'Emerald Glow',
    color: '#10b981',
    hover: '#34d399',
    glow: 'rgba(16, 185, 129, 0.3)',
    description: 'Natural organic balance & vitality',
  },
  {
    id: 'violet',
    name: 'Cosmic Violet',
    color: '#a855f7',
    hover: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.3)',
    description: 'Deep modern AI aesthetic',
  },
  {
    id: 'cobalt',
    name: 'Hyper Cobalt',
    color: '#3b82f6',
    hover: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.3)',
    description: 'High-precision engineering blue',
  },
  {
    id: 'crimson',
    name: 'Crimson Flare',
    color: '#f43f5e',
    hover: '#fb7185',
    glow: 'rgba(244, 63, 94, 0.3)',
    description: 'Vivid high-energy contrast',
  },
  {
    id: 'amber',
    name: 'Solar Amber',
    color: '#f59e0b',
    hover: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.3)',
    description: 'Warm champagne luxury glow',
  },
  {
    id: 'pink',
    name: 'Cyberpunk Pink',
    color: '#ec4899',
    hover: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.3)',
    description: 'Vibrant neon synthwave spectrum',
  },
  {
    id: 'mint',
    name: 'Mint Aqua',
    color: '#14b8a6',
    hover: '#2dd4bf',
    glow: 'rgba(20, 184, 166, 0.3)',
    description: 'Crisp luminous modern turquoise',
  },
  {
    id: 'silver',
    name: 'Titanium Silver',
    color: '#cbd5e1',
    hover: '#e2e8f0',
    glow: 'rgba(203, 213, 225, 0.25)',
    description: 'Pure monochromatic Swiss minimal',
  },
];

export const GLASS_STYLES: GlassStyle[] = [
  {
    id: 'frosted',
    name: 'Frosted Liquid',
    desc: '24px translucent blur with subtle specular sheen',
  },
  {
    id: 'crystal',
    name: 'Crystal Prism',
    desc: '40px ultra-clear refraction with crisp specular border',
  },
  {
    id: 'neon',
    name: 'Cyber Neon Glass',
    desc: 'Deep tinted translucent core with glowing neon edge bloom',
  },
  {
    id: 'matte',
    name: 'Smooth Matte',
    desc: 'Solid velvet carbon finish with zero reflections',
  },
];

export const BASE_THEMES: BaseTheme[] = [
  {
    id: 'obsidian',
    name: 'Obsidian Carbon',
    desc: 'Near-black deep canvas (#090909)',
    badge: 'DEFAULT',
  },
  {
    id: 'oled',
    name: 'OLED Midnight',
    desc: '100% pure pitch black (#000000)',
    badge: 'BATTERY SAVER',
  },
  {
    id: 'navy',
    name: 'Cyber Navy',
    desc: 'Deep space midnight blue (#060913)',
    badge: 'CYBER',
  },
  {
    id: 'light',
    name: 'Solar Clean',
    desc: 'High-contrast daytime clarity',
  },
  {
    id: 'system',
    name: 'OS Auto Sync',
    desc: 'Automatically matches device settings',
  },
];

const STORAGE_KEYS = {
  ACCENT: 'exia_theme_accent',
  GLASS: 'exia_glass_style',
  BASE: 'exia_base_theme',
};

export function useAppearance() {
  const { setTheme: setNextTheme, theme: currentNextTheme } = useTheme();

  const [accentId, setAccentId] = useState<AccentColorId>('cyan');
  const [glassId, setGlassId] = useState<GlassStyleId>('frosted');
  const [baseId, setBaseId] = useState<BaseThemeId>('obsidian');
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    setIsMounted(true);
    const savedAccent = localStorage.getItem(STORAGE_KEYS.ACCENT) as AccentColorId | null;
    const savedGlass = localStorage.getItem(STORAGE_KEYS.GLASS) as GlassStyleId | null;
    const savedBase = localStorage.getItem(STORAGE_KEYS.BASE) as BaseThemeId | null;

    if (savedAccent && ACCENT_PALETTES.some((p) => p.id === savedAccent)) {
      setAccentId(savedAccent);
      applyAccent(savedAccent);
    }
    if (savedGlass && GLASS_STYLES.some((g) => g.id === savedGlass)) {
      setGlassId(savedGlass);
      applyGlass(savedGlass);
    }
    if (savedBase && BASE_THEMES.some((b) => b.id === savedBase)) {
      setBaseId(savedBase);
      applyBase(savedBase, setNextTheme);
    }
  }, []);

  const applyAccent = (id: AccentColorId) => {
    const pal = ACCENT_PALETTES.find((p) => p.id === id);
    if (!pal || typeof document === 'undefined') return;

    const root = document.documentElement;
    root.style.setProperty('--primary', pal.color);
    root.style.setProperty('--primary-hover', pal.hover);
    root.style.setProperty('--ring', pal.color);
    root.style.setProperty('--accent-glow', pal.glow);

    // Save
    localStorage.setItem(STORAGE_KEYS.ACCENT, id);
  };

  const applyGlass = (id: GlassStyleId) => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-glass', id);
    localStorage.setItem(STORAGE_KEYS.GLASS, id);
  };

  const applyBase = (id: BaseThemeId, setModeFn: (mode: string) => void) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-surface', id);
    localStorage.setItem(STORAGE_KEYS.BASE, id);

    if (id === 'light') {
      setModeFn('light');
    } else if (id === 'system') {
      setModeFn('system');
    } else {
      setModeFn('dark');
    }
  };

  const selectAccent = (id: AccentColorId) => {
    setAccentId(id);
    applyAccent(id);
  };

  const selectGlass = (id: GlassStyleId) => {
    setGlassId(id);
    applyGlass(id);
  };

  const selectBase = (id: BaseThemeId) => {
    setBaseId(id);
    applyBase(id, setNextTheme);
  };

  const activeAccent = ACCENT_PALETTES.find((p) => p.id === accentId) || ACCENT_PALETTES[0];
  const activeGlass = GLASS_STYLES.find((g) => g.id === glassId) || GLASS_STYLES[0];
  const activeBase = BASE_THEMES.find((b) => b.id === baseId) || BASE_THEMES[0];

  return {
    isMounted,
    accentId,
    glassId,
    baseId,
    activeAccent,
    activeGlass,
    activeBase,
    selectAccent,
    selectGlass,
    selectBase,
  };
}
