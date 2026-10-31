# Building & Running Exia — Per-App Guide

> **Companion to `ui/README.md`** (the architecture source of truth). This
> document is the practical, command-level guide: prerequisites, setup, and
> how to run and build **each app** — backend, Android, web, and Windows.
>
> Last verified: 2026-10-30 against Expo SDK 58 / RN 0.88 / pnpm 12.16.1.

---

## 0. Prerequisites

| Target | Requires |
|---|---|
| All UI apps | **Node.js ≥ 20**, **pnpm 12.16.1** (`npm i -g pnpm@12.16.1`) |
| Backend | **Python + [uv](https://docs.astral.sh/uv/)**, a MongoDB instance (Atlas or local), LiveKit credentials for voice |
| Android dev | Android Studio (emulator + SDK) **or** a physical device with USB debugging; Expo Go for quick tests — **but the voice session (`/voice`) needs a dev build** (`npx expo run:android`), since LiveKit's WebRTC module has native code Expo Go can't load |
| Android production | Same as dev (local Gradle build) **or** an Expo account for EAS cloud builds |
| Web | Nothing beyond Node — the dev server and static export need no browser tooling |
| Windows | **Visual Studio 2022** with the *Desktop development with C++* workload + a compatible **Windows SDK** (see `apps/windows/README.md`) |

---

## 1. One-time setup

```bash
# 1. Install UI workspace dependencies (from ui/)
cd ui
pnpm install

# 2. Configure the backend environment
cd ../backend
cp .env.example .env        # then fill in MONGODB_URI, LiveKit creds, JWT secret
```

The workspace is a **pnpm monorepo**: `apps/mobile` + `packages/*` share one
lockfile (`ui/pnpm-lock.yaml`). The legacy Next.js app (`apps/web`) and the
planned Windows app are intentionally outside it.

---

## 2. Start the backend (optional for local testing)

```bash
cd backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 12568
```

- The UI clients default to the deployed backend at
  **`https://exia-backend.vercel.app/api`**. To use a local backend, set the
  appropriate client environment variable (see §6) to
  `http://127.0.0.1:12568/api`.
- Sanity check: `curl http://127.0.0.1:12568/api/health` → `{"status": "ok", ...}`.
- Docker alternative: `docker build -t exia-backend . && docker run --rm -p 12568:8000 --env-file .env exia-backend`
  (maps the container's 8000 to the clients' expected 12568).

---

## 3. Android app (`ui/apps/mobile`)

### 3.1 Run in development

```bash
cd ui/apps/mobile

npx expo start            # dev server; press A for Android emulator, W for web
npx expo start --android  # start + launch emulator directly
```

- **Emulator:** requires Android Studio with a configured AVD.
- **Physical device:** install **Expo Go** from the Play Store and scan the
  QR code. The device must reach the backend — see §6 for `EXPO_PUBLIC_API_URL`.
- First launch shows the sign-in screen; sign in with a backend account.

### 3.2 Build for production

**Local (needs Android Studio):**

```bash
cd ui/apps/mobile

# Dev build on a connected device/emulator (debug)
npx expo run:android

# Release build + install on a connected device
npx expo run:android --variant release

# Distributable APK via Gradle (CNG generates android/ — never edit it by hand)
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

**GitHub Actions Cloud Runner (Recommended — Zero Laptop Load & 100% Free):**

If your local computer has limited resources or lacks Android Studio:
1. Go to your GitHub repository → **Actions** tab.
2. Select **Exia Mobile — CI/CD & Android APK Build**.
3. Click **Run workflow** → Select `apk-debug` → Click **Run workflow**.
4. Once completed, download the installable `.apk` directly from the **Artifacts** table.
5. See [`docs/expo-ci-cd-apk-build.md`](../docs/expo-ci-cd-apk-build.md) for full instructions.

**Cloud (EAS, needs an Expo account):**

Installing `eas-cli` globally is recommended to avoid `npx` cache resolution conflicts on Windows:

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Authenticate & link project
eas login
cd ui/apps/mobile
eas init                  # one-time: links the project (generates extra.eas.projectId)

# 3. Build APK (preview) or Play Store bundle (production)
eas build -p android --profile preview    # Standalone installable .apk
eas build -p android --profile production # Optimized Google Play Store .aab
```

*(Alternatively, without global installation: `pnpm dlx eas-cli login` and `pnpm dlx eas-cli build -p android --profile preview`)*

### 3.3 Compile-only validation (no emulator needed)

```bash
npx expo export --platform android   # Hermes bundle → dist/
```

---

## 4. Web app (`ui/apps/mobile` — Expo web)

The web target is the **same universal app** (React Native Web), not the
legacy Next.js client.

### 4.1 Run in development

```bash
cd ui/apps/mobile
npx expo start --web      # or: press W in a running expo start
```

### 4.2 Production export (Local & CI/CD)

**Option A: GitHub Actions Cloud Build (Automated)**
Trigger [`.github/workflows/web-ci-cd.yml`](../.github/workflows/web-ci-cd.yml) from the GitHub Actions tab. It compiles the web export, generates downloadable artifacts, and can deploy automatically to GitHub Pages. See [`docs/web-ci-cd-build.md`](../docs/web-ci-cd-build.md).

**Option B: Local Export**
```bash
npx expo export --platform web
# → dist/ (static files + _expo/static/js/web chunks)
```

Serve `dist/` from any static host **with SPA fallback** (Expo Router uses
client-side routing, so unknown paths must serve `index.html`):

```bash
npx serve -s dist         # quick local check
```

### 4.3 Legacy Next.js client (`ui/apps/web`)

Standalone npm app kept during the migration until the Expo web export
reaches parity (Milestone 4 sunset):

```bash
cd ui/apps/web
npm install
npm run dev               # Next.js dev server
```

---

## 5. Windows Desktop App (`desktop/` & `ui/apps/windows`)

### 5.1 Electron Windows .EXE Packaging (Ready & Automated)
Exia provides an Electron desktop harness (`desktop/`) that packages the universal Expo web export into standalone Windows `.exe` binaries.

**Cloud Build via GitHub Actions (Zero Local Load — Recommended):**
1. In your GitHub repository, open the **Actions** tab.
2. Select **Exia Desktop — Windows EXE Build**.
3. Click **Run workflow** → Choose `all` (or `portable`) → Submit.
4. Download the compiled `.exe` files from the **Artifacts** table.
5. See [`docs/desktop-ci-cd-exe-build.md`](../docs/desktop-ci-cd-exe-build.md) for full details.

**Local Build (electron-builder):**
```bash
# 1. Build universal web export from ui/
cd ui
pnpm web:build

# 2. Package Windows .exe
cd ../desktop
npm install
npm run build:exe
# Outputs: desktop/dist-electron/Exia Setup 0.1.0.exe & Exia-portable-0.1.0.exe
```

### 5.2 Native WinUI 3 App (`ui/apps/windows` — React Native Windows Roadmap)

> **Status: Planned (Milestone 5).** Full plan, version pairing, and
> prerequisites: `apps/windows/README.md`. Summary of the flow once the
> C++ toolchain is present:

```bash
# 0. Verify prerequisites: VS 2022 C++ workload + Windows SDK
# 1. Scaffold outside the pnpm workspace (RNW 0.85 pairs RN 0.85 ≠ Expo's 0.88)
cd ui/apps
npx react-native@0.85.x init ExiaWindows --template react-native-windows@0.85.x

# 2. Run (Debug)
npx react-native run-windows

# 3. Release: build via Visual Studio (Release configuration)
```

Verification checklist lives in `apps/windows/README.md` (Debug + Release,
resize, mouse/keyboard/focus, clean-machine install).

---

## 6. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | mobile app, bundle time | Override the API base URL. Defaults to `https://exia-backend.vercel.app/api`. For local development, use `http://127.0.0.1:12568/api`; Android emulators reach the host backend via `http://10.0.2.2:12568/api`. |
| `NEXT_PUBLIC_API_URL` | web app, build time | Override the API base URL. Defaults to `https://exia-backend.vercel.app/api`; use `http://127.0.0.1:12568/api` for local development. |
| `MONGODB_URI`, `MONGODB_DATABASE`, … | `backend/.env` | Backend database connection (see `.env.example`). |
| `LIVEKIT_API_HOST`, keys | `backend/.env` | LiveKit SFU credentials for voice sessions. |

`EXPO_PUBLIC_*` variables are **inlined at bundle time** — restart the dev
server after changing them. Never put secrets in `EXPO_PUBLIC_*` (anything
bundled can be extracted; see `ui/README.md` §8).

---

## 7. Verification gates (run before declaring any UI work done)

From `ui/`:

```bash
pnpm -r run typecheck   # tsc --noEmit across all 7 workspace projects
pnpm test               # vitest — unit tests in packages/*/src/*.test.ts
```

From `ui/apps/mobile`:

```bash
npx expo lint                        # ESLint (flat config, eslint-config-expo)
npx expo-doctor                      # dependency/config diagnostics — expect 20/20
npx expo export --platform web       # production web export compiles
npx expo export --platform android   # Hermes bundle compiles
```

Current expected state: typecheck 7/7 ✅ · tests 19/19 ✅ · lint 0/0 ✅ ·
doctor 20/20 ✅ · both exports ✅.

---

## 8. Troubleshooting (Windows dev machines)

- **`pnpm` not found / `spawn pnpm ENOENT`** — pnpm is installed at
  `%APPDATA%\npm` but not on PATH. Prefix commands with
  `$env:Path = 'C:\Users\www58\AppData\Roaming\npm;' + $env:Path`
  (PowerShell shims are blocked by execution policy — invoke `pnpm.cmd`
  through `cmd /c`).
- **`^` disappears in version specs** — `cmd /c` eats carets, so
  `pnpm add eslint@^9.0.0` installs exactly 9.0.0. Pin exact versions.
- **`ERR_PNPM_IGNORED_BUILDS`** — pnpm 12 blocks postinstall scripts and
  Expo CLI treats the exit code as fatal. Approved packages live in
  `ui/pnpm-workspace.yaml` under `allowBuilds:` (currently
  `unrs-resolver`). Add more with `pnpm approve-builds <pkg>`.
- **Backend unreachable from the app** — check the port (clients default to
  12568), then the base URL: emulator needs `10.0.2.2`, physical devices
  need the LAN IP via `EXPO_PUBLIC_API_URL`.
- **Retired scripts** — Legacy scripts (`scripts/android.sh`,
  `scripts/desktop.sh`, `scripts/compile.sh`) and obsolete Capacitor/Tauri
  wrappers have been completely purged from the repository in favor of the
  unified Expo SDK 58 React Native architecture.
