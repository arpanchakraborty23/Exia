# Exia — Multimodal AI Assistant & Voice Platform

A private, real-time multimodal personal AI assistant and voice agent platform. Powered by **LiveKit WebRTC**, **Google Gemini Live / Local LLMs**, **Model Context Protocol (MCP)**, **Mem0 Universal Memory**, and **MongoDB Atlas**.

---

## 1. System Architecture & How It Works

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                      Client Ecosystem (ui/ Monorepo)                          │
│        React 19 + TypeScript + Next.js 15 + Tailwind CSS v4                   │
│                                                                               │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────────┐ │
│  │   LiveKit Voice Stage   │  │             Mission Control Hub             │ │
│  │  • 5 Reactive Waveforms │  │  • Direct in-browser Token Studio (JWT)     │ │
│  │  • RoomAudioRenderer    │  │  • MCP Server Registry (Stdio / SSE)        │ │
│  │  • Vision & Screen Cam  │  │  • Model Config (Gemini Live / Ollama)      │ │
│  │  • Realtime Transcript  │  │  • Directive Matrix & Custom Prompts        │ │
│  └────────────▲────────────┘  └──────────────────────▲──────────────────────┘ │
└───────────────┼──────────────────────────────────────┼────────────────────────┘
                │ WebRTC Opus Audio & Video Track      │ HTTPS REST (JWT Bearer)
                ▼                                      ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                 LiveKit Realtime Server (Local / Cloud SFU)                   │
│             ws://localhost:7880  or  wss://<project>.livekit.cloud            │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │ WebRTC Room Protocol
                                ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                   LiveKit Voice Agent Worker (agent/agent.py)                 │
│                                                                               │
│  ┌───────────────────────┐   ┌─────────────────────────────────────────────┐  │
│  │  Multimodal Voice     │   │  Mem0 Adaptive Memory Engine                │  │
│  │  • Gemini Live / LLMs │   │  • User facts, preferences, entities        │  │
│  │  • Silero VAD         │   │  • SQLite + Vector store retrieval          │  │
│  │  • Visual Feed Vision │   │  • Injects past context dynamically         │  │
│  └───────────────────────┘   └─────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │  Model Context Protocol (MCP) Client Engine                             │  │
│  │  • Dynamic 2-step tool calling (search_mcp_tools & execute_mcp_tool)    │  │
│  │  • Local filesystem CLI (`@modelcontextprotocol/server-filesystem`)     │  │
│  │  • Custom Stdio / SSE MCP Servers registered in MongoDB                 │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
                                ▲
                                │ Direct Database Queries
                                ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                     FastAPI Gateway Server (backend/)                         │
│       Single Writer of all UI data to MongoDB Atlas / Local MongoDB           │
└───────────────────────────────────────────────────────────────────────────────┘
```

> 🗺️ **Editable Architecture Diagrams (draw.io):** [`docs/architecture/exia-high-level-architecture.drawio`](docs/architecture/) — includes backend server (`exia-backend-server.drawio`) and voice agent (`exia-voice-agent.drawio`). See [`docs/architecture/README.md`](docs/architecture/README.md).

---

## 2. Core Architecture Rules

1. **UI → Backend → Database**: The UI never communicates directly with the database. All account registrations, MCP servers, prompt directives, and model configurations pass through the FastAPI backend with JWT authentication.
2. **Agent Holds Zero UI State**: The voice agent worker connects to LiveKit WebRTC for audio/video streaming and reads configuration and tools dynamically from MongoDB.
3. **No JWT Token Bloat**: Large tool schemas reside in MongoDB Atlas rather than bloating LiveKit JWT tokens; the agent resolves tools dynamically using a 2-step search and execute pipeline.
4. **Three Native Client Surfaces**: A single Next.js 15 UI codebase powers the Web application, the Android native shell, and the Windows desktop shell.

---

## 3. Repository Directory Structure

```
Exia/
├── ui/                             # Frontend Client Monorepo
│   ├── web/                        # Core Web Application — Next.js 15, React 19, Tailwind CSS v4
│   ├── android/                    # Android Shell — Capacitor 8 (compiles native APK / AAB)
│   └── windows/                    # Windows Desktop Shell — Tauri 2 + Rust (WebView2 native app)
│
├── backend/                        # Central FastAPI Server Gateway
│   ├── main.py                     # Primary FastAPI application gateway (local & production)
│   ├── main_vercel.py              # Serverless entrypoint for Vercel deployment
│   ├── pyproject.toml / uv.lock    # Python dependencies (managed via Astral uv)
│   ├── dist/                       # Static production SPA export fallback
│   └── src/
│       ├── constants/              # Application settings, Pydantic schemas, collection names
│       ├── routes/                 # REST routers (auth, token, sessions, mcp, prompts, models)
│       ├── services/               # Database pooling, query cache, security, auto-seeder
│       └── utils/                  # Authentication dependencies and cryptography helpers
│
├── agent/                          # Realtime Voice & Vision Agent Worker
│   ├── agent.py                    # Voice worker: Silero VAD, Gemini Live/LLMs, Vision, Mem0
│   ├── db.py                       # MongoDB connection & document queries
│   ├── mcp_manager.py              # Dynamic MCP tool search and execution engine
│   ├── token_server.py             # Standalone token utility server
│   ├── requirements.txt            # Python dependencies (livekit-agents, mem0ai, motor)
│   └── schema.sql                  # SQLite schema for tasks and memories
│
├── scripts/                        # Centralized Build & Deployment Automation
│   ├── desktop.sh                  # Tauri 2 Windows desktop compile pipeline
│   ├── android.sh                  # Capacitor Android APK/AAB compile pipeline
│   ├── compile.sh                  # Unified multi-target build dispatcher
│   └── vercel.sh                   # Vercel serverless cloud deployment script
│
├── docs/                           # Technical Specifications & Documentation
│   ├── project-overview.md         # Comprehensive project architecture & roadmap
│   ├── desktop-architecture.md     # Tauri 2 Windows client technical guide
│   ├── web-architecture.md         # Vercel serverless architecture guide
│   ├── database-schema.md          # MongoDB collection schemas & validation
│   └── architecture/               # Editable draw.io system diagrams
│
├── mongodb_schema.json             # MongoDB JSON schema definitions
├── .env.example                    # Environment configuration template
└── README.md                       # This document
```

---

## 4. Development Quick Start

### Step 1: Start the Backend Gateway
```bash
cd backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*Interactive API docs available at: `http://localhost:8000/api/docs`.*

### Step 2: Start the Voice Agent Worker
```bash
cd agent
pip install -r requirements.txt
python agent.py dev
```

### Step 3: Run the Web Client
```bash
cd ui/web
pnpm install
pnpm dev
```
*Open your browser at `http://localhost:3000`.*

---

## 5. Client & Cloud Build Pipelines (`scripts/`)

Build and packaging scripts are centralized in the [`scripts/`](file:///e:/potfolio/Exia/scripts) directory:

### A. Windows Desktop Application (Tauri 2)
```bash
# Production release build (NSIS installer & binary mirrored to release/)
./scripts/desktop.sh

# Fast debug build
./scripts/desktop.sh --debug

# Build Tauri shell using existing web export without rebuilding Next.js
./scripts/desktop.sh --skip-web
```

### B. Android Native Application (Capacitor)
```bash
# Debug APK compilation (mirrored to release/Exia-debug.apk)
./scripts/android.sh

# Production release APK compilation
./scripts/android.sh --release

# Sync web assets to Android shell without running Gradle
./scripts/android.sh --sync-only

# Sync assets and open project directly in Android Studio
./scripts/android.sh --open
```

### C. Unified Compilation Dispatcher
```bash
# Compile specific target
./scripts/compile.sh desktop --release
./scripts/compile.sh android --debug
./scripts/compile.sh web

# Compile all client targets
./scripts/compile.sh all
```

### D. Deploy Backend to Vercel
```bash
./scripts/vercel.sh --prod
```

### E. Deploy Backend to Render

Configure the Render web service to use Docker:

- **Root Directory:** `backend`
- **Runtime:** Docker
- **Dockerfile Path:** `./Dockerfile`
- **Docker Build Context Directory:** `.`

The multi-stage Dockerfile installs the backend dependencies and starts the FastAPI server on Render's assigned port. No separate Render build or start command is needed.
