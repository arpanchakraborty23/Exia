# Home Assistant — LiveKit Voice Agent App
## Requirements Document (v0.1)

## 1. Overview

A self-hosted, personal AI home assistant delivered as a responsive web app. Users talk to a voice agent (LiveKit room + Gemini Live) through a browser UI that also lets them manage sessions, MCP tool connections, saved prompts, model choices, and account settings.

**Core pieces:** Frontend (web, responsive) → Backend (FastAPI + DB) → Voice Agent Worker (LiveKit + Gemini Live).

---

## 2. Frontend Requirements

### 2.1 Auth
- Login screen (email/username + password)
- Persisted session (JWT or session cookie) so the user stays logged in across visits
- Logout action

### 2.2 Navigation / Screens
| Screen | Purpose |
|---|---|
| **Session** | Active voice-agent screen — start/join a LiveKit room, talk to the assistant, see live transcript/status |
| **Session History** | List of past sessions, each opens to view transcript / summary / metadata |
| **MCP** | Add, edit, remove MCP server connections (name, URL, auth, enabled/disabled) — persisted to DB |
| **Prompts** | Create/save/edit small reusable prompts (system instructions, quick commands) — persisted to DB |
| **Model Selection** | Choose STT, LLM, and TTS providers/models (or a single "Gemini Live" mode) — persisted to DB |
| **Settings** | Change password, manage account |

### 2.3 Responsiveness
- Single codebase, responsive layout (desktop + mobile web)
- Mobile: collapsible/bottom nav; the Session screen should be usable one-handed (large mic button, minimal chrome)
- Framework-agnostic requirement — pick React/Next, Vue, or similar; must support LiveKit's JS/React SDK

### 2.4 Real-time / UX
- Live connection state indicator (connecting / listening / thinking / speaking)
- Live or near-live transcript during a session
- Graceful reconnect handling if the LiveKit connection drops

---

## 3. Backend Requirements (FastAPI)

### 3.1 Auth
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/change-password`
- Password hashing (bcrypt/argon2), JWT issuance + refresh (or session-based, pick one)

### 3.2 LiveKit Integration
- `POST /livekit/token` — issue a LiveKit access token scoped to the user, to join a room
- `POST /sessions/start` — create a session record, provision a LiveKit room, dispatch the agent worker to it
- `POST /sessions/{id}/end` — close the room, finalize the session record

### 3.3 Session History
- `GET /sessions` — list past sessions (paginated)
- `GET /sessions/{id}` — full session detail (transcript, model used, duration, MCP tools invoked)
- Session data persisted from the agent worker as the session runs (or on close)

### 3.4 MCP Management
- `GET /mcp` / `POST /mcp` / `PUT /mcp/{id}` / `DELETE /mcp/{id}`
- Store: name, server URL/command, auth/credentials (encrypted at rest), enabled flag
- Validate/health-check an MCP connection before saving (optional but recommended)

### 3.5 Prompts
- `GET /prompts` / `POST /prompts` / `PUT /prompts/{id}` / `DELETE /prompts/{id}`
- Store: title, prompt text, maybe a "type" (system prompt vs. quick command), created/updated timestamps

### 3.6 Model Selection
- `GET /models/config` / `PUT /models/config`
- Store per-user: STT provider+model, LLM provider+model, TTS provider+model, and/or a flag for "Gemini Live" unified mode
- Backend passes this config to the agent worker when dispatching a session

### 3.7 Data Model (proposed tables)
- `users` (id, email, password_hash, created_at)
- `sessions` (id, user_id, room_name, started_at, ended_at, status, model_config_snapshot)
- `session_events` or `transcripts` (id, session_id, role, text, timestamp)
- `mcp_servers` (id, user_id, name, url, credentials_encrypted, enabled)
- `prompts` (id, user_id, title, content, type, created_at, updated_at)
- `model_config` (id, user_id, stt_provider, stt_model, llm_provider, llm_model, tts_provider, tts_model, mode)

### 3.8 Cross-cutting
- Encrypt MCP credentials at rest
- Rate limiting on auth endpoints
- CORS config for the frontend origin
- Structured logging per session for debugging voice-agent behavior

---

## 4. Voice Agent Requirements (LiveKit + Gemini Live)

### 4.1 Architecture
- LiveKit Agents worker (Python) dispatched per session, joins the room the backend created
- Worker reads the user's active `model_config` at session start to decide its pipeline

### 4.2 Two modes to decide between (see Open Questions)
- **Gemini Live mode**: native speech-to-speech via Gemini Live API — no separate STT/TTS needed, lowest latency, but locks the LLM to Gemini
- **Modular pipeline mode**: separate STT → LLM → TTS stages, letting the user swap providers per the Model Selection screen — more flexible, higher latency, more moving parts

### 4.3 Tooling / MCP
- Agent worker loads the user's enabled MCP servers as tool sources at session start
- Tool calls and results should be logged into `session_events`/transcript for visibility in Session History

### 4.4 Prompts
- Agent worker fetches the user's active/default system prompt (and any quick prompts) from `/prompts` at session start, injects into the LLM context

### 4.5 Session Lifecycle
1. Frontend calls `/sessions/start` → backend provisions room + dispatches agent
2. Agent joins, loads model_config + prompts + MCP tools
3. Agent streams transcript/events back (via LiveKit data channel or backend callback) → persisted
4. On disconnect/timeout/explicit end → `/sessions/{id}/end` finalizes the record

---

## 5. Open Questions / Decisions Needed

1. **Gemini Live vs. modular STT/LLM/TTS** — will Model Selection let the user pick "Gemini Live" as one mode among others, or is Gemini Live the only path and STT/LLM/TTS selection applies only when *not* using it?
2. **MCP credential storage** — symmetric encryption key management (env var, KMS, etc.)?
3. **Auth strategy** — JWT (stateless, easier for mobile web) vs. server session (simpler revocation)?
4. **Transcript streaming** — LiveKit data channel to frontend live, backend webhook, or both?
5. **Multi-user vs. single-user** — is this strictly for you, or should it support multiple accounts from day one?
6. **Deployment target** — given your existing stack (Docker/K8s/AWS), confirm if this follows the same deployment pattern as Nuralytics/ARIA or runs separately.

---

*This is a requirements draft — intended to lock scope before further development, not a final spec. Flag anything above that's wrong or missing before implementation starts.*
