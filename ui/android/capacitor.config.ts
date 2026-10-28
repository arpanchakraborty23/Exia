import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Exia Android shell configuration.
 *
 * The web assets are copied from `apps/web/out` (Next.js static export)
 * into `www/` by `scripts/copy-web.mjs` before every `cap sync`.
 */
const config: CapacitorConfig = {
  appId: 'com.exia.app',
  appName: 'Exia',
  webDir: 'www',
  server: {
    // Required so LiveKit WebRTC runs in a secure context (mic/camera access).
    androidScheme: 'https',
    // Uncomment for local development against an HTTP backend:
    // cleartext: true,
  },
};

export default config;
