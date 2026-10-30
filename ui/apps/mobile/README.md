# Exia — Mobile Client (Expo / React Native)

Expo SDK 58 · React Native 0.88 · Expo Router (routes in `src/app/`).

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
src/lib/            # app-level wiring (API client instance, adapters)
assets/             # icons & splash
app.json            # app config (scheme "exia", typed routes, com.exia.app)
```

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
- Token storage: `InMemoryTokenStorage` for now — the secure-storage
  adapter (expo-secure-store on Android) lands with the settings milestone
  (see `../README.md` §9 adapter rule).

`src/app/login.tsx` is the first ported screen: email/password sign-in via
`api.auth.login`, token stored through the adapter, then `router.replace('/')`.
Never hardcode secrets into the bundle (see `../README.md` §8).
