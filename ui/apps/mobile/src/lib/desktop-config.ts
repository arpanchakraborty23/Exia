/**
 * Configuration and persistent storage for Exia Desktop Setup & Environment.
 * Supports first-time run detection, backend API configuration, LiveKit credentials,
 * audio device selection, and offline local mode.
 */

export interface DesktopSetupConfig {
  setupCompleted: boolean;
  setupCompletedAt?: string;
  environmentType: 'cloud' | 'local' | 'custom';
  apiUrl: string;
  livekitUrl: string;
  livekitApiKey?: string;
  livekitApiSecret?: string;
  livekitPreset: 'cloud' | 'custom';
  localMode: boolean;
  userEmail?: string;
  userName?: string;
  audioInputDeviceId?: string;
  audioInputDeviceLabel?: string;
  lastHealthCheck?: {
    status: 'ok' | 'error';
    latencyMs?: number;
    testedAt?: string;
    target?: string;
  };
}

export const DEFAULT_CLOUD_API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://exia-backend.vercel.app/api';
export const DEFAULT_LOCAL_API_URL = 'http://127.0.0.1:8000/api';
export const DEFAULT_CLOUD_LIVEKIT_URL = 'wss://exia.livekit.cloud';

export const DEFAULT_DESKTOP_CONFIG: DesktopSetupConfig = {
  setupCompleted: false,
  environmentType: 'cloud',
  apiUrl: DEFAULT_CLOUD_API_URL,
  livekitUrl: DEFAULT_CLOUD_LIVEKIT_URL,
  livekitApiKey: '',
  livekitApiSecret: '',
  livekitPreset: 'cloud',
  localMode: false,
};

const STORAGE_KEY = 'exia.desktop.setup_config';
const API_URL_KEY = 'exia.api.base_url';

/** In-memory fallback for non-browser / SSR environments */
let memoryConfig: DesktopSetupConfig = { ...DEFAULT_DESKTOP_CONFIG };

function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Synchronous read for initial bootstrap */
export function getStoredSetupConfigSync(): DesktopSetupConfig {
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_DESKTOP_CONFIG, ...parsed };
      }
      // Check legacy / standalone API URL key if set
      const legacyApiUrl = window.localStorage.getItem(API_URL_KEY);
      if (legacyApiUrl) {
        return { ...DEFAULT_DESKTOP_CONFIG, apiUrl: legacyApiUrl };
      }
    } catch {
      // Return memory fallback on error
    }
  }
  return memoryConfig;
}

export async function getStoredSetupConfig(): Promise<DesktopSetupConfig> {
  return getStoredSetupConfigSync();
}

export async function saveStoredSetupConfig(
  partial: Partial<DesktopSetupConfig>,
): Promise<DesktopSetupConfig> {
  const current = getStoredSetupConfigSync();
  const updated: DesktopSetupConfig = {
    ...current,
    ...partial,
  };

  memoryConfig = updated;

  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (updated.apiUrl) {
        window.localStorage.setItem(API_URL_KEY, updated.apiUrl);
      }
    } catch (e) {
      console.warn('[DesktopConfig] Failed to persist configuration to localStorage:', e);
    }
  }

  return updated;
}

export function isSetupCompleted(): boolean {
  return getStoredSetupConfigSync().setupCompleted;
}

export async function resetSetupConfig(): Promise<void> {
  memoryConfig = { ...DEFAULT_DESKTOP_CONFIG };
  if (hasLocalStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(API_URL_KEY);
    } catch {
      // best-effort
    }
  }
}

/**
 * Diagnostics & Environment Detection for Desktop / Web runtimes.
 */
export interface EnvironmentDiagnostics {
  isElectron: boolean;
  platform: string;
  arch: string;
  hasWebRTC: boolean;
  hasMediaDevices: boolean;
  isOnline: boolean;
  userAgent: string;
}

export function getEnvironmentDiagnostics(): EnvironmentDiagnostics {
  const isElectron =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { electronPlatform?: { isElectron: boolean } })?.electronPlatform
        ?.isElectron,
    );

  const electronPlatform =
    typeof window !== 'undefined'
      ? (window as unknown as { electronPlatform?: { platform?: string; arch?: string } })
          ?.electronPlatform
      : undefined;

  const platform =
    electronPlatform?.platform ??
    (typeof navigator !== 'undefined' ? navigator.platform || 'universal-web' : 'desktop-unknown');

  const arch = electronPlatform?.arch ?? 'x64';

  const hasWebRTC =
    typeof window !== 'undefined' &&
    (typeof RTCPeerConnection !== 'undefined' || typeof (window as any)?.webkitRTCPeerConnection !== 'undefined');

  const hasMediaDevices =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'exia-client';

  return {
    isElectron,
    platform,
    arch,
    hasWebRTC,
    hasMediaDevices,
    isOnline,
    userAgent,
  };
}
