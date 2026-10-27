# Exia Web Application (Vercel) — Architecture & Workflow

This document details the serverless architecture, request routing, database lifecycle, and deployment automation for deploying **Exia to Vercel**.

---

## 1. System Overview

Exia is deployed to Vercel as a **Unified Serverless Fullstack Application**. A single Python serverless runtime handles both the FastAPI REST API and static single-page application (SPA) routing:

```mermaid
flowchart TD
    subgraph Client ["Browser / End User"]
        BrowserReq["HTTPS Request<br/>(exia.vercel.app)"]
    end

    subgraph VercelEdge ["Vercel Edge & Serverless Runtime"]
        EdgeRouter["Vercel Edge Router<br/>(vercel.json)"]
        
        subgraph ServerlessLambda ["FastAPI Serverless Function (@vercel/python)"]
            MainVercel["main_vercel.py (ASGI app)"]
            APIRoutes["REST API Endpoints<br/>(/api/auth, /api/sessions, /api/mcp...)"]
            StaticFallback["Static File & SPA Fallback<br/>(backend/dist)"]
            PoolCache["Warm-State Client Pool +<br/>In-Memory Query Cache"]
        end
    end

    subgraph CloudServices ["External Cloud Services"]
        MongoDB[("MongoDB Atlas<br/>(Cloud Cluster)")]
        LiveKit["LiveKit Cloud<br/>(WebRTC SFU Gateway)"]
    end

    BrowserReq --> EdgeRouter
    EdgeRouter -->|Proxy all requests| MainVercel
    MainVercel -->|/api/*| APIRoutes
    MainVercel -->|/*| StaticFallback
    APIRoutes --> PoolCache
    PoolCache <-->|Pooled TCP Connection| MongoDB
    APIRoutes <-->|JWT Token Gen| LiveKit
```

---

## 2. Request Routing & Execution Flow

Vercel directs all incoming traffic into `backend/main.py` (which re-exports `app` from `main_vercel.py`):

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Edge as Vercel Edge Router
    participant API as main_vercel.py
    participant Cache as In-Memory Query Cache
    participant DB as MongoDB Atlas

    User->>Edge: GET /sessions
    Edge->>API: Route to Serverless Function
    API->>API: Static routing check: matches /dist/index.html
    API-->>User: 200 OK (HTML/JS/CSS SPA Bundle)

    User->>Edge: POST /api/auth/login
    Edge->>API: Route to /api/auth/login
    API->>Cache: Query cache lookup (user email)
    
    alt Cache Hit (Warm Function)
        Cache-->>API: Return cached operator doc (< 2ms)
    else Cache Miss
        API->>DB: Query `users` collection via pooled connection
        DB-->>API: User record
        API->>Cache: Store in query cache (60s TTL)
    end
    
    API-->>User: 200 OK + JWT Bearer Token
```

---

## 3. Serverless Lifecycle & Database Optimizations

Serverless environments require careful management of database connections to avoid exhausting connection limits and introducing latency:

1. **Persistent Connection Pool in Warm Instances**:
   - Connection initialization is managed by `_CLIENT_POOL`.
   - When a serverless container stays warm between requests, the MongoDB client and TCP socket connections remain alive.
   - Per-request connection handshake latency is completely avoided.
2. **In-Memory TTL Query Caching**:
   - The memory cache (`_QUERY_CACHE`) retains frequent reads (such as agent session definitions, prompt templates, and user preferences) for 60 seconds.
   - When updates occur, the collection cache is invalidated immediately.
3. **Graceful Disconnects**:
   - Traditional scripts close connections after every request; in Exia, `disconnect()` is a non-destructive no-op during standard execution, keeping the pool ready for the next invocation.

---

## 4. Environment Variables Configuration

In Vercel, environment variables are set in the **Project Settings -> Environment Variables** dashboard or configured via the CLI.

Required variables (see [`.env.example`](file:///e:/potfolio/Exia/.env.example)):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `MONGODB_URI` | Connection URI to MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `MONGODB_DATABASE` | Target Database name | `exia_db` |
| `JWT_SECRET` | 32-byte secret for JWT signing | `generated_hex_secret` |
| `LIVEKIT_API_HOST` | LiveKit SFU host | `wss://exia.livekit.cloud` |
| `LIVEKIT_API_KEY` | LiveKit API Key | `APIdxxxxxxx` |
| `LIVEKIT_API_SECRET` | LiveKit API Secret | `sec_xxxxxxx` |

---

## 5. Deployment Automation (`scripts/vercel.sh`)

Deployments to Vercel are executed through the streamlined shell script:

```bash
# Preview Deployment (generates unique test URL)
./scripts/vercel.sh

# Production Deployment (deploys to production domain)
./scripts/vercel.sh --prod
```

### Automation Workflow:
1. **CLI Detection**: Checks if `vercel` is installed in PATH; if not, automatically invokes `npx --yes vercel` without failing.
2. **Asset Validation**: Verifies that frontend assets exist in `backend/dist` (syncing from `frontend/dist` or executing a build if missing).
3. **Runtime Configuration**: Verifies [`backend/vercel.json`](file:///e:/potfolio/Exia/backend/vercel.json) and synchronizes [`backend/requirements-vercel.txt`](file:///e:/potfolio/Exia/backend/requirements-vercel.txt) into `backend/requirements.txt` for Vercel's Python builder.
4. **Execution**: Runs the Vercel deployment directly from `backend/`.
