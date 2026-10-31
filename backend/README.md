# Exia — Backend Service Architecture & Reference

Welcome to the backend service for **Exia**, the AI-powered Home Assistant and Voice Agent platform. This directory contains the complete Python backend engine designed to execute as the **Core FastAPI Server Gateway (`main.py`)** serving all UI clients (Expo Android, Expo Web, and React Native Windows — see `ui/README.md`).

---

## 1. Overall System Architecture & External Integrations

The backend acts as the central orchestrator connecting the frontend client surfaces, voice agent WebRTC streams, persistent databases, and external AI providers:

```mermaid
flowchart TB
    subgraph Clients ["Client Surfaces"]
        WindowsClient["Windows Desktop App<br/>(ui/apps/windows - React Native Windows, planned)"]
        MobileClient["Android App<br/>(ui/apps/mobile - Expo / React Native)"]
        WebBrowser["Modern Web Browsers<br/>(ui/apps/web - Next.js legacy during migration)"]
    end

    subgraph BackendCore ["Exia Backend (FastAPI Engine)"]
        Gateway["API Server Gateway<br/>(main.py)"]
        
        subgraph APILayer ["REST & Realtime API Routes"]
            AuthRoute["/api/auth/* (Registration & JWT Auth)"]
            TokenRoute["/api/token (LiveKit WebRTC Tokens)"]
            SessionRoute["/api/sessions (Voice Agent Sessions)"]
            MCPRoute["/api/mcp (Tool Registry & Servers)"]
            PromptRoute["/api/prompts (Agent System Prompts)"]
            ModelRoute["/api/models (LLM Parameters)"]
            HealthRoute["/api/health (System Health Check)"]
        end

        subgraph ServiceLayer ["Core Services & Performance"]
            DBPool["Persistent Connection Pool<br/>(max: 50, min: 5, idle: 45s)"]
            QueryCache["In-Memory TTL Query Cache<br/>(60s TTL, Auto-Invalidate on Write)"]
            SecuritySvc["JWT Auth & Bcrypt Security"]
            AutoSeed["Background Database Auto-Seeder"]
        end

    end

    subgraph ExternalEcosystem ["External Services & Infrastructure"]
        LiveKitSFU["LiveKit Realtime SFU<br/>(WebRTC Audio/Video Agent Gateway)"]
        MongoDBCluster[("MongoDB Database<br/>(Atlas Cloud or Local Instance)")]
        VercelPlatform["Vercel Serverless Edge<br/>(Cloud Hosting Infrastructure)"]
    end

    WindowsClient <-->|HTTP /api/*| Gateway
    MobileClient <-->|HTTP /api/*| Gateway
    WebBrowser <-->|HTTP /api/*| Gateway
    Gateway --> APILayer
    APILayer --> ServiceLayer
    ServiceLayer <--> DBPool
    DBPool <--> QueryCache
    DBPool <-->|TCP Socket Pool| MongoDBCluster
    APILayer <-->|Generate JWT Grants| LiveKitSFU
    Gateway -.->|Deployment Manifest| VercelPlatform
```

---

## 2. Directory & File Inventory

Below is the directory structure of `backend/`:

```
backend/
├── main.py                     # Main FastAPI Server Gateway (local development & production)
├── vercel.json                 # Vercel Python function and bundle exclusions
├── .vercelignore               # Excludes local build and development artifacts
├── requirements.txt            # Python runtime dependencies
├── pyproject.toml / uv.lock    # Project dependencies & lockfile (managed with uv)
├── .env / .env.example         # Environment variable configuration templates
└── src/                        # Shared business logic, schemas, and routes
    ├── constants/
    │   ├── config.py           # Multi-path .env resolver & Pydantic application settings
    │   ├── models.py           # Pydantic data models (User, Session, Prompt, MCP)
    │   └── shema.py            # MongoDB collection names and database constants
    │
    ├── routes/
    │   ├── auth.py             # User account creation, registration, JWT login, token refresh
    │   ├── token.py            # LiveKit access token generation for voice agent
    │   ├── sessions.py         # Voice session history, recording metadata, CRUD
    │   ├── mcp.py              # Model Context Protocol server registrations
    │   ├── prompts.py          # Custom prompt templates & system instructions
    │   └── model_config.py     # LLM provider configs (Gemini, OpenAI, Anthropic)
    │
    ├── services/
    │   ├── db.py               # Persistent MongoClient pooling + In-Memory TTL Cache
    │   ├── auth.py             # Authentication business logic & token blacklist
    │   ├── security.py         # Bcrypt password hashing and cryptographic tokens
    │   ├── sessions.py         # Session querying and mutation handlers
    │   ├── mcp.py              # MCP server database interactions
    │   ├── prompts.py          # Prompt template database interactions
    │   ├── model_config.py     # AI model configuration persistence
    │   ├── bootstrap_seed.py   # Initial database seeder for fresh environments
    │   └── token_blacklist.py  # Revoked JWT tracking
    │
    └── utils/
        └── auth.py             # FastAPI dependency injection for current_user
```

---

## 3. Database Optimization: Pooling & In-Memory TTL Query Caching

To prevent connection exhaustion and eliminate query latency, [`backend/src/services/db.py`](file:///e:/potfolio/Exia/backend/src/services/db.py) employs a **two-tier acceleration model**:

```mermaid
sequenceDiagram
    autonumber
    participant Route as API Route Handler
    participant Cache as In-Memory TTL Cache (_QUERY_CACHE)
    participant Pool as MongoClient Pool (_CLIENT_POOL)
    participant Mongo as MongoDB Server

    Route->>Cache: Request read operation (find_one / find_many)
    alt Cache Hit (Within 60s TTL)
        Cache-->>Route: Return cached JSON document (< 2ms)
    else Cache Miss
        Cache->>Pool: Acquire pooled connection
        Pool->>Mongo: Execute query over persistent TCP socket
        Mongo-->>Pool: Query result
        Pool-->>Cache: Store result with 60s expiration
        Cache-->>Route: Return fresh document
    end

    Note over Route,Mongo: When a write occurs (insert, update, delete)
    Route->>Pool: Execute write operation
    Pool->>Mongo: Update database
    Route->>Cache: Invalidate all cache entries for that collection
```

---

## 4. Development & Deployment Commands

### A. Run Backend API Locally (Development Mode)
```bash
# Start backend server with uvicorn
cd backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 12568
# Or directly with python
uv run python main.py
```

> The UI clients default to `http://127.0.0.1:12568/api` (see
> `ui/apps/mobile/src/lib/api.ts` and the legacy web client), so use port
> **12568** in development or override the clients' base URL env var
> (`EXPO_PUBLIC_API_URL` / `NEXT_PUBLIC_API_URL`).

### B. Run the Backend with Docker

From the `backend/` directory, build the image and pass your local `.env` file
to the container at runtime:

```bash
docker build -t exia-backend .
# Map host port 12568 (the UI clients' default) to the container's 8000
docker run --rm --name exia-backend -p 12568:8000 --env-file .env exia-backend
```

The image installs the locked production dependencies from `pyproject.toml`
and `uv.lock` using uv. The `.env` file is not copied into the image. Create it
from `.env.example` and fill in the required values before running the container.

### C. Deploy to Vercel

The GitHub Actions workflow at `.github/workflows/backend.yml` validates Python
sources and deploys backend changes to Vercel. Pull requests from this repository
receive preview deployments; pushes to `main` deploy production. The workflow
only runs when `backend/` or the workflow itself changes.

Configure these repository Actions secrets:

- `VERCEL_BACKEND_TOKEN`
- `VERCEL_BACKEND_ORG_ID`
- `VERCEL_BACKEND_PROJECT_ID`

Set the Vercel project's root directory to `backend` and configure the runtime
environment variables from `.env.example` in Vercel Project Settings. Do not add
credentials to the repository. Frontend build output in `backend/dist` is excluded
from the serverless function bundle; the FastAPI function does not serve that UI
build. To deploy manually, run `vercel link` and `vercel deploy` from `backend/`.
