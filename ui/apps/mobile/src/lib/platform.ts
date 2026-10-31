import { Platform } from 'react-native';

export type AppEnvironment = 'electron' | 'web' | 'mobile';

/**
 * Returns true if the app is currently running inside an Electron desktop window.
 */
export function isElectronApp(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;

  const win = window as unknown as {
    electronPlatform?: { isElectron?: boolean };
    process?: { versions?: { electron?: string } };
  };

  if (win.electronPlatform?.isElectron === true) return true;
  if (win.process?.versions?.electron) return true;
  if (typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent)) {
    return true;
  }
  if (typeof window !== 'undefined' && (window as any).__EXIA_FORCE_DESKTOP) {
    return true;
  }
  try {
    if (typeof window !== 'undefined' && window.location?.search?.includes('desktop=1')) {
      return true;
    }
  } catch {
    // Ignore URL access error
  }

  return false;
}

/**
 * Returns true if running in a standard web browser (Chrome, Edge, Safari, Firefox).
 */
export function isWebApp(): boolean {
  return Platform.OS === 'web' && !isElectronApp();
}

/**
 * Returns true if running on native mobile (Android / iOS).
 */
export function isMobileNative(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

/**
 * Resolves the active app environment.
 */
export function getAppEnvironment(): AppEnvironment {
  if (isElectronApp()) return 'electron';
  if (Platform.OS === 'web') return 'web';
  return 'mobile';
}
