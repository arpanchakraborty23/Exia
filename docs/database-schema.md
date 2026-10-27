# Exia Database Schemas & Architecture Specification (MongoDB)

> **Document:** `docs/database-schema.md`  
> **Database:** MongoDB 7.0+ (MongoDB Atlas or Self-Hosted)  
> **Database Name:** `exia_db`  
> **Target Runtimes:** FastAPI Backend (`backend/`), LiveKit Python Voice Agent (`agent/`), Next.js 15 UI (`frontend/`)  

---

## 1. Executive Summary & Design Principles

Exia uses **one single, unified MongoDB database** (`exia_db`) shared between the **FastAPI REST API server** and the **LiveKit Python Voice Agent Worker**. The database serves as the persistent state layer and real-time operational bridge:

```
                      ┌─────────────────────────────────────────┐
                      │            Exia Web Frontend            │
                      │ (Next.js 15, LiveKit React Components)  │
                      └─────────────┬───────────────────────────┘
                                    │
                  REST APIs / JWT   │       LiveKit WebRTC
                  (Prompts, Models, │     (Voice, Camera, Screen,
                   MCP, Analytics)  │      Audio Visualizer)
                                    ▼                   ▼
                      ┌───────────────────┐    ┌──────────────────┐
                      │  FastAPI Backend  │    │ LiveKit Voice    │
                      │  (Admin, Tokens,  │    │ Agent Worker     │
                      │   CRUD, Analytics)│    │ (STT, LLM, TTS,  │
                      └─────────┬─────────┘    │  MCP, Mem0, VAD) │
                                │              └────────┬─────────┘
                                │                       │
                                │   pymongo / motor     │
                                └───► ┌───────────┐ ◄───┘
                                      │  MongoDB  │
                                      │ (exia_db) │
                                      └───────────┘
```

### Core Tenets
1. **Zero Token Bloat**: MCP tool schemas, skill instructions, and prompt matrices are stored directly in MongoDB rather than serialized into LiveKit WebRTC JWT tokens.
2. **Read/Write Segregation**:
   - **Frontend $\rightarrow$ Backend $\rightarrow$ MongoDB**: All user-configured settings (passwords, prompt directives, active models, registered MCP servers) are written strictly through FastAPI.
   - **Agent $\leftrightarrow$ MongoDB**: At session start, the agent reads the active configurations and persists live turn-by-turn metrics, token usage, latency benchmarks, and session summaries.
3. **Non-Blocking Telemetry**: Live turn logs and latency metrics are updated using atomic MongoDB operators (`$set`, `$inc`, `$push`) in non-blocking async tasks (`asyncio.create_task`), eliminating audio stream jitter.

---

## 2. Collections Overview Matrix

| # | Collection Name | Purpose | Primary Read | Primary Write | Index Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **`users`** | Operator authentication, profiles & roles | Backend Auth | Backend Auth | Unique `email`, Unique `user_id` |
| 2 | **`token_blacklist`** | Revoked JWT access & refresh tokens | Auth Middleware | Backend Logout | Unique `token`, TTL auto-purge `expires_at` |
| 3 | **`sessions`** | Master voice session metadata & telemetry | Analytics & History UI | Backend & Agent Worker | Unique `session_id`, `(user_id, created_at)` |
| 4 | **`session_turns`** | Turn-by-turn transcripts, tool calls & latency waterfalls | History Detail, Inspector | Agent Worker | Unique `(session_id, turn_index)`, `(user_id, timestamp)` |
| 5 | **`mcp_servers`** | Discovered MCP tools, schemas & transports | Agent Worker, MCP Studio | Backend & Live Health Ping | Unique `(user_id, server_name)`, `status` |
| 6 | **`prompts`** | System personas, base instructions, quick macros & skills | Agent Worker, Prompts UI | Backend / Operator | `(user_id, type)`, Unique `prompt_id`, `is_default` |
| 7 | **`model_configs`** | Pipeline configuration (`gemini_live` vs `modular`) | Agent Worker, Engine UI | Backend / Operator | Unique `user_id` |
| 8 | **`agent_memories`** | Long-term semantic memories and user facts (Mem0) | Agent Worker Context | Agent Worker Hook | `(user_id, updated_at)`, `category` |
| 9 | **`voice_profiles`** | Speaker diarization & voice recognition profiles | Agent STT Worker, Settings | Backend & Agent Worker | Unique `profile_id`, `(user_id, speaker_name)` |

---

## 3. Detailed Collection Schemas

---

### 3.1. `users` Collection

Stores authenticated operators, roles, and UI preferences.

```javascript
// Index Definitions
db.users.createIndex({ "email": 1 }, { unique: true, name: "idx_users_email_unique" });
db.users.createIndex({ "user_id": 1 }, { unique: true, name: "idx_users_user_id_unique" });
```

#### JSON Schema Validator
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["user_id", "name", "email", "hash_password", "created_at"],
    "properties": {
      "user_id": {
        "bsonType": "string",
        "description": "Unique user ID (e.g., usr_7x9q2m4k)"
      },
      "name": {
        "bsonType": "string",
        "minLength": 2,
        "maxLength": 100
      },
      "email": {
        "bsonType": "string",
        "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      },
      "hash_password": {
        "bsonType": "string",
        "description": "bcrypt/argon2 hashed password"
      },
      "avatar_url": {
        "bsonType": ["string", "null"]
      },
      "role": {
        "enum": ["operator", "admin", "guest"]
      },
      "preferences": {
        "bsonType": "object",
        "properties": {
          "theme": { "enum": ["dark", "light", "system"] },
          "default_pipeline": { "enum": ["gemini_live", "modular"] }
        }
      },
      "created_at": { "bsonType": "date" },
      "updated_at": { "bsonType": "date" }
    }
  }
}
```

---

### 3.2. `token_blacklist` Collection

Stores revoked JWT identifiers (`jti`) upon operator logout. Automatically purges expired records using MongoDB TTL indexing.

```javascript
// Index Definitions
db.token_blacklist.createIndex({ "token": 1 }, { unique: true, name: "idx_blacklist_token" });
db.token_blacklist.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0, name: "idx_blacklist_ttl" });
```

#### Document Shape
```json
{
  "_id": { "$oid": "671e00112233445566778899" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "jti": "b0a5e8c1-3f2d-4d7a-8f4b-1c5e9d2a6f8b",
  "token_type": "access",
  "user_id": "usr_7x9q2m4k",
  "expires_at": { "$date": "2026-10-27T09:00:00.000Z" },
  "blacklisted_at": { "$date": "2026-10-27T08:15:00.000Z" }
}
```

---

### 3.3. `sessions` Collection

The master voice session log. Powers the **Session History (`⌘2`)** and **Analytics & Observability (`⌘3`)** dashboards.

```javascript
// Index Definitions
db.sessions.createIndex({ "session_id": 1 }, { unique: true, name: "idx_session_id_unique" });
db.sessions.createIndex({ "user_id": 1, "created_at": -1 }, { name: "idx_user_sessions_timeline" });
db.sessions.createIndex({ "room_name": 1 }, { name: "idx_room_name" });
db.sessions.createIndex({ "status": 1 }, { name: "idx_session_status" });
```

#### JSON Schema Validator
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["session_id", "user_id", "room_name", "status", "created_at"],
    "properties": {
      "session_id": {
        "bsonType": "string",
        "description": "Unique session ID (e.g., ses_08a3f9e2)"
      },
      "user_id": {
        "bsonType": "string"
      },
      "room_name": {
        "bsonType": "string",
        "description": "LiveKit WebRTC room name"
      },
      "participant_name": {
        "bsonType": "string"
      },
      "status": {
        "enum": ["initializing", "active", "completed", "failed", "aborted", "ended"]
      },
      "pipeline_mode": {
        "enum": ["gemini_live", "modular"]
      },
      "model_snapshot": {
        "bsonType": "object",
        "properties": {
          "stt_provider": { "bsonType": "string" },
          "stt_model": { "bsonType": "string" },
          "llm_provider": { "bsonType": "string" },
          "llm_model": { "bsonType": "string" },
          "tts_provider": { "bsonType": "string" },
          "tts_model": { "bsonType": "string" },
          "voice": { "bsonType": "string" }
        }
      },
      "session_summary": {
        "bsonType": ["string", "null"],
        "description": "Auto-generated short preview summary of the call"
      },
      "duration_seconds": {
        "bsonType": ["int", "null"]
      },
      "message_count": {
        "bsonType": "int"
      },
      "turns_count": {
        "bsonType": "int"
      },
      "tool_calls_count": {
        "bsonType": "int"
      },
      "total_tokens": {
        "bsonType": "object",
        "properties": {
          "prompt_tokens": { "bsonType": "int" },
          "completion_tokens": { "bsonType": "int" },
          "total_tokens": { "bsonType": "int" }
        }
      },
      "latency_metrics": {
        "bsonType": "object",
        "properties": {
          "avg_stt_latency_ms": { "bsonType": "double" },
          "avg_llm_ttft_ms": { "bsonType": "double" },
          "avg_tts_latency_ms": { "bsonType": "double" },
          "avg_total_turn_ms": { "bsonType": "double" }
        }
      },
      "error_message": {
        "bsonType": ["string", "null"]
      },
      "created_at": { "bsonType": "date" },
      "started_at": { "bsonType": ["date", "null"] },
      "ended_at": { "bsonType": ["date", "null"] },
      "updated_at": { "bsonType": "date" }
    }
  }
}
```

---

### 3.4. `session_turns` Collection

Stores turn-by-turn conversational telemetry, tool execution events, and timing waterfalls for detailed inspection in `history-view.tsx` and performance analytics.

```javascript
// Index Definitions
db.session_turns.createIndex({ "session_id": 1, "turn_index": 1 }, { unique: true, name: "idx_session_turn_seq" });
db.session_turns.createIndex({ "user_id": 1, "timestamp": -1 }, { name: "idx_user_turns_time" });
```

#### Document Example
```json
{
  "_id": { "$oid": "671e22223333444455556666" },
  "session_id": "ses_08a3f9e2",
  "user_id": "usr_7x9q2m4k",
  "turn_index": 1,
  "user_speech": {
    "text": "What is the status of our server disk usage?",
    "confidence": 0.985,
    "duration_ms": 1850,
    "stt_latency_ms": 112.4
  },
  "agent_response": {
    "text": "The primary storage volume is currently at 42% capacity with 280GB free.",
    "reasoning_content": "User asked for server disk metrics. Invoking system diagnostic MCP tool.",
    "llm_ttft_ms": 218.0,
    "llm_total_ms": 580.0,
    "tts_first_chunk_ms": 82.0,
    "tts_total_duration_ms": 2800.0,
    "tokens": {
      "prompt_tokens": 420,
      "completion_tokens": 68,
      "total_tokens": 488
    }
  },
  "tool_calls": [
    {
      "tool_call_id": "call_disk_diag_01",
      "tool_name": "get_disk_usage",
      "server_name": "System Diagnostic MCP",
      "arguments": { "mount": "/" },
      "result": { "used_percent": 42.0, "free_gb": 280 },
      "status": "success",
      "latency_ms": 38.6
    }
  ],
  "visual_inspection": null,
  "timestamp": { "$date": "2026-10-27T08:10:15.000Z" }
}
```

---

### 3.5. `mcp_servers` Collection

Manages registered MCP servers and their discovered tool definitions. The Voice Agent loads tools directly from this collection to eliminate token bloat and enable hot discovery.

```javascript
// Index Definitions
db.mcp_servers.createIndex({ "user_id": 1, "server_name": 1 }, { unique: true, name: "idx_mcp_user_name_unique" });
db.mcp_servers.createIndex({ "user_id": 1, "status": 1 }, { name: "idx_mcp_user_status" });
```

#### JSON Schema Validator
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["server_id", "user_id", "server_name", "transport", "status", "tools", "updated_at"],
    "properties": {
      "server_id": { "bsonType": "string" },
      "user_id": { "bsonType": "string" },
      "server_name": { "bsonType": "string", "minLength": 2, "maxLength": 60 },
      "transport": { "enum": ["stdio", "sse", "websocket"] },
      "server_url": { "bsonType": ["string", "null"] },
      "command": { "bsonType": ["string", "null"] },
      "args": {
        "bsonType": ["array", "null"],
        "items": { "bsonType": "string" }
      },
      "server_key_encrypted": {
        "bsonType": ["string", "null"],
        "description": "AES-256 encrypted authentication token or API key for SSE/WS"
      },
      "status": { "enum": ["active", "inactive", "unreachable", "error"] },
      "mcp_tool_count": { "bsonType": "int" },
      "tools": {
        "bsonType": "array",
        "items": {
          "bsonType": "object",
          "required": ["name", "description", "is_enabled"],
          "properties": {
            "name": { "bsonType": "string" },
            "description": { "bsonType": "string" },
            "parameters_summary": { "bsonType": ["string", "null"] },
            "input_schema": { "bsonType": ["object", "null"] },
            "is_enabled": { "bsonType": "bool" }
          }
        }
      },
      "last_health_check": { "bsonType": ["date", "null"] },
      "created_at": { "bsonType": "date" },
      "updated_at": { "bsonType": "date" }
    }
  }
}
```

---

### 3.6. `prompts` Collection

Stores system personas, agent directives, quick macros, and specialized skills. When starting a call, the Agent compiles the active system prompts to establish the conversational persona.

```javascript
// Index Definitions
db.prompts.createIndex({ "user_id": 1, "type": 1 }, { name: "idx_prompts_user_type" });
db.prompts.createIndex({ "prompt_id": 1 }, { unique: true, name: "idx_prompt_id_unique" });
db.prompts.createIndex({ "user_id": 1, "is_default": 1 }, { name: "idx_prompts_default" });
```

#### JSON Schema Validator
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["prompt_id", "user_id", "title", "prompt_text", "type", "created_at"],
    "properties": {
      "prompt_id": { "bsonType": "string", "pattern": "^pr_[a-zA-Z0-9]{8,24}$" },
      "user_id": { "bsonType": "string" },
      "title": { "bsonType": "string", "minLength": 2, "maxLength": 100 },
      "prompt_text": { "bsonType": "string", "minLength": 5 },
      "type": { "enum": ["system", "quick", "skill", "base"] },
      "is_default": { "bsonType": "bool" },
      "tags": {
        "bsonType": "array",
        "items": { "bsonType": "string" }
      },
      "version": { "bsonType": "int" },
      "created_at": { "bsonType": "date" },
      "updated_at": { "bsonType": "date" }
    }
  }
}
```

---

### 3.7. `model_configs` Collection

Configures the active AI intelligence engine for each operator. Supports both the all-in-one Gemini 2.0/3.0 Live multimodal pipeline and the decoupled modular pipeline (Speechmatics STT, Groq/OpenAI LLM, Cartesia/ElevenLabs TTS).

```javascript
// Index Definitions
db.model_configs.createIndex({ "user_id": 1 }, { unique: true, name: "idx_model_configs_user_unique" });
```

#### JSON Schema Validator
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["user_id", "mode", "updated_at"],
    "properties": {
      "user_id": { "bsonType": "string" },
      "mode": { "enum": ["gemini_live", "modular"] },
      "gemini_config": {
        "bsonType": "object",
        "properties": {
          "model": { "bsonType": "string" },
          "voice": { "bsonType": "string" },
          "thinking_budget": { "bsonType": ["int", "null"] },
          "search_grounding": { "bsonType": "bool" }
        }
      },
      "modular_config": {
        "bsonType": "object",
        "properties": {
          "stt_provider": { "enum": ["speechmatics", "deepgram", "whisper", "groq"] },
          "stt_model": { "bsonType": "string" },
          "stt_language": { "bsonType": "string" },
          "speechmatics_voice_id": { "bsonType": ["string", "null"] },
          "llm_provider": { "enum": ["groq", "openai", "anthropic", "ollama", "gemini"] },
          "llm_model": { "bsonType": "string" },
          "tts_provider": { "enum": ["cartesia", "elevenlabs", "openai", "deepgram"] },
          "tts_model": { "bsonType": "string" },
          "voice_id": { "bsonType": "string" }
        }
      },
      "parameters": {
        "bsonType": "object",
        "properties": {
          "temperature": { "bsonType": "double" },
          "max_output_tokens": { "bsonType": "int" },
          "presence_penalty": { "bsonType": "double" },
          "vad_threshold": { "bsonType": "double" },
          "interruption_allowed": { "bsonType": "bool" }
        }
      },
      "base_system_prompt": { "bsonType": ["string", "null"] },
      "skills": {
        "bsonType": ["array", "null"],
        "items": { "bsonType": "object" }
      },
      "livekit": {
        "bsonType": ["object", "null"],
        "properties": {
          "url": { "bsonType": "string" },
          "api_key": { "bsonType": "string" },
          "api_secret": { "bsonType": "string" }
        }
      },
      "updated_at": { "bsonType": "date" }
    }
  }
}
```

---

### 3.8. `agent_memories` Collection (Mem0 Context)

Stores persistent semantic memories and user facts learned by the agent across voice sessions. The agent injects relevant memories into the context before processing user speech.

```javascript
// Index Definitions
db.agent_memories.createIndex({ "user_id": 1, "updated_at": -1 }, { name: "idx_memories_user_recency" });
db.agent_memories.createIndex({ "user_id": 1, "category": 1 }, { name: "idx_memories_user_category" });
```

#### Document Shape
```json
{
  "_id": { "$oid": "671e55556666777788889999" },
  "memory_id": "mem_4a8b2c1d",
  "user_id": "usr_7x9q2m4k",
  "memory_text": "Operator prefers concise bullet-point technical summaries over spoken prose.",
  "category": "preference",
  "source_session_id": "ses_08a3f9e2",
  "confidence": 0.94,
  "created_at": { "$date": "2026-10-27T08:12:00.000Z" },
  "updated_at": { "$date": "2026-10-27T08:12:00.000Z" }
}
```

---

### 3.9. `voice_profiles` Collection

Stores speaker identification signatures and enrollment details for Speechmatics speaker diarization and personalized recognition.

```javascript
// Index Definitions
db.voice_profiles.createIndex({ "profile_id": 1 }, { unique: true, name: "idx_voice_profile_id_unique" });
db.voice_profiles.createIndex({ "user_id": 1, "speaker_name": 1 }, { unique: true, name: "idx_user_speaker_unique" });
```

#### Document Shape
```json
{
  "_id": { "$oid": "671e6666777788889999aaaa" },
  "profile_id": "vp_alpha_01",
  "user_id": "usr_7x9q2m4k",
  "speaker_name": "Operator Alpha",
  "voice_signature": "spk_sig_sha256_9b8f2d...",
  "enrolled_at": { "$date": "2026-10-27T08:00:00.000Z" },
  "sample_count": 5,
  "notes": "Primary account operator voice signature"
}
```

---

## 4. Python Models Reference (FastAPI & Agent)

These Pydantic classes in `backend/src/constants/models.py` guarantee shared validation across both the API gateway and agent worker:

```python
from datetime import datetime
from typing import Optional, Dict, List, Literal
from pydantic import BaseModel, Field

class AgentSessionModel(BaseModel):
    user_id: str
    session_id: str
    room_name: Optional[str] = None
    name: str
    token: str
    status: str = "active"
    duration_seconds: Optional[int] = None
    total_tokens: Optional[int] = None
    avg_latency_ms: Optional[float] = None
    session_summary: Optional[str] = None
    conversation: Optional[Dict] = None
    turns: List[Dict] = Field(default_factory=list)
    mcp_tools_invoked: List[Dict] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    ended_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.now)

class PromptModel(BaseModel):
    user_id: str
    prompt_id: str
    title: str
    prompt_text: str
    type: Literal["system", "quick", "skill", "base"] = "system"
    tags: List[str] = Field(default_factory=list)
    is_default: bool = False
    created_at: str
    updated_at: Optional[str] = None

class MCPServerModel(BaseModel):
    user_id: str
    server_name: str
    server_url: str
    server_key: Optional[str] = None
    transport: Literal["stdio", "sse", "websocket"]
    mcp_tools_list: List[Dict] = Field(default_factory=list)
    mcp_tool_count: int = 0
    status: str = "active"

class VoiceProfileModel(BaseModel):
    user_id: str
    profile_id: str
    speaker_name: str
    voice_signature: Optional[str] = None
    enrolled_at: str
    sample_count: int = 1
    notes: Optional[str] = None
```

---

## 5. Analytics Aggregation Pipeline Example

FastAPI computes dashboard KPIs on the `/api/analytics` endpoint using the following MongoDB pipeline:

```javascript
db.sessions.aggregate([
  { $match: { user_id: "usr_7x9q2m4k" } },
  {
    $group: {
      _id: "$user_id",
      total_sessions: { $sum: 1 },
      completed_sessions: {
        $sum: { $cond: [{ $in: ["$status", ["completed", "ended"]] }, 1, 0] }
      },
      total_duration_seconds: { $sum: { $ifNull: ["$duration_seconds", 0] } },
      total_tokens: { $sum: { $ifNull: ["$total_tokens.total_tokens", 0] } },
      avg_stt_latency_ms: { $avg: "$latency_metrics.avg_stt_latency_ms" },
      avg_llm_ttft_ms: { $avg: "$latency_metrics.avg_llm_ttft_ms" },
      avg_tts_latency_ms: { $avg: "$latency_metrics.avg_tts_latency_ms" },
      avg_total_turn_ms: { $avg: "$latency_metrics.avg_total_turn_ms" }
    }
  }
]);
```
