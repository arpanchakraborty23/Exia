# HomeAssistant - Private Desktop AI Assistant

A 100% private, local-first Desktop AI Assistant built as an alternative to ChatGPT for your daily tasks, agenda, long-term memory, and local device control. Powered by **LiveKit WebRTC**, **Model Context Protocol (MCP)**, **Local LLMs**, and **SQLite**.

---

## 1. System Architecture & How It Works

```
┌────────────────────────────────────────────────────────────────────────┐
│               Local Desktop Application (Frontend)                     │
│               React 19 + TypeScript + Tailwind CSS                     │
│                                                                        │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────┐ │
│  │   LiveKit Voice Stage   │  │       Assistant Control Hub          │ │
│  │  • LiveKit Visualizer   │  │  • Daily Tasks & Routines (SQLite)   │ │
│  │  • RoomAudioRenderer    │  │  • Long-Term Memory (FTS5 Search)    │ │
│  │  • Mic & State Controls │  │  • MCP Server Registry & Tools       │ │
│  │  • Realtime Transcript  │  │  • Local LLM Settings (Ollama/etc.)  │ │
│  └────────────▲────────────┘  └──────────────────▲───────────────────┘ │
└───────────────┼──────────────────────────────────┼─────────────────────┘
                │ WebRTC Audio & Data Channel      │ Local IPC / HTTP / SQLite
                ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 LiveKit Server (Local / Cloud)                         │
│             ws://localhost:7880  or  LiveKit Cloud                     │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Backend Agent Worker (Python)                        │
│                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │  Local / Private LLM  │   │  SQLite Database (`assistant.db`)    │  │
│  │  • Ollama (Llama 3.2) │   │  • `tasks`: Daily agenda & reminders │  │
│  │  • DeepSeek R1 / Qwen │   │  • `memories`: Facts & preferences   │  │
│  │  • Gemini Flash API   │   │  • `mcp_servers`: Tool configurations│  │
│  └───────────────────────┘   └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Model Context Protocol (MCP) Client Engine                      │  │
│  │  • Local Filesystem (`@modelcontextprotocol/server-filesystem`)  │  │
│  │  • Windows Desktop Automation (Notifications, Apps, Stats)       │  │
│  │  • Custom Stdio / SSE MCP Servers                                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Research: UI & Database Architecture

### A. LiveKit UI Components
- **`@livekit/components-react` & `@livekit/components-styles`**: Integrated for native WebRTC room management:
  - `<LiveKitRoom>` manages the WebRTC session, tracks, and data channel.
  - `<RoomAudioRenderer>` automatically decodes and renders incoming assistant audio.
  - `<BarVisualizer>` and custom reactive visualizers animate dynamically based on whether the assistant is **Listening**, **Thinking**, or **Speaking**.
  - Interactive stage handles both live WebRTC connections and instant local testing.

### B. Local Database Selection: Why SQLite?
1. **Zero External Daemon**: Runs in-process on your desktop; no heavy Docker/Postgres service required just for daily notes and tasks.
2. **Microsecond Latency**: Instantaneous read/write for assistant context injection during voice queries.
3. **Built-in Full-Text Search (FTS5)**: Enables instant keyword and phrase search over past memories and notes.
4. **Vector Ready**: Can be paired with `sqlite-vec` or Chroma for local semantic embeddings.
5. **Portability**: All data stays in a single file (`backend/assistant.db`), ensuring 100% privacy and easy backup.

*Database Schema is available at: `backend/schema.sql`.*

### C. Model Context Protocol (MCP) & MongoDB Atlas Direct Storage
- **Check Connect & Direct Save**: In the UI, adding an MCP server tests connectivity and stores the server record and its tool schemas directly into MongoDB Atlas (`mcp_servers` collection).
- **No Token Metadata Bloat**: Because tool specifications reside directly in MongoDB Atlas, they are **not** stuffed into the LiveKit JWT token metadata. The agent queries MongoDB Atlas dynamically.
- Supports both **`stdio`** (CLI tools like `npx`, `python`, `uvx`) and **`sse`** (HTTP endpoints).

### D. Lightweight LiveKit Token Studio (Session ID & Identity)
- **Compact Token (~300 Bytes)**: Passes only `session_id` and `identity` (plus model & memory partition references) in the token metadata. Eliminates token bloat and avoids JWT header limits.
- **Direct In-Browser Token Minting**: Uses native Web Crypto API (`window.crypto.subtle`) to sign authentic LiveKit HS256 JWT access tokens directly on the client side with zero server dependency.
- **Backend Token Server Integration**: Calls `POST http://localhost:8000/api/token` to record the session in MongoDB Atlas `sessions` collection.
- **One-Click Connect**: Press **"Join Voice Room with Token"** to immediately activate the LiveKit audio session.

### E. Session History from MongoDB Atlas
- **UI History Browser**: In the Token Studio view, users can click the **"Session History"** tab to view past sessions fetched directly from MongoDB Atlas (`sessions` collection via `GET /api/sessions`).
- **Session Inspector**: Inspect session ID, participant identity, room name, model used, and timestamp.

---

## 3. Directory Structure

```
HomeAsstant/
├── frontend/                     # Desktop Application Frontend
│   ├── electron/                 # Desktop Window wrapper (Electron)
│   │   ├── main.cjs
│   │   └── preload.cjs
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Top status bar (LiveKit, SQLite, MCP badges)
│   │   │   ├── Sidebar.tsx       # Navigation tabs (Voice, Tasks, Memory, MCP, Token Studio, Settings)
│   │   │   ├── VoiceAssistantView.tsx  # Voice visualizer stage & transcript
│   │   │   ├── LiveKitVoiceWrapper.tsx # @livekit/components-react integration
│   │   │   ├── TasksView.tsx     # Daily task manager & routines
│   │   │   ├── MemoryView.tsx    # Long-term memory browser & FTS search
│   │   │   ├── MCPView.tsx       # MCP Server Hub & tool manager
│   │   │   ├── TokenStudioView.tsx # In-UI LiveKit Token Creator & JWT Inspector
│   │   │   └── SettingsView.tsx  # MongoDB Atlas, Models, Mem0 & MCP settings
│   │   ├── services/
│   │   │   └── tokenService.ts   # In-UI Web Crypto JWT minting & token server client
│   │   ├── store/
│   │   │   └── initialData.ts    # Seed data & localStorage persistence
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript type definitions
│   │   ├── App.tsx               # Root view orchestrator
│   │   ├── index.css             # Tailwind CSS & custom styling
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── backend/                      # Assistant Agent & Database
    ├── README.md                 # Backend architecture guide
    ├── token_server.py           # FastAPI LiveKit token server + MongoDB recorder
    ├── agent.py                  # LiveKit voice worker with Mem0 SQLite & MCP
    ├── db.py                     # Motor/MongoDB schemas (sessions, mcp_servers, token_metadata)
    ├── mcp_manager.py            # 2-step tool pipeline: search_mcp_tools & execute_mcp_tool
    └── schema.sql                # Complete SQLite database schema
```

---

## 4. How to Run the Frontend Right Now

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser or desktop window at:
   ```
   http://localhost:5173
   ```

4. Build for production:
   ```bash
   npm run build
   ```
