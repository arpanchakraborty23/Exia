import type {
  AccentColor,
  ButtonRadius,
  ButtonVariantStyle,
  FontStyle,
  ThemeMode,
} from '@exia/design-tokens';

export interface UserPreferences {
  mode: ThemeMode;
  accent: AccentColor;
  buttonRadius: ButtonRadius;
  buttonStyle: ButtonVariantStyle;
  fontStyle: FontStyle;
  timezone: string;
  timeFormat: '12h' | '24h';
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  mode: 'dark',
  accent: 'cyan',
  buttonRadius: 'rounded',
  buttonStyle: 'solid',
  fontStyle: 'system',
  timezone: 'auto',
  timeFormat: '12h',
  dateFormat: 'YYYY-MM-DD',
};

const PREFS_KEY = 'exia.user.preferences';

export async function getStoredPreferences(): Promise<UserPreferences> {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_USER_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export async function saveStoredPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const current = await getStoredPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  } catch {
    // best effort persistence
  }
}
