import { Task, MemoryItem, MCPServer, ChatMessage, LiveKitConfig, MongoConfig } from '../types';

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Review weekly home groceries & supplies',
    description: 'Check milk, coffee beans, pantry staples, and filter refills.',
    priority: 'medium',
    status: 'todo',
    dueDate: 'Today, 5:00 PM',
    category: 'home',
    tags: ['groceries', 'routine'],
    createdAt: '2026-09-14T08:30:00Z',
  },
  {
    id: 'task-2',
    title: 'Water the balcony plants & check moisture sensors',
    description: 'Check soil hydration levels and turn off drip automation if rainy.',
    priority: 'low',
    status: 'completed',
    dueDate: 'Today, 9:00 AM',
    category: 'home',
    tags: ['plants', 'automation'],
    createdAt: '2026-09-14T07:15:00Z',
  },
  {
    id: 'task-3',
    title: 'Prepare project milestones report for team standup',
    description: 'Summarize key deliverables, blockers, and next sprint goals.',
    priority: 'high',
    status: 'in_progress',
    dueDate: 'Today, 2:30 PM',
    category: 'work',
    tags: ['work', 'report'],
    createdAt: '2026-09-14T09:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Schedule dentist checkup appointment',
    description: 'Call Dr. Miller office or book via online patient portal.',
    priority: 'urgent',
    status: 'todo',
    dueDate: 'Tomorrow, 11:00 AM',
    category: 'health',
    tags: ['health', 'appointment'],
    createdAt: '2026-09-14T09:45:00Z',
  },
];

export const initialMemories: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preference',
    subject: 'Beverage & Morning Routine',
    content: 'User drinks black pour-over coffee with zero sugar every morning around 8:00 AM.',
    importance: 0.85,
    source: 'conversation',
    createdAt: '2026-09-10T08:12:00Z',
  },
  {
    id: 'mem-2',
    category: 'routine',
    subject: 'Daily Standup Time',
    content: 'User has daily work sync meeting at 10:00 AM Monday through Friday.',
    importance: 0.95,
    source: 'manual',
    createdAt: '2026-09-11T14:20:00Z',
  },
  {
    id: 'mem-3',
    category: 'context',
    subject: 'Current Active Project',
    content: 'Building a 100% private local desktop AI Home Assistant using LiveKit and MCP.',
    importance: 1.0,
    source: 'conversation',
    createdAt: '2026-09-14T10:15:00Z',
  },
  {
    id: 'mem-4',
    category: 'rule',
    subject: 'Privacy & Data Boundary',
    content: 'Never send personal audio recordings or SQLite database records to external cloud servers.',
    importance: 1.0,
    source: 'manual',
    createdAt: '2026-09-12T11:00:00Z',
  },
];

export const initialMCPServers: MCPServer[] = [
  {
    id: 'mcp-filesystem',
    name: 'Local Filesystem MCP',
    transport: 'stdio',
    command: 'npx -y @modelcontextprotocol/server-filesystem D:\\Documents',
    args: ['D:\\Documents'],
    isConnected: true,
    tools: [
      {
        name: 'read_file',
        description: 'Read content from local files in allowed workspace folders',
        parametersSummary: 'path: string',
        isEnabled: true,
      },
      {
        name: 'write_file',
        description: 'Save or update local notes, lists, or markdown files',
        parametersSummary: 'path: string, content: string',
        isEnabled: true,
      },
      {
        name: 'search_files',
        description: 'Search files matching glob patterns or keywords',
        parametersSummary: 'pattern: string, path: string',
        isEnabled: true,
      },
    ],
  },
  {
    id: 'mcp-desktop',
    name: 'Windows Desktop Automation',
    transport: 'stdio',
    command: 'python -m mcp_desktop_tools',
    args: ['--safe-mode'],
    isConnected: true,
    tools: [
      {
        name: 'send_desktop_notification',
        description: 'Send native Windows notification toast for reminders',
        parametersSummary: 'title: string, message: string',
        isEnabled: true,
      },
      {
        name: 'get_system_stats',
        description: 'Get CPU, RAM usage and battery/power status',
        parametersSummary: 'none',
        isEnabled: true,
      },
    ],
  },
  {
    id: 'mcp-weather',
    name: 'Local Weather & Environment SSE',
    transport: 'sse',
    url: 'http://localhost:8088/events',
    isConnected: true,
    tools: [
      {
        name: 'get_local_forecast',
        description: 'Retrieve current temperature, humidity, and forecast',
        parametersSummary: 'location?: string',
        isEnabled: true,
      },
    ],
  },
  {
    id: 'mcp-mem0',
    name: 'Mem0 Memory MCP (mem0mcp)',
    transport: 'stdio',
    command: 'uvx mem0-mcp',
    args: ['--user-id', 'desktop-user'],
    isConnected: true,
    tools: [
      {
        name: 'add_memory',
        description: 'Extract and save personal fact or preference into Mem0',
        parametersSummary: 'text: string, user_id?: string',
        isEnabled: true,
      },
      {
        name: 'search_memories',
        description: 'Semantic vector search across past user memories in Mem0',
        parametersSummary: 'query: string, user_id?: string',
        isEnabled: true,
      },
      {
        name: 'get_all_memories',
        description: 'Retrieve all knowledge entries for the active user',
        parametersSummary: 'user_id?: string',
        isEnabled: true,
      },
    ],
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    text: 'Good morning! I am your private LiveKit Home Assistant. How can I help you today?',
    timestamp: '10:00 AM',
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: 'What are my top priority tasks for today?',
    timestamp: '10:02 AM',
  },
  {
    id: 'msg-3',
    sender: 'assistant',
    text: 'You have 2 high-priority items: 1) Prepare project milestones report by 2:30 PM, and 2) Schedule dentist checkup appointment.',
    timestamp: '10:02 AM',
    toolCall: {
      server: 'Local SQLite Store',
      tool: 'query_tasks(priority="urgent,high")',
      result: 'Found 2 urgent/high tasks for 2026-09-14',
    },
  },
];

export const defaultLiveKitConfig: LiveKitConfig = {
  serverUrl: 'ws://localhost:7880',
  token: '',
  apiKey: 'devkey',
  apiSecret: 'secret',
  identity: 'desktop-user',
  participantName: 'Home Assistant User',
  roomName: 'home-assistant-room',
  agentName: 'private-home-assistant',
  isConnected: false,
};

export const defaultModelConfig: ModelConfig = {
  provider: 'ollama',
  model: 'llama3.2:latest',
  baseUrl: 'http://localhost:11434/v1',
  temperature: 0.7,
};

export const defaultMem0Config: Mem0Config = {
  engine: 'mem0',
  userId: 'desktop-user',
  vectorStore: 'sqlite',
  localStoragePath: './memory.db',
};

export const defaultVoiceConfig: VoiceConfig = {
  ttsProvider: 'openai',
  voice: 'alloy',
  speed: 1.0,
};

export const defaultMongoConfig: MongoConfig = {
  uri: 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority',
  dbName: 'home_assistant',
  isConnected: false,
};


