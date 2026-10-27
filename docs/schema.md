# Exia Unified Database Schema Specification (MongoDB)

> **Version:** 2.0.0  
> **Status:** Production Ready  
> **Database:** MongoDB 7.0+ / MongoDB Atlas  
> **Target Services:** Exia FastAPI Backend, LiveKit Python Voice Agent, Exia Web UI  

---

## 1. System Architecture & Communication Flow

Exia operates as a unified distributed system where **FastAPI Backend** and the **LiveKit Voice Agent Worker** share a single MongoDB database (`exia_db`). MongoDB serves as the single source of truth for authentication, dynamic configuration, prompt directives, MCP tools, semantic memories, and real-time session observability.

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

### Communication & Lifecycle Workflow

1. **Session Initialization (Handshake)**:
   - Frontend calls `POST /api/agent/token` with optional `room_name`.
   - Backend creates LiveKit token with user credentials and inserts a new document in `sessions` with `status: "initializing"`.
   - Backend returns `session_id`, `room_name`, and JWT participant token to Frontend.

2. **Agent Startup & Context Loading**:
   - LiveKit Worker accepts participant connection into the room.
   - Agent queries MongoDB using `user_id`:
     - Reads `model_configs` to determine active pipeline (`gemini_live` vs `modular` with Speechmatics STT, LLM, Cartesia TTS).
     - Reads `prompts` to assemble the System Persona and active directives.
     - Reads `mcp_servers` with `status: "active"` to load available external tools into memory.
     - Reads `agent_memories` for user historical context and preferences.
   - Agent updates `sessions` document to `status: "in_progress"`, sets `started_at`.

3. **Turn-by-Turn Logging & Observability**:
   - For every speech turn, the agent appends a structured turn to `sessions.turns` (or the `session_turns` collection) recording:
     - User STT transcript & latency.
     - LLM reasoning, response, TTFT (time-to-first-token), and token usage.
     - TTS latency and speech synthesis duration.
     - Any MCP tool invocations with arguments and execution results.

4. **Session Termination & Aggregation**:
   - When the user disconnects or leaves the room, the agent finalizes the `sessions` document:
     - `status: "completed"`.
     - `ended_at`, `duration_seconds`.
     - Aggregated token usage (`prompt_tokens`, `completion_tokens`, `total_tokens`).
     - Aggregated latency benchmarks (`avg_stt_latency_ms`, `avg_llm_ttft_ms`, `avg_tts_latency_ms`).
     - Auto-generated `session_summary` for instant history preview.

---

## 2. Database Collections Summary

| Collection | Responsibility | Primary Consumer | Primary Writer |
| :--- | :--- | :--- | :--- |
| `users` | User credentials, profiles, and account state | Backend Auth | Backend Auth |
| `token_blacklist` | Revoked JWT access and refresh tokens (Auto-clearing TTL) | Backend Auth Middleware | Backend Auth (Logout) |
| `sessions` | Voice calls, WebRTC telemetry, turn transcripts, token & latency metrics | Frontend UI, Backend History | Agent & Backend |
| `session_turns` | Granular turn-by-turn conversation logs and tool call waterfalls | Analytics View, History View | Agent Worker |
| `mcp_servers` | Registered MCP tools, protocols (stdio, sse, ws), tool schemas | Agent Worker, MCP Registry | Backend & Agent Ping |
| `prompts` | System personas, base instructions, quick macros, and skills | Agent Worker, Prompts Screen | Backend / User |
| `model_configs` | Pipeline mode, STT/LLM/TTS models, voice IDs, temperature | Agent Worker, Model Engine | Backend / User |
| `agent_memories` | Long-term semantic user memory, preferences, and facts (Mem0) | Agent Worker | Agent Worker |

---

## 3. Detailed Collection Schemas

---

### 3.1. `users` Collection

Stores registered operators and authenticated accounts.

#### Indexes
```javascript
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
        "pattern": "^usr_[a-zA-Z0-9]{8,24}$",
        "description": "Unique identifier for user, e.g. usr_9a8f2c3e"
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
        "enum": ["operator", "admin", "guest"],
        "description": "User role permissions"
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

#### Document Example
```json
{
  "_id": { "$oid": "66f1234567890abcdef12345" },
  "user_id": "usr_7x9q2m4k",
  "name": "Operator Alpha",
  "email": "operator@exia.local",
  "hash_password": "$2b$12$e8r1U6wM...kJh.8Y7xK",
  "avatar_url": "/images/exia-logo.jpg",
  "role": "operator",
  "preferences": {
    "theme": "dark",
    "default_pipeline": "modular"
  },
  "created_at": { "$date": "2026-10-27T08:00:00.000Z" },
  "updated_at": { "$date": "2026-10-27T08:00:00.000Z" }
}
```

---

### 3.2. `token_blacklist` Collection

Provides O(1) revocation check for logged-out JWT tokens. Automatically drops expired tokens using MongoDB TTL indexing.

#### Indexes
```javascript
db.token_blacklist.createIndex({ "token": 1 }, { unique: true, name: "idx_blacklist_token" });
db.token_blacklist.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0, name: "idx_blacklist_ttl" });
```

#### JSON Schema Validator
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["token", "token_type", "user_id", "expires_at", "blacklisted_at"],
    "properties": {
      "token": { "bsonType": "string" },
      "token_type": { "enum": ["access", "refresh"] },
      "user_id": { "bsonType": "string" },
      "expires_at": { "bsonType": "date" },
      "blacklisted_at": { "bsonType": "date" }
    }
  }
}
```

---

### 3.3. `sessions` Collection

The master voice session log. Queried by `history-view.tsx` and aggregated by `analytics-view.tsx`.

#### Indexes
```javascript
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
        "description": "Unique session identifier, e.g. ses_abc123"
      },
      "user_id": {
        "bsonType": "string",
        "description": "Owner user identifier"
      },
      "room_name": {
        "bsonType": "string",
        "description": "LiveKit WebRTC room name"
      },
      "participant_name": {
        "bsonType": "string"
      },
      "status": {
        "enum": ["initializing", "active", "completed", "failed", "aborted"]
      },
      "pipeline_mode": {
        "enum": ["gemini_live", "modular"]
      },
      "model_snapshot": {
        "bsonType": "object",
        "description": "Snapshot of models utilized during this session",
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
        "description": "Auto-generated short preview summary of call conversation"
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

#### Document Example
```json
{
  "_id": { "$oid": "671e11112222333344445555" },
  "session_id": "ses_08a3f9e2",
  "user_id": "usr_7x9q2m4k",
  "room_name": "exia-room-8841",
  "participant_name": "Operator Alpha",
  "status": "completed",
  "pipeline_mode": "modular",
  "model_snapshot": {
    "stt_provider": "speechmatics",
    "stt_model": "flow-stt-v2",
    "llm_provider": "groq",
    "llm_model": "llama-3.3-70b-versatile",
    "tts_provider": "cartesia",
    "tts_model": "sonic-english",
    "voice": "barbershop-man"
  },
  "session_summary": "User inquired about system performance and initiated an MCP server diagnostic scan.",
  "duration_seconds": 142,
  "message_count": 8,
  "turns_count": 4,
  "tool_calls_count": 1,
  "total_tokens": {
    "prompt_tokens": 1280,
    "completion_tokens": 420,
    "total_tokens": 1700
  },
  "latency_metrics": {
    "avg_stt_latency_ms": 115.4,
    "avg_llm_ttft_ms": 230.8,
    "avg_tts_latency_ms": 85.2,
    "avg_total_turn_ms": 431.4
  },
  "error_message": null,
  "created_at": { "$date": "2026-10-27T08:10:00.000Z" },
  "started_at": { "$date": "2026-10-27T08:10:02.000Z" },
  "ended_at": { "$date": "2026-10-27T08:12:24.000Z" },
  "updated_at": { "$date": "2026-10-27T08:12:25.000Z" }
}
```

---

### 3.4. `session_turns` Collection

Tracks granular turn-by-turn conversational telemetry, tool execution events, and timing waterfalls for detailed inspection in `history-view.tsx` and performance analytics.

#### Indexes
```javascript
db.session_turns.createIndex({ "session_id": 1, "turn_index": 1 }, { unique: true, name: "idx_session_turn_seq" });
db.session_turns.createIndex({ "user_id": 1, "timestamp": -1 }, { name: "idx_user_turns_time" });
```

#### JSON Schema Validator
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["session_id", "user_id", "turn_index", "user_speech", "agent_response", "timestamp"],
    "properties": {
      "session_id": { "bsonType": "string" },
      "user_id": { "bsonType": "string" },
      "turn_index": { "bsonType": "int" },
      "user_speech": {
        "bsonType": "object",
        "required": ["text", "duration_ms"],
        "properties": {
          "text": { "bsonType": "string" },
          "confidence": { "bsonType": "double" },
          "duration_ms": { "bsonType": "int" },
          "stt_latency_ms": { "bsonType": "double" }
        }
      },
      "agent_response": {
        "bsonType": "object",
        "required": ["text"],
        "properties": {
          "text": { "bsonType": "string" },
          "reasoning_content": { "bsonType": ["string", "null"] },
          "llm_ttft_ms": { "bsonType": "double" },
          "llm_total_ms": { "bsonType": "double" },
          "tts_first_chunk_ms": { "bsonType": "double" },
          "tts_total_duration_ms": { "bsonType": "double" },
          "tokens": {
            "bsonType": "object",
            "properties": {
              "prompt_tokens": { "bsonType": "int" },
              "completion_tokens": { "bsonType": "int" },
              "total_tokens": { "bsonType": "int" }
            }
          }
        }
      },
      "tool_calls": {
        "bsonType": "array",
        "items": {
          "bsonType": "object",
          "required": ["tool_name", "server_name", "status"],
          "properties": {
            "tool_call_id": { "bsonType": "string" },
            "tool_name": { "bsonType": "string" },
            "server_name": { "bsonType": "string" },
            "arguments": { "bsonType": "object" },
            "result": { "bsonType": ["object", "string", "null"] },
            "status": { "enum": ["success", "error", "timeout"] },
            "latency_ms": { "bsonType": "double" }
          }
        }
      },
      "visual_inspection": {
        "bsonType": ["object", "null"],
        "properties": {
          "source": { "enum": ["camera", "screen_share"] },
          "frame_width": { "bsonType": "int" },
          "frame_height": { "bsonType": "int" },
          "analysis": { "bsonType": "string" }
        }
      },
      "timestamp": { "bsonType": "date" }
    }
  }
}
```

#### Document Example
```json
{
  "_id": { "$oid": "671e22223333444455556666" },
  "session_id": "ses_08a3f9e2",
  "user_id": "usr_7x9q2m4k",
  "turn_index": 1,
  "user_speech": {
    "text": "Can you check the local filesystem for any new log files?",
    "confidence": 0.98,
    "duration_ms": 2400,
    "stt_latency_ms": 112.5
  },
  "agent_response": {
    "text": "I checked the logs folder and found three log files updated in the last hour.",
    "reasoning_content": "User wants to inspect files. Need to invoke local filesystem MCP tool `list_directory`.",
    "llm_ttft_ms": 218.0,
    "llm_total_ms": 640.0,
    "tts_first_chunk_ms": 82.0,
    "tts_total_duration_ms": 3100.0,
    "tokens": {
      "prompt_tokens": 420,
      "completion_tokens": 85,
      "total_tokens": 505
    }
  },
  "tool_calls": [
    {
      "tool_call_id": "call_9934af",
      "tool_name": "list_directory",
      "server_name": "Filesystem MCP",
      "arguments": { "path": "./logs" },
      "result": { "files": ["app.log", "audit.log", "worker.log"] },
      "status": "success",
      "latency_ms": 45.2
    }
  ],
  "visual_inspection": null,
  "timestamp": { "$date": "2026-10-27T08:10:15.000Z" }
}
```

---

### 3.5. `mcp_servers` Collection

Manages registered MCP servers and their discovered tool definitions. The Voice Agent loads tools directly from this collection to eliminate token bloat and enable hot discovery.

#### Indexes
```javascript
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

#### Indexes
```javascript
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
      "type": { "enum": ["system", "quick", "skill"] },
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

#### Document Example
```json
{
  "_id": { "$oid": "671e33334444555566667777" },
  "prompt_id": "pr_88ef10ad",
  "user_id": "usr_7x9q2m4k",
  "title": "Exia Voice Persona - Tactical & Direct",
  "prompt_text": "You are Exia, an ultra-fast, professional desktop companion. Keep spoken answers under 2 sentences unless elaborating. Prioritize MCP action execution over chit-chat.",
  "type": "system",
  "is_default": true,
  "tags": ["core", "voice", "tactical"],
  "version": 1,
  "created_at": { "$date": "2026-10-27T08:00:00.000Z" },
  "updated_at": { "$date": "2026-10-27T08:00:00.000Z" }
}
```

---

### 3.7. `model_configs` Collection

Configures the active AI intelligence engine for each user. Supports both the all-in-one Gemini 2.0/3.0 Live multimodal pipeline and the decoupled modular pipeline (Speechmatics STT, Groq/OpenAI LLM, Cartesia/ElevenLabs TTS).

#### Indexes
```javascript
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
      "updated_at": { "bsonType": "date" }
    }
  }
}
```

#### Document Example
```json
{
  "_id": { "$oid": "671e44445555666677778888" },
  "user_id": "usr_7x9q2m4k",
  "mode": "modular",
  "gemini_config": {
    "model": "gemini-2.0-flash-exp",
    "voice": "Puck",
    "thinking_budget": 0,
    "search_grounding": true
  },
  "modular_config": {
    "stt_provider": "speechmatics",
    "stt_model": "flow-stt-v2",
    "stt_language": "en",
    "speechmatics_voice_id": "en_us_female_01",
    "llm_provider": "groq",
    "llm_model": "llama-3.3-70b-versatile",
    "tts_provider": "cartesia",
    "tts_model": "sonic-english",
    "voice_id": "a0e99841-438c-4a64-b679-ae501e7d6091"
  },
  "parameters": {
    "temperature": 0.7,
    "max_output_tokens": 1024,
    "presence_penalty": 0.0,
    "vad_threshold": 0.5,
    "interruption_allowed": true
  },
  "updated_at": { "$date": "2026-10-27T08:00:00.000Z" }
}
```

---

### 3.8. `agent_memories` Collection (Mem0 Context)

Stores persistent semantic memories and user facts learned by the agent across voice sessions. The agent injects relevant memories into the context before processing user speech.

#### Indexes
```javascript
db.agent_memories.createIndex({ "user_id": 1, "updated_at": -1 }, { name: "idx_memories_user_recency" });
db.agent_memories.createIndex({ "user_id": 1, "category": 1 }, { name: "idx_memories_user_category" });
```

#### JSON Schema Validator
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["memory_id", "user_id", "memory_text", "created_at"],
    "properties": {
      "memory_id": { "bsonType": "string" },
      "user_id": { "bsonType": "string" },
      "memory_text": { "bsonType": "string" },
      "category": { "enum": ["preference", "fact", "work", "routine", "general"] },
      "source_session_id": { "bsonType": ["string", "null"] },
      "confidence": { "bsonType": "double" },
      "created_at": { "bsonType": "date" },
      "updated_at": { "bsonType": "date" }
    }
  }
}
```

---

## 4. Shared Python Pydantic Models (Backend & Agent)

To ensure seamless type safety across both Python runtimes (`backend` and `agent`), the following models define the shared database contracts:

```python
# shared/db_models.py (or backend/src/constants/models.py & agent/db.py)

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# -------------------------------------------------------------------------
# SESSIONS & TELEMETRY
# -------------------------------------------------------------------------

class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

class LatencyMetrics(BaseModel):
    avg_stt_latency_ms: Optional[float] = None
    avg_llm_ttft_ms: Optional[float] = None
    avg_tts_latency_ms: Optional[float] = None
    avg_total_turn_ms: Optional[float] = None

class SessionModel(BaseModel):
    session_id: str
    user_id: str
    room_name: str
    participant_name: str = "Operator"
    status: Literal["initializing", "active", "completed", "failed", "aborted"] = "initializing"
    pipeline_mode: Literal["gemini_live", "modular"] = "modular"
    model_snapshot: Dict[str, Any] = Field(default_factory=dict)
    session_summary: Optional[str] = None
    duration_seconds: Optional[int] = None
    message_count: int = 0
    turns_count: int = 0
    tool_calls_count: int = 0
    total_tokens: TokenUsage = Field(default_factory=TokenUsage)
    latency_metrics: LatencyMetrics = Field(default_factory=LatencyMetrics)
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=utc_now)

# -------------------------------------------------------------------------
# TURN-BY-TURN OBSERVABILITY
# -------------------------------------------------------------------------

class ToolCallLog(BaseModel):
    tool_call_id: str
    tool_name: str
    server_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    result: Optional[Any] = None
    status: Literal["success", "error", "timeout"] = "success"
    latency_ms: float = 0.0

class TurnModel(BaseModel):
    session_id: str
    user_id: str
    turn_index: int
    user_speech: Dict[str, Any] # text, confidence, duration_ms, stt_latency_ms
    agent_response: Dict[str, Any] # text, reasoning, llm_ttft_ms, tokens, tts_ms
    tool_calls: List[ToolCallLog] = Field(default_factory=list)
    visual_inspection: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=utc_now)

# -------------------------------------------------------------------------
# MCP SERVERS & DISCOVERY
# -------------------------------------------------------------------------

class MCPToolDefinition(BaseModel):
    name: str
    description: str
    parameters_summary: Optional[str] = None
    input_schema: Optional[Dict[str, Any]] = None
    is_enabled: bool = True

class MCPServerModel(BaseModel):
    server_id: str
    user_id: str
    server_name: str
    transport: Literal["stdio", "sse", "websocket"] = "sse"
    server_url: Optional[str] = None
    command: Optional[str] = None
    args: Optional[List[str]] = None
    server_key_encrypted: Optional[str] = None
    status: Literal["active", "inactive", "unreachable", "error"] = "active"
    mcp_tool_count: int = 0
    tools: List[MCPToolDefinition] = Field(default_factory=list)
    last_health_check: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

# -------------------------------------------------------------------------
# PROMPTS & DIRECTIVES
# -------------------------------------------------------------------------

class PromptModel(BaseModel):
    prompt_id: str
    user_id: str
    title: str
    prompt_text: str
    type: Literal["system", "quick", "skill"] = "system"
    is_default: bool = False
    tags: List[str] = Field(default_factory=list)
    version: int = 1
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

# -------------------------------------------------------------------------
# MODEL PIPELINE ENGINE
# -------------------------------------------------------------------------

class ModelConfigModel(BaseModel):
    user_id: str
    mode: Literal["gemini_live", "modular"] = "modular"
    gemini_config: Dict[str, Any] = Field(default_factory=lambda: {
        "model": "gemini-2.0-flash-exp",
        "voice": "Puck",
        "thinking_budget": 0,
        "search_grounding": True
    })
    modular_config: Dict[str, Any] = Field(default_factory=lambda: {
        "stt_provider": "speechmatics",
        "stt_model": "flow-stt-v2",
        "stt_language": "en",
        "speechmatics_voice_id": None,
        "llm_provider": "groq",
        "llm_model": "llama-3.3-70b-versatile",
        "tts_provider": "cartesia",
        "tts_model": "sonic-english",
        "voice_id": "a0e99841-438c-4a64-b679-ae501e7d6091"
    })
    parameters: Dict[str, Any] = Field(default_factory=lambda: {
        "temperature": 0.7,
        "max_output_tokens": 1024,
        "presence_penalty": 0.0,
        "vad_threshold": 0.5,
        "interruption_allowed": True
    })
    updated_at: datetime = Field(default_factory=utc_now)
```

---

## 5. Synchronization Strategy: Backend & Agent

```
  BACKEND                                  MONGODB                                   LIVEKIT AGENT
 (FastAPI)                                 (Atlas)                                  (Python Worker)
     │                                        │                                            │
     │ 1. POST /api/agent/token               │                                            │
     │ ─────────────────────────────────────► │                                            │
     │    INSERT into `sessions`:             │                                            │
     │    status="initializing"               │                                            │
     │                                        │                                            │
     │                                        │    2. Agent entrypoint(ctx):               │
     │                                        │ ◄───────────────────────────────────────── │
     │                                        │    SELECT from `model_configs`,            │
     │                                        │    `prompts` (default),                    │
     │                                        │    `mcp_servers` (active)                  │
     │                                        │                                            │
     │                                        │    3. On Participant Connect:              │
     │                                        │ ◄───────────────────────────────────────── │
     │                                        │    UPDATE `sessions`:                      │
     │                                        │    status="active", started_at=now         │
     │                                        │                                            │
     │                                        │    4. On User Turn & Speech:               │
     │                                        │ ◄───────────────────────────────────────── │
     │                                        │    INSERT into `session_turns`:            │
     │                                        │    stt_latency, llm_ttft, tts_ms, tokens   │
     │                                        │                                            │
     │                                        │    5. On Room Disconnect:                  │
     │                                        │ ◄───────────────────────────────────────── │
     │                                        │    UPDATE `sessions`:                      │
     │                                        │    status="completed", ended_at=now,       │
     │                                        │    total_tokens, latency_metrics, summary  │
     │                                        │                                            │
     │ 6. GET /api/sessions & /analytics      │                                            │
     │ ◄───────────────────────────────────── │                                            │
     │    Aggregates metrics for Dashboard    │                                            │
     ▼                                        ▼                                            ▼
```

### High-Throughput & Failure Recovery Practices
1. **Connection Pooling**: Both Backend and Agent utilize connection-pooled clients (`motor.motor_asyncio` for async FastAPI/LiveKit agents, `pymongo.MongoClient` with reuse) rather than creating new connections per request.
2. **Best-Effort Telemetry**: Turn telemetry logging is non-blocking (`asyncio.create_task`). If a database transient network blip occurs, the live audio session will never stutter or disconnect.
3. **Optimistic Locking & Atomic Increments**: Counters like `turns_count`, `tool_calls_count`, and `total_tokens` are incremented via `$inc` atomic operators to prevent race conditions.
4. **Data Isolation**: Multi-tenant isolation is enforced at the database query level via indexed `user_id` filters on all collections.
