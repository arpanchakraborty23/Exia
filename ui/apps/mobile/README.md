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
  `http://127.0.0.1:12568/api` (local backend). Point a physical device at
  a LAN backend with `EXPO_PUBLIC_API_URL=http://<host>:12568/api`.
- Token storage: `SecureTokenStorage` (src/lib/secure-token-storage.ts) —
  Android Keystore / iOS Keychain via expo-secure-store; the `.web.ts`
  variant falls back to localStorage on the web target. Shared code never
  imports either file (see `../README.md` §9 adapter rule).
- Data layer: React Query (`@tanstack/react-query`) with a shared
  QueryClient in the root layout — loading/empty/error states on every
  screen, pull-to-refresh on lists, optimistic MCP enable/disable with
  rollback.

Never hardcode secrets into the bundle (see `../README.md` §8).

## Known gaps

- **Voice session screen** — needs `@livekit/react-native` (the web
  `@livekit/components-react` stack doesn't run on native). Planned next.
- Legacy seed/demo sessions are intentionally not ported — lists show a
  designed empty state instead of fake data.
