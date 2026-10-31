# Exia — Mobile Client (Expo / React Native)

Expo SDK 58 · React Native 0.88 · Expo Router (routes in `src/app/`) ·
React Query · expo-secure-store.

Part of the `ui/` pnpm workspace; consumes the shared `@exia/*` packages from
`../../packages/` via `workspace:*` links.

## Commands

```bash
pnpm start          # Expo dev server (press A for Android emulator, W for web)
pnpm android        # start + Android emulator
pnpm typecheck      # tsc --noEmit
npx expo lint       # ESLint (flat config, eslint-config-expo)
npx expo-doctor     # diagnose dependency/config issues
npx expo export --platform web      # production web export -> dist/
npx expo export --platform android  # Hermes bundle -> dist/
```

Unit tests for the shared packages live in `packages/*/src/*.test.ts` and
run from the workspace root: `pnpm test` (vitest).

> `npx expo install <pkg>` is the ONLY way to add packages — it resolves
> SDK-compatible versions. See `AGENTS.md` in this folder for the full
> operating rules (docs-first, CNG: never create `android/`/`ios/` by hand).

## Structure

```
src/app/            # Expo Router routes (screens) — keep non-route code OUTSIDE
src/app/(tabs)/     # tab group: Home, History, MCP, Prompts, Settings
src/app/session/    # /session/[id] — transcript + tool calls
src/lib/            # app-level wiring: API client, auth hook, token-storage adapter
src/components/     # shared screen components (ui.tsx: Badge, states, inputs…)
assets/             # icons & splash
app.json            # app config (scheme "exia", typed routes, com.exia.app)
```

### Routes

| Route | Screen |
|---|---|
| `/` | Home tab — backend health, quick stats and navigation |
| `/history` | Session list (pull-to-refresh, empty/error states) |
| `/session/[id]` | Session detail — transcript, metrics, MCP tool calls |
| `/mcp` | MCP servers — toggle (optimistic), edit, delete, add |
| `/mcp-editor` | Add/edit server (modal, `?id=` prefills) |
| `/prompts` | System prompts & quick commands |
| `/prompt-editor` | Add/edit prompt (modal, `?id=` prefills) |
| `/settings` | Model config, LiveKit credentials, sign out |
| `/login` | Sign in (modal; shown when no token is stored) |
| `/register` | Create account (modal; auto sign-in on success) |
| `/voice` | LiveKit voice session (immersive, no header) |

Auth flow: the root layout gates on token hydration (`src/lib/auth.ts`),
redirects to `/login` when no token exists, and tabs render `null` while
signed out — no flash of authenticated UI on cold start.

### Component choice note

Per `../README.md` §6 the app uses the ported design system
(`@exia/design-tokens` + `@exia/shared-ui` primitives) rather than
`@expo/ui` native components, to keep Android/web/Windows visually
consistent. Revisit if a screen needs deep native integration.

## Shared packages

- `@exia/shared-types` — API contracts (ported from the legacy web client)
- `@exia/api-client` — fetch layer with pluggable token storage
- `@exia/design-tokens` — Exia palette/spacing/radius (ported from globals.css)
- `@exia/shared-ui` — portable RN primitives (ExiaText/Button/Screen/Card)
- `@exia/shared-logic` — platform-agnostic formatters/validation

## Backend connection

`src/lib/api.ts` instantiates the shared client:

- Base URL: `process.env.EXPO_PUBLIC_API_URL`, defaulting to
  `https://exia-backend.vercel.app/api`. Override it for local development,
  for example `EXPO_PUBLIC_API_URL=http://<host>:12568/api` for a physical
  device on the same LAN as the backend.
- Token storage: `SecureTokenStorage` (src/lib/secure-token-storage.ts) —
  Android Keystore / iOS Keychain via expo-secure-store; the `.web.ts`
  variant falls back to localStorage on the web target. Shared code never
  imports either file (see `../README.md` §9 adapter rule).
- Data layer: React Query (`@tanstack/react-query`) with a shared
  QueryClient in the root layout — loading/empty/error states on every
  screen, pull-to-refresh on lists, optimistic MCP enable/disable with
  rollback.

Never hardcode secrets into the bundle (see `../README.md` §8).

## Automated APK Builds via GitHub Actions (Zero Local Load)

If your local computer has limited resources or cannot run heavy Gradle builds, use the included GitHub Actions workflow ([`.github/workflows/mobile-ci-cd.yml`](../../.github/workflows/mobile-ci-cd.yml)):

1. Open your repository on GitHub and go to the **Actions** tab.
2. Select **Exia Mobile — CI/CD & Android APK Build**.
3. Click **Run workflow**, choose `apk-debug` (or `apk-release`), and submit.
4. When finished (4–6 minutes), download the installable `.apk` from the **Artifacts** section at the bottom.
5. See [`docs/expo-ci-cd-apk-build.md`](../../../docs/expo-ci-cd-apk-build.md) for full instructions.

## Building with Expo Cloud (EAS Build)

Because Exia uses `@livekit/react-native` and WebRTC native modules, running real-time voice and video requires native compilation via **EAS Build** (Expo Cloud):

### 1. Prerequisites & Login
```bash
# Install EAS CLI globally (recommended to prevent npx cache issues on Windows)
npm install -g eas-cli

# Log in to your Expo account
eas login

# Navigate to the mobile app directory
cd ui/apps/mobile

# Link or initialize the EAS project on expo.dev
eas init
```

### 2. Cloud Build Commands
The build profiles are configured in `eas.json`:

```bash
# 📱 Android Standalone APK (Installable directly on physical Android phones/emulators)
eas build -p android --profile preview

# 🚀 Android Google Play Store Release (.aab bundle)
eas build -p android --profile production

# 🍎 iOS App Store / TestFlight Release
eas build -p ios --profile production

# 🛠️ Custom Development Client (For local debugging with native WebRTC/LiveKit)
eas build -p android --profile development
```

When the build finishes, EAS provides a web dashboard link and QR code to download and install the build immediately.

## Known gaps

- **Voice session requires a native build** — `@livekit/react-native` ships
  native WebRTC code, so Expo Go cannot run `/voice`. Use a development
  build (`npx expo run:android`) or EAS; the rest of the app runs in
  Expo Go. Controls follow the official LiveKit React Native example
  (`client-sdk-react-native/example`): mic toggle, camera toggle + flip,
  screen share (Android media projection / iOS broadcast picker), chat over
  the `lk.chat` text-stream topic, speaker selection via `AudioSession`,
  and disconnect with backend session cleanup (`POST /sessions/{id}/end`).
- **iOS screen share broadcast extension** is not provisioned yet — the
  in-app system picker works, but a full broadcast extension target is
  future work (iOS only; Android needs no extra target).
- Legacy seed/demo sessions are intentionally not ported — lists show a
  designed empty state instead of fake data.
