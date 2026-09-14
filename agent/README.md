# Private Home Assistant Backend Starter

A 100% private, local-first voice assistant backend using **LiveKit**, **Model Context Protocol (MCP)**, **Mem0 Universal Memory**, and **Local LLMs (Ollama / vLLM / OpenAI)**.

---

## 1. System Architecture: All Settings Passed via Token

The frontend desktop UI lets you configure everything (LLM model, MCP servers, Mem0 settings) and embeds it directly into the LiveKit `AccessToken` JWT metadata:

```
[ Desktop App (Frontend) ]
  ├── User selects: Model (e.g. llama3.2 / deepseek-r1)
  ├── User selects: MCP Servers (Filesystem, Windows Tools, etc.)
  └── User selects: Mem0 Memory Config (User ID, Qdrant/SQLite vector store)
       │
       │ POST /api/token (token_server.py)
       ▼
[ LiveKit JWT AccessToken ]
  ├── Grants: room_join=True, can_publish=True
  └── Metadata: {
        "model_config": { "provider": "ollama", "model": "llama3.2:latest", ... },
        "mcp_servers": [ { "name": "Local Filesystem", ... } ],
        "memory_config": { "engine": "mem0", "user_id": "desktop-user", ... }
      }
       │
       ▼ WebRTC Connect
[ LiveKit Server ] ── (ws://localhost:7880)
       ▲
       │ Worker Protocol
       ▼
[ LiveKit Agent Worker (`backend/agent.py`) ]
  ├── 1. Reads `participant.metadata`
  ├── 2. Configures LLM: Dynamically loads the selected model!
  ├── 3. Configures MCP: Connects external tool servers!
  └── 4. Configures Mem0: Initializes local vector memory for this user!
```

---

## 2. Mem0 Memory Integration

Mem0 (`mem0ai`) provides an adaptive, multi-tier memory system:
- Automatically extracts user facts, preferences, and entities from each voice turn.
- Stores memories locally in embedded **Qdrant** (`./mem0_data`) or SQLite with vector indexing.
- Dynamically searches and retrieves relevant memories before each LLM turn.
- Automatic semantic deduplication (updates outdated preferences).

---

## 3. Quick Start

### Step 1: Install Python Requirements
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Set Environment Variables
Copy `.env.example` to `.env`:
```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
```

### Step 3: Start Token Server
```bash
python token_server.py --server
```
Runs on `http://localhost:8000/api/token`.

### Step 4: Run the Voice Agent
```bash
python agent.py dev
```
