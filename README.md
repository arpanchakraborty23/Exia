# Exia — Multimodal AI Assistant & Voice Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Expo](https://img.shields.io/badge/Expo_SDK-58.0-000020.svg?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.88-61DAFB.svg?logo=react&logoColor=black)](https://reactnative.dev)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-002CF2.svg?logo=webrtc&logoColor=white)](https://livekit.io)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Mem0](https://img.shields.io/badge/Mem0-Universal_Memory-FF4F00.svg)](https://mem0.ai)
[![pnpm](https://img.shields.io/badge/pnpm-12.16-F69220.svg?logo=pnpm&logoColor=white)](https://pnpm.io)

A private, real-time multimodal personal AI assistant and voice agent platform. Powered by **LiveKit WebRTC**, **Google Gemini Live / Local LLMs**, **Model Context Protocol (MCP)**, **Mem0 Universal Memory**, and **MongoDB Atlas**.

---

## 1. System Architecture & How It Works

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           Universal Client Monorepo (ui/)                               │
│      pnpm 12.16.1 Workspace · Expo SDK 58 · React Native 0.88 · React 19 · Vitest       │
│                                                                                         │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   Universal Mobile & Web (apps/mobile)  │  │    Shared Monorepo Packages          │  │
│  │  • 4-Tab Navigation (Home/History/      │  │  • @exia/shared-types (contracts)   │  │
│  │    Analytics/Settings) & Voice Stage    │  │  • @exia/api-client (typed SDK)     │  │
│  │  • Immersive LiveKit Room (/voice)      │  │  • @exia/shared-logic (utilities)   │  │
│  │  • 7-Bar Reactive Audio Visualizer      │  │  • @exia/shared-ui (RN primitives)  │  │
│  │  • Camera & Screen-Share Streaming      │  │  • @exia/design-tokens (palette)    │  │
│  │  • Data-Stream Chat over lk.chat        │  │  • @exia/test-utils (mocks)         │  │
│  └─────────────────────────────────────────┘  └──────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │    Legacy Web Client (apps/web)         │  │    Windows Desktop (apps/windows)    │  │
│  │  • Next.js 15 / Tailwind v4 Bridge      │  │  • Planned React Native Windows 0.85 │  │
│  └─────────────────────────────────────────┘  └──────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────────────────────┬───────────────────┘
                    │ WebRTC Opus Audio & Video / Screen Tracks       │ HTTPS REST API
                    ▼                                                 ▼ (Bearer JWT)
┌──────────────────────────────────────────────────┐  ┌───────────────────────────────────┐
│     LiveKit Realtime Server (Local/Cloud SFU)    │  │      FastAPI Gateway (backend/)   │
│   ws://localhost:7880 or wss://<domain>.livekit  │  │  • Port 12568 (Local) / 8000 (CI) │
└───────────────────┬──────────────────────────────┘  │  • LiveKit Token Generation       │
                    │ WebRTC Room Protocol            │  • Non-blocking Auto-Seeding      │
                    ▼                                 │  • Sessions, MCP, Prompts, Models │
┌──────────────────────────────────────────────────┐  └─────────────────┬─────────────────┘
│       LiveKit Voice Agent Worker (agent/)        │                    │
│                                                  │                    │
│  ┌────────────────────┐  ┌────────────────────┐  │                    │
│  │  Multimodal Voice  │  │ Mem0 Memory Engine │  │                    │
│  │  • Gemini Live/LLM │  │ • User Facts & Bio │  │                    │
│  │  • Silero VAD      │  │ • Semantic Vector  │  │                    │
│  │  • Vision Streams  │  │   Search (SQLite)  │  │                    │
│  └────────────────────┘  └────────────────────┘  │                    │
│  ┌────────────────────────────────────────────┐  │                    │
│  │   Dynamic 2-Step MCP Tool Engine           │  │                    │
│  │   • search_mcp_tools & execute_mcp_tool    │  │                    │
│  │   • Reads definitions directly from DB     │  │                    │
│  └────────────────────────────────────────────┘  │                    │
└───────────────────┬──────────────────────────────┘                    │
                    │ Direct Queries (Async Motor Client)               │ Motor / PyMongo
                    ▼                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MongoDB Atlas Database                                  │
│   Collections: users · sessions · mcp_servers · prompts · model_config · token_blacklist│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

> 🗺️ **Editable Architecture Diagrams (draw.io):** [`docs/architecture/exia-high-level-architecture.drawio`](docs/architecture/) — includes backend server (`exia-backend-server.drawio`) and voice agent (`exia-voice-agent.drawio`). See [`docs/architecture/README.md`](docs/architecture/README.md).

---

## 2. Core Architecture Rules

1. **UI → Backend → Database (Strict Single Writer)**: The client applications never interact directly with MongoDB. All user registrations, session summaries, MCP configurations, prompt directives, and model settings pass through the authenticated FastAPI gateway (`backend/`).
2. **Agent Holds Zero UI State**: The voice worker (`agent/agent.py`) connects to LiveKit WebRTC for real-time media streams and reads user configuration and tools directly from MongoDB via asynchronous `motor`.
3. **Zero JWT Bloat via Dynamic 2-Step MCP Tool Calling**: Large tool schemas reside in MongoDB Atlas rather than bloating LiveKit JWT tokens. The agent resolves tools dynamically using a 2-step LLM discovery pipeline (`search_mcp_tools` and `execute_mcp_tool`).
4. **Non-Blocking Instant Gateway Startup**: Database bootstrapping (`seed_database_if_empty()`) executes in a background daemon thread, guaranteeing instantaneous ASGI startup and immediate health check readiness on containerized platforms (Docker, Render, Vercel).
5. **Universal Component & Design Token Foundation**: The universal client architecture shares cross-platform domain logic, API clients, and React Native primitives across Android, Web, and Windows desktop targets.

---

## 3. Repository Directory Structure

```
Exia/
├── ui/                             # UI Monorepo Workspace (pnpm 12.16.1 — see ui/README.md)
│   ├── apps/
│   │   ├── mobile/                 # Universal Expo SDK 58 / React Native 0.88 app (Android & Expo Web)
│   │   │   ├── src/app/            # Expo Router file-based routes (tabs, /voice, modals)
│   │   │   ├── src/components/     # Voice controls, chat drawer, waveforms, telemetry tiles
│   │   │   ├── app.json            # Expo configuration (WebRTC plugins, Android permissions)
│   │   │   └── package.json
│   │   ├── web/                    # [LEGACY] Next.js 15 client — migration bridge
│   │   └── windows/                # Planned React Native Windows 0.85 desktop client
│   ├── packages/                   # @exia/* shared monorepo packages
│   │   ├── api-client/             # Typed HTTP client & authentication handlers
│   │   ├── design-tokens/          # Colors (Electric Cyan, Live Emerald), spacing, typography
│   │   ├── shared-logic/           # Formatting, mathematical clamps, URL validation
│   │   ├── shared-types/           # TypeScript API schemas & contracts
│   │   ├── shared-ui/              # Portable React Native primitives (ExiaScreen, ExiaButton, etc.)
│   │   └── test-utils/             # Vitest test mocks & network fixtures
│   ├── BUILD.md                    # Detailed per-app build and run instructions
│   ├── package.json                # Monorepo scripts (mobile:start, web:build, typecheck, test)
│   └── pnpm-workspace.yaml         # pnpm workspace definition
│
├── backend/                        # Central FastAPI Server Gateway
│   ├── main.py                     # Application entry point, lifespan, CORS, and router registry
│   ├── Dockerfile                  # Multi-stage production container build (Astral uv)
│   ├── pyproject.toml / uv.lock    # Python dependencies (uv-managed, Python >= 3.12)
│   └── src/
│       ├── constants/              # Pydantic models, schemas, and collection names
│       ├── routes/                 # REST routers: auth, token, sessions, mcp, prompts, model_config
│       ├── services/               # Connection pooling, query cache, security, auto-seeder
│       └── utils/                  # Token authentication dependencies and password hashing
│
├── agent/                          # Realtime Voice & Vision Agent Worker
│   ├── agent.py                    # LiveKit worker: Silero VAD, Gemini Live/LLM, vision, Mem0
│   ├── db.py                       # Asynchronous MongoDB connection (Motor)
│   ├── mcp_manager.py              # Dynamic MCP tool search and execution engine
│   ├── token_server.py             # Standalone token utility and MCP hub server
│   ├── requirements.txt            # Python dependencies (livekit-agents, mem0ai, motor)
│   └── schema.sql                  # SQLite schema for tasks and memories
│
├── desktop/                        # Windows Desktop Electron Client & Packaging
│   ├── main.js                     # Electron main process (WebRTC permissions & window lifecycle)
│   ├── preload.js                  # Context bridge isolation
│   ├── package.json                # electron-builder packaging configuration (NSIS & portable)
│   └── scripts/sync-dist.js        # Bundle synchronizer from universal web export
│
├── docs/                           # Technical Specifications & Documentation
│   ├── project-overview.md         # Comprehensive project architecture & roadmap
│   ├── database-schema.md          # MongoDB collection schemas & validation
│   ├── expo-ci-cd-apk-build.md     # CI/CD pipeline & GitHub Actions APK build guide
│   ├── desktop-ci-cd-exe-build.md  # Windows .EXE generation guide (GitHub Actions & Electron)
│   ├── web-ci-cd-build.md          # Web client CI/CD & production export guide
│   └── architecture/               # Editable draw.io system diagrams
│
├── mongodb_schema.json             # MongoDB JSON schema definitions
├── users.json                      # Seed acoustic voiceprint profiles
├── .env.example                    # Environment configuration template
└── README.md                       # This document
```

---

## 4. Features & Client Capabilities

### 4-Tab Mission Control Navigation (`ui/apps/mobile`)
1. **Home (`(tabs)/index.tsx`)**: Real-time telemetry dashboard polling backend health (`/api/health`) every 15 seconds, live status pills, latency metrics, workspace KPI tiles (active sessions, registered MCP tools, prompt count), and recent session shortcuts.
2. **History (`(tabs)/history.tsx`)**: Paginated session archive with server-side infinite scroll (`useInfiniteQuery`, page size 10), full-text search across room names and conversation previews, high-contrast date/time stamps, and model filter chips.
3. **Analytics (`(tabs)/analytics.tsx`)**: Granular MongoDB observability dashboard with comprehensive session tracing:
   - *Overview*: Total sessions, token volume (audio + text), tool invocation count, and multi-stage latency waterfall (STT, LLM TTFT, TTS, E2E turn).
   - *Tools*: Registry matrix detailing tool execution counts per MCP server.
   - *Models*: Token accounting comparing prompt vs. completion costs across model providers.
   - *JSON*: Raw telemetry inspector with full session transcript details and clipboard export.
4. **Settings (`(tabs)/settings.tsx`)**: Unified configuration console consolidating all app settings across 4 dedicated modules:
   - *General*: Full theme customizer with 7 palette presets (GN Emerald, Cyberpunk, Cobalt Blue, Crimson Red, Amber Gold, Violet Void, Monokai Dark), dark/solar mode toggles, font size scaling, responsive layout, searchable IANA timezone dropdown modal, and data download/export.
   - *Models*: Multi-engine pipeline setup (switch between Realtime S2S and Modular architectures, configure LiveKit credentials, adjust STT, LLMs, TTS, fallback cascade routing, and acoustic voice profiles).
   - *Prompts*: Persona and directive matrix with dynamic variable pills (`{user_name}`, `{current_time}`, `{active_room}`, `{home_temp}`) and custom directive editor.
   - *MCP Tools*: Model Context Protocol management console (`stdio` or `sse` servers, optimistic toggle switches, tool inspect drawer).

### Immersive Voice & Vision Room (`/voice`)
* **LiveKit WebRTC Integration**: Built with `@livekit/react-native` (3.1.0) and `@livekit/react-native-webrtc` (150.1.1).
* **Audio Visualizer**: 7-bar dynamic `BarVisualizer` modulated in real time by the agent's incoming audio track.
* **Camera & Screen Share**: Prioritized stage rendering with mutual exclusivity between camera and screen capture, hardware camera flipping, and Android foreground service capture.
* **In-Call Chat**: Bi-directional text messaging streamed over the `lk.chat` topic with unread notification badges.
* **Session Lifecycle**: Clean room disconnection with automated backend session finalization (`api.livekit.endSession()`).

---

## 5. Development Quick Start

### Step 1: Start the Backend Gateway
The backend runs by default on port `12568` to pair seamlessly with mobile and web clients:

```bash
cd backend

# Option A: With Astral uv (recommended)
uv run uvicorn main:app --reload --host 0.0.0.0 --port 12568

# Option B: With virtualenv
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 12568
```
* Interactive Swagger API Docs: `http://localhost:12568/docs` (or `http://localhost:12568/api/docs`)
* Health Check: `http://localhost:12568/api/health`

### Step 2: Start the Voice Agent Worker
```bash
cd agent
pip install -r requirements.txt

# Run worker in local dev mode (connects to LiveKit SFU)
python agent.py dev
```

### Step 3: Run the Universal Client (`ui/apps/mobile`)
```bash
# 1. Install workspace dependencies
cd ui
pnpm install

# 2. Start the Metro bundler
pnpm mobile:start

# 3. Launch on Android (device / emulator)
pnpm mobile:android
# Or directly from the app folder:
cd apps/mobile && npx expo run:android

# 4. Launch in Web mode (Expo Web)
pnpm web:start
```
> [!NOTE]
> Standard tabs (Home, History, MCP, Prompts, Settings) run in **Expo Go** or **Expo Web**. However, testing the immersive voice room (`/voice`) requires an **Expo Development Build** (`npx expo run:android`), as LiveKit's native WebRTC C++ drivers cannot run in standard Expo Go.

### Step 4 (Optional): Run the Legacy Next.js Web Client
```bash
cd ui/apps/web
pnpm install
pnpm dev
```
*Open your browser at `http://localhost:3000`.*

---

## 6. Verification Gates & Quality Checks

Run these gates before committing changes to ensure monorepo integrity:

```bash
# From the ui/ directory:
pnpm -r run typecheck                 # TypeScript check across all 7 workspace packages
pnpm test                             # Run Vitest unit tests (19/19 passing)

# From ui/apps/mobile:
npx expo lint                         # ESLint verification (eslint-config-expo)
npx expo-doctor                       # Diagnostic health check (20/20 checks passing)
npx expo export --platform web        # Validates production web bundle compilation
npx expo export --platform android    # Validates production Android Hermes JS bundle
```

---

## 7. Production Builds & Deployment

### A. Android Native APK / AAB Generation (Cloud CI/CD & Local)

#### Option 1: GitHub Actions Cloud Runner Build (Recommended — 100% Free & Zero Laptop Load)
If your local machine has limited RAM/disk or lacks Android Studio/SDK, use the automated GitHub Actions CI/CD pipeline ([`.github/workflows/mobile-ci-cd.yml`](file:///E:/potfolio/Exia/.github/workflows/mobile-ci-cd.yml)). It compiles the Android APK in a hosted Ubuntu cloud runner and makes the `.apk` directly downloadable from the workflow run.

1. Go to the **Actions** tab in your GitHub repository.
2. Select **"Exia Mobile — CI/CD & Android APK Build"**.
3. Click **Run workflow**, choose `apk-debug` (or `apk-release`), and click **Run workflow**.
4. Once completed (4–6 mins), scroll to the **Artifacts** section at the bottom to download `exia-mobile-apk-debug.zip` containing the installable `.apk`.
> 📖 See [`docs/expo-ci-cd-apk-build.md`](docs/expo-ci-cd-apk-build.md) for detailed step-by-step instructions.

#### Option 2: Cloud Build via Expo Application Services (EAS)
EAS Build compiles clean native Android binaries in Expo's cloud without requiring a local Android SDK or C++ toolchains:

```bash
# 1. Install EAS CLI globally (recommended)
npm install -g eas-cli

# 2. Authenticate with your Expo account
eas login

# 3. Trigger cloud build from the mobile app directory
cd ui/apps/mobile

# Build standalone installable APK (Preview profile - perfect for testing & sideloading):
eas build -p android --profile preview

# Build production Android App Bundle (Production profile - ready for Google Play Store):
eas build -p android --profile production
```
*(Alternative without global install: run `pnpm dlx eas-cli login` and `pnpm dlx eas-cli build -p android --profile preview`)*

#### Option 3: Local Native Build via Gradle (Requires Local Android Studio & SDK)
```bash
cd ui/apps/mobile

# Generate Android native project via Continuous Native Generation (CNG)
npx expo prebuild -p android

# Build Release APK locally via Gradle
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### B. Production Web Export & CI/CD (Static SPA)

#### Option 1: GitHub Actions Cloud Runner Build
1. Go to the **Actions** tab on GitHub.
2. Select **"Exia Web — CI/CD & Production Build"**.
3. Click **Run workflow** → Choose `artifact-only` (downloadable ZIP) or `github-pages` (live hosted site).
4. Download the `exia-web-production` bundle or visit your live GitHub Pages URL.
> 📖 See [`docs/web-ci-cd-build.md`](docs/web-ci-cd-build.md) for full instructions.

#### Option 2: Local Web Export
```bash
cd ui/apps/mobile
npx expo export --platform web
# Output: ui/apps/mobile/dist/

# Test locally with SPA fallback routing:
npx serve -s dist
```

### C. Windows Desktop Executable (.EXE) Generation

#### Option 1: GitHub Actions Cloud Runner Build (Zero Local Load — Recommended)
Compile both the standard Windows Setup Installer (`Exia Setup.exe`) and portable standalone executable (`Exia-portable.exe`) on GitHub's hosted Windows cloud runners:
1. Open the **Actions** tab on GitHub.
2. Select **"Exia Desktop — Windows EXE Build"**.
3. Click **Run workflow** → Choose `all` (or `portable` / `nsis`) → Click **Run workflow**.
4. Download the compiled `.exe` files directly from the **Artifacts** table at the bottom of the completed run.
> 📖 See [`docs/desktop-ci-cd-exe-build.md`](docs/desktop-ci-cd-exe-build.md) for full instructions.

#### Option 2: Local Electron Build
```bash
# 1. Export production web bundle from UI
cd ui && pnpm web:build

# 2. Package standalone Windows .exe using electron-builder
cd ../desktop
npm install
npm run build:exe

# Output: desktop/dist-electron/
# • Exia Setup 0.1.0.exe (NSIS Installer)
# • Exia-portable-0.1.0.exe (Portable Standalone)
```

### D. Backend Containerization (Docker)
Build and run the FastAPI backend gateway, mapping host port `12568` to internal container port `8000`:

```bash
# Build Docker image
docker build -t exia-backend backend/

# Run container with environment configuration
docker run -d \
  --name exia-backend \
  -p 12568:8000 \
  --env-file backend/.env \
  exia-backend
```

### D. Deploy Backend to Render
1. Create a new **Web Service** on Render connected to this repository.
2. Select **Runtime:** `Docker`.
3. Set **Root Directory:** *(leave blank — repository root)*.
4. Set **Dockerfile Path:** `backend/Dockerfile`.
5. Set **Docker Build Context:** `backend`.
6. Leave **Build Command** and **Start Command** blank (Render uses the Dockerfile's `CMD`).
7. Add environment variables: `MONGODB_URI`, `MONGODB_DATABASE`, `JWT_SECRET`, `LIVEKIT_API_HOST`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`.

---

## 8. Environment Configuration Matrix

Create a `.env` file in `backend/` and `agent/` based on `.env.example`:

| Variable | Required | Example / Default | Target | Purpose |
|---|---|---|---|---|
| `JWT_SECRET` | **Yes** | `super_secret_jwt_signing_key_exia_2026` | Backend | Cryptographic secret for signing JWT access & refresh tokens |
| `JWT_ALGORITHM` | No | `HS256` | Backend | JWT algorithm |
| `PORT` | No | `12568` (Local) / `8000` (Docker) | Backend | Network port for FastAPI server |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017` or Atlas URI | Backend & Agent | MongoDB connection string |
| `MONGODB_DATABASE` | **Yes** | `exia_db` | Backend & Agent | Database name |
| `LIVEKIT_URL` / `LIVEKIT_API_HOST` | **Yes** | `wss://<project>.livekit.cloud` | Backend & Agent | WebSocket endpoint for LiveKit SFU server |
| `LIVEKIT_API_KEY` | **Yes** | `APIxxxxxxxxx` | Backend & Agent | LiveKit API Key for room tokens and management |
| `LIVEKIT_API_SECRET` | **Yes** | `sec_yyyyyyyyyyyyyyyyyy` | Backend & Agent | LiveKit API Secret for HMAC signing |
| `GEMINI_API_KEY` | Optional | `AIzaxxxxxxxxxxxxx` | Agent | Google Gemini Live API key |
| `OPENAI_API_KEY` | Optional | `ollama` or `sk-xxxx` | Agent | OpenAI or local model key |
| `OPENAI_BASE_URL` | Optional | `http://localhost:11434/v1` | Agent | Local Ollama / LM Studio endpoint |
| `SPEECHMATICS_API_KEY` | Optional | `sm_xxxxxxxxxxxxx` | Agent | Speechmatics Ursa/Linden-1 STT and diarization |
| `CARTESIA_API_KEY` | Optional | `car_xxxxxxxxxxxx` | Agent | Cartesia Sonic TTS provider key |
| `MEM0_API_KEY` | Optional | `m0-xxxxxxxxxxxx` | Agent | Mem0 managed vector memory key (if cloud-hosted) |
| `EXPO_PUBLIC_API_URL` | No | `http://127.0.0.1:12568/api` | Mobile/Web | Inlined frontend API base URL.<br>• **Android Emulator**: `http://10.0.2.2:12568/api`<br>• **Physical Device**: `http://<LAN_IP>:12568/api` |

> [!WARNING]
> `EXPO_PUBLIC_*` variables are inlined into the client bundle at build time. Never place database passwords, LiveKit secrets, or private API keys into frontend environment variables.

---

## 9. License

Exia is open-source software licensed under the MIT License.
