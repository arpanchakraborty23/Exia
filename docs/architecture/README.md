# Exia — Architecture Diagrams

Editable draw.io diagrams describing the Exia home assistant. Open any file at
[app.diagrams.net](https://app.diagrams.net) (**File → Open**), in the
[integrations market place](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)
VS Code extension, or drag-and-drop into the draw.io editor.

| File | Diagram | Shows |
| --- | --- | --- |
| `exia-high-level-architecture.drawio` | **Main architecture** | UI → Backend → MongoDB data rule, and the UI ↔ LiveKit ↔ Agent realtime side-connection |
| `exia-backend-server.drawio` | **Backend server (cloud icons)** | FastAPI gateway internals — middleware, route modules, services, static SPA server — and its cloud targets (MongoDB Atlas, LiveKit Cloud) |
| `exia-voice-agent.drawio` | **Voice agent (cloud icons)** | LiveKit agent worker internals — VAD/STT/LLM/TTS pipeline, vision, Mem0, MCP engine — and its cloud targets (MongoDB Atlas, OpenAI, Gemini, SSE endpoints) |

## Core design rule depicted

- **UI → Backend → DB (only path for user data).** Every piece of data entered
  in the UI (accounts, MCP servers, prompts, model config) travels over HTTPS
  REST with a JWT bearer token to the FastAPI backend, which persists it into
  MongoDB (`home_assistant` database). The UI never touches the database.
- **Agent has nothing.** The Python voice agent holds no persistent state and
  receives **no UI data whatsoever**. For realtime voice it talks only to the
  LiveKit SFU (WebRTC), never to the UI.
- **Agent → DB for user data (read side).** At session start the agent pulls
  user data straight from MongoDB (`mcp_servers`, prompts, memories, tasks)
  and syncs session events — the database is the only bridge between the UI's
  data and the agent.

## Legend (used across all diagrams)

- **Cloud shapes** — hosted cloud services (MongoDB Atlas, LiveKit Cloud, OpenAI, Gemini, SSE endpoints)
- **Green arrows** — data flow from the UI, written by the Backend
- **Teal arrows** — realtime WebRTC media (nothing is stored)
- **Purple arrows** — agent ↔ database user-data access
- **Dashed grey** — optional / local fallbacks and static serving
