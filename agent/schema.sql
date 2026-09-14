-- ==============================================================================
-- HomeAssistant Local Database Schema (SQLite)
-- Designed for Private AI Desktop Assistant with LiveKit & MCP
-- ==============================================================================

-- 1. DAILY TASKS & ROUTINES
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
    due_date TEXT, -- ISO8601 string: YYYY-MM-DDTHH:MM:SS
    category TEXT DEFAULT 'general', -- work, personal, home, errands
    tags TEXT, -- JSON array of tags: '["urgent", "errand"]'
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    time_schedule TEXT NOT NULL, -- e.g. "08:00 AM" or cron expression
    trigger_prompt TEXT NOT NULL, -- e.g. "Review daily agenda and read unread reminders"
    is_active INTEGER DEFAULT 1,
    last_triggered_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 2. LONG-TERM & SEMANTIC MEMORY MANAGEMENT
-- Stores facts, user preferences, context, and knowledge the AI assistant remembers
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    category TEXT CHECK(category IN ('preference', 'fact', 'context', 'routine', 'rule')) DEFAULT 'fact',
    key_subject TEXT, -- e.g. "coffee_preference", "project_deadline", "work_hours"
    content TEXT NOT NULL, -- e.g. "User prefers oat milk in coffee", "Working on HomeAsstant project"
    importance_score REAL DEFAULT 0.5, -- 0.0 to 1.0 (determines RAG retrieval weight)
    source TEXT DEFAULT 'conversation', -- conversation, manual_entry, mcp_tool
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Virtual table for fast full-text keyword search across memories
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
    id UNINDEXED,
    key_subject,
    content,
    tokenize='porter'
);

-- Triggers to keep FTS index synced
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
    INSERT INTO memories_fts(id, key_subject, content) VALUES (new.id, new.key_subject, new.content);
END;

CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
    DELETE FROM memories_fts WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
    DELETE FROM memories_fts WHERE id = old.id;
    INSERT INTO memories_fts(id, key_subject, content) VALUES (new.id, new.key_subject, new.content);
END;

-- 3. MCP (MODEL CONTEXT PROTOCOL) REGISTRY
-- Configures external tools and servers that the assistant can invoke
CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    transport TEXT CHECK(transport IN ('stdio', 'sse', 'websocket')) DEFAULT 'stdio',
    command TEXT, -- e.g. "npx -y @modelcontextprotocol/server-filesystem" or "python -m my_mcp"
    args TEXT, -- JSON array of CLI args: '["D:\\Documents"]'
    url TEXT, -- SSE endpoint if transport = 'sse'
    env_vars TEXT, -- JSON object of environment variables
    is_enabled INTEGER DEFAULT 1,
    cached_tools TEXT, -- JSON array of discovered tools and schemas
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 4. CONVERSATION HISTORY & AUDIT LOG
CREATE TABLE IF NOT EXISTS conversation_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
    content TEXT NOT NULL,
    tool_calls TEXT, -- JSON array of tool calls made
    tool_call_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
CREATE INDEX IF NOT EXISTS idx_messages_session ON conversation_messages(session_id);
