export type AgentStatus = 'disconnected' | 'connecting' | 'listening' | 'thinking' | 'speaking';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  category: 'work' | 'personal' | 'home' | 'health';
  tags: string[];
  createdAt: string;
}

export type MemoryCategory = 'preference' | 'fact' | 'context' | 'routine' | 'rule';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  subject: string;
  content: string;
  importance: number; // 0.0 to 1.0
  source: 'conversation' | 'manual' | 'mcp_tool' | 'mem0';
  createdAt: string;
}

export interface MCPTool {
  name: string;
  description: string;
  parametersSummary: string;
  isEnabled: boolean;
}

export interface MCPServer {
  id: string;
  name: string;
  transport: 'stdio' | 'sse' | 'websocket';
  command?: string;
  args?: string[];
  url?: string;
  isConnected: boolean;
  tools: MCPTool[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  audioDuration?: number;
  toolCall?: {
    server: string;
    tool: string;
    result?: string;
  };
}

export interface LiveKitConfig {
  serverUrl: string;
  token: string;
  apiKey?: string;
  apiSecret?: string;
  identity?: string;
  participantName?: string;
  roomName: string;
  agentName: string;
  isConnected: boolean;
}

export interface ModelConfig {
  provider: 'ollama' | 'lmstudio' | 'openai' | 'gemini';
  model: string;
  baseUrl: string;
  temperature: number;
}

export interface Mem0Config {
  engine: 'mem0';
  userId: string;
  vectorStore: 'qdrant' | 'sqlite' | 'chroma';
  localStoragePath: string;
  apiKey?: string;
}

export interface VoiceConfig {
  ttsProvider: string;
  voice: string;
  speed: number;
}

export interface MongoConfig {
  uri: string;
  dbName: string;
  isConnected: boolean;
}

