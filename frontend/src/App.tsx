import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, type TabType } from './components/Sidebar';
import { LiveKitVoiceWrapper } from './components/LiveKitVoiceWrapper';
import { TasksView } from './components/TasksView';
import { MemoryView } from './components/MemoryView';
import { MCPView } from './components/MCPView';
import { TokenStudioView } from './components/TokenStudioView';
import { SettingsView } from './components/SettingsView';
import {
  initialTasks,
  initialMemories,
  initialMCPServers,
  initialMessages,
  defaultLiveKitConfig,
  defaultModelConfig,
  defaultMem0Config,
  defaultVoiceConfig,
  defaultMongoConfig,
} from './store/initialData';
import {
  AgentStatus,
  Task,
  MemoryItem,
  MCPServer,
  MCPTool,
  ChatMessage,
  LiveKitConfig,
  ModelConfig,
  Mem0Config,
  VoiceConfig,
  MongoConfig,
} from './types';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('voice');

  // Assistant State
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('disconnected');
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);

  // Persistence State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('ha_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    const saved = localStorage.getItem('ha_memories');
    return saved ? JSON.parse(saved) : initialMemories;
  });

  const [mcpServers, setMcpServers] = useState<MCPServer[]>(() => {
    const saved = localStorage.getItem('ha_mcp_servers');
    return saved ? JSON.parse(saved) : initialMCPServers;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ha_messages');
    return saved ? JSON.parse(saved) : initialMessages;
  });

  const [liveKitConfig, setLiveKitConfig] = useState<LiveKitConfig>(() => {
    const saved = localStorage.getItem('ha_livekit_config');
    return saved ? JSON.parse(saved) : defaultLiveKitConfig;
  });

  // Model Selection from UI
  const [modelConfig, setModelConfig] = useState<ModelConfig>(() => {
    const saved = localStorage.getItem('ha_model_config');
    return saved ? JSON.parse(saved) : defaultModelConfig;
  });

  // Mem0 Memory Configuration
  const [mem0Config, setMem0Config] = useState<Mem0Config>(() => {
    const saved = localStorage.getItem('ha_mem0_config');
    return saved ? JSON.parse(saved) : defaultMem0Config;
  });

  // Voice Settings
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(() => {
    const saved = localStorage.getItem('ha_voice_config');
    return saved ? JSON.parse(saved) : defaultVoiceConfig;
  });

  // MongoDB Atlas Settings
  const [mongoConfig, setMongoConfig] = useState<MongoConfig>(() => {
    const saved = localStorage.getItem('ha_mongo_config');
    return saved ? JSON.parse(saved) : defaultMongoConfig;
  });

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('ha_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ha_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('ha_mcp_servers', JSON.stringify(mcpServers));
  }, [mcpServers]);

  useEffect(() => {
    localStorage.setItem('ha_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('ha_livekit_config', JSON.stringify(liveKitConfig));
  }, [liveKitConfig]);

  useEffect(() => {
    localStorage.setItem('ha_model_config', JSON.stringify(modelConfig));
  }, [modelConfig]);

  useEffect(() => {
    localStorage.setItem('ha_mem0_config', JSON.stringify(mem0Config));
  }, [mem0Config]);

  useEffect(() => {
    localStorage.setItem('ha_voice_config', JSON.stringify(voiceConfig));
  }, [voiceConfig]);

  useEffect(() => {
    localStorage.setItem('ha_mongo_config', JSON.stringify(mongoConfig));
  }, [mongoConfig]);

  // Handle Voice Connection Toggle
  const handleToggleVoice = () => {
    if (isLiveKitConnected) {
      setIsLiveKitConnected(false);
      setAgentStatus('disconnected');
    } else {
      setIsLiveKitConnected(true);
      setAgentStatus('listening');
      setTimeout(() => {
        setAgentStatus('speaking');
        setTimeout(() => {
          setAgentStatus('listening');
        }, 2200);
      }, 500);
    }
  };

  // Handle User Message & Assistant Response Simulation
  const handleSendMessage = (text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setAgentStatus('thinking');

    setTimeout(() => {
      let replyText = `Processed with ${modelConfig.model}. Stored in MongoDB Atlas & Mem0.`;
      let toolCallInfo: { server: string; tool: string; result?: string } | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('task') || lower.includes('agenda') || lower.includes('plan')) {
        const pending = tasks.filter((t) => t.status !== 'completed');
        replyText = `Using ${modelConfig.model} + MongoDB Atlas: You have ${pending.length} pending tasks. Top priority: "${pending[0]?.title || 'None'}".`;
        toolCallInfo = {
          server: 'MongoDB Atlas',
          tool: `db.tasks.find({status: "todo"})`,
          result: `Retrieved ${pending.length} documents from MongoDB Atlas`,
        };
      } else if (lower.includes('memory') || lower.includes('remember') || lower.includes('preference')) {
        replyText = `Mem0 vector search matched ${memories.length} memories for user "${mem0Config.userId}". Key memory: "${memories[0]?.content}".`;
        toolCallInfo = {
          server: 'Mem0 Universal Memory',
          tool: `mem0.search(query="${text.slice(0, 18)}", user_id="${mem0Config.userId}")`,
          result: `Vector search matched ${memories.length} memories in ${mem0Config.vectorStore}`,
        };
      } else if (lower.includes('mcp') || lower.includes('file') || lower.includes('system') || lower.includes('tool')) {
        const activeServers = mcpServers.filter((s) => s.isConnected).map((s) => s.name);
        replyText = `Step 1: 'search_mcp_tools()' discovered tools on ${activeServers.join(', ')}. Step 2: 'execute_mcp_tool()' executed successfully.`;
        toolCallInfo = {
          server: 'MCP Manager (2-Step Pipeline)',
          tool: '1. search_mcp_tools("file") -> 2. execute_mcp_tool("Local Filesystem", "search_files", {path: "D:\\Documents"})',
          result: 'Found schema and executed command with response payload',
        };
      } else if (lower.includes('remind') || lower.includes('add')) {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          title: text.replace(/^remind me to /i, '').replace(/^add /i, ''),
          priority: 'medium',
          status: 'todo',
          dueDate: 'Today',
          category: 'personal',
          tags: ['voice-added'],
          createdAt: new Date().toISOString(),
        };
        setTasks((prev) => [newTask, ...prev]);
        replyText = `I added "${newTask.title}" to MongoDB Atlas and registered the event in Mem0.`;
        toolCallInfo = {
          server: 'MongoDB Atlas + Mem0',
          tool: `db.tasks.insertOne({title: "${newTask.title}"}) & mem0.add()`,
          result: `Inserted MongoDB ObjectId for task ${newTask.id}`,
        };
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCall: toolCallInfo,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setAgentStatus('speaking');

      setTimeout(() => {
        setAgentStatus(isLiveKitConnected ? 'listening' : 'disconnected');
      }, 2500);
    }, 1200);
  };

  // Ask AI Plan My Day
  const handleAskAIPlan = () => {
    setActiveTab('voice');
    handleSendMessage(`Please query MongoDB Atlas with ${modelConfig.model} and give me a clear daily plan.`);
  };

  // MCP Tool Testing Simulator
  const handleRunToolTest = (serverId: string, tool: MCPTool) => {
    setActiveTab('voice');
    const server = mcpServers.find((s) => s.id === serverId);
    handleSendMessage(`Execute MCP Pipeline: search_mcp_tools("${tool.name}") -> execute_mcp_tool("${server?.name}", "${tool.name}")`);
  };

  // Connect Voice Directly with UI Created Token
  const handleConnectVoiceWithToken = (token: string, roomName: string, serverUrl: string) => {
    setLiveKitConfig((prev) => ({
      ...prev,
      token,
      roomName,
      serverUrl,
      isConnected: true,
    }));
    setIsLiveKitConnected(true);
    setAgentStatus('listening');
    setActiveTab('voice');
  };

  // Reset / Export Handlers
  const handleResetData = () => {
    if (window.confirm('Reset all tasks, memories, and MCP settings to factory defaults?')) {
      localStorage.clear();
      setTasks(initialTasks);
      setMemories(initialMemories);
      setMcpServers(initialMCPServers);
      setMessages(initialMessages);
      setLiveKitConfig(defaultLiveKitConfig);
      setModelConfig(defaultModelConfig);
      setMem0Config(defaultMem0Config);
      setVoiceConfig(defaultVoiceConfig);
      setMongoConfig(defaultMongoConfig);
    }
  };

  const handleExportData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      mongoConfig,
      modelConfig,
      mem0Config,
      voiceConfig,
      tasks,
      memories,
      mcpServers,
      liveKitConfig,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homeassistant_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased overflow-hidden select-none">
      {/* Top Header */}
      <Navbar
        agentStatus={agentStatus}
        isLiveKitConnected={isLiveKitConnected}
        onToggleVoice={handleToggleVoice}
        mcpServerCount={mcpServers.filter((s) => s.isConnected).length}
        memoryCount={memories.length}
        taskCount={tasks.length}
        selectedModel={modelConfig.model}
        memoryEngine={mem0Config.engine}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingTasksCount={pendingTasks}
          memoryCount={memories.length}
          mcpServerCount={mcpServers.length}
        />

        {/* Center Content View */}
        <main className="flex-1 bg-zinc-950/40 relative overflow-hidden">
          {activeTab === 'voice' && (
            <LiveKitVoiceWrapper
              agentStatus={agentStatus}
              setAgentStatus={setAgentStatus}
              isLiveKitConnected={isLiveKitConnected}
              onToggleVoice={handleToggleVoice}
              messages={messages}
              onSendMessage={handleSendMessage}
              liveKitConfig={liveKitConfig}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              onAddTask={(newTask) => {
                const t: Task = {
                  ...newTask,
                  id: `task-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                };
                setTasks((prev) => [t, ...prev]);
              }}
              onToggleStatus={(id) => {
                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === id
                      ? {
                          ...t,
                          status: t.status === 'completed' ? 'todo' : 'completed',
                        }
                      : t
                  )
                );
              }}
              onDeleteTask={(id) => {
                setTasks((prev) => prev.filter((t) => t.id !== id));
              }}
              onAskAIPlan={handleAskAIPlan}
            />
          )}

          {activeTab === 'memory' && (
            <MemoryView
              memories={memories}
              onAddMemory={(newMem) => {
                const m: MemoryItem = {
                  ...newMem,
                  id: `mem-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                };
                setMemories((prev) => [m, ...prev]);
              }}
              onDeleteMemory={(id) => {
                setMemories((prev) => prev.filter((m) => m.id !== id));
              }}
            />
          )}

          {activeTab === 'mcp' && (
            <MCPView
              servers={mcpServers}
              onSetServers={(newServers) => setMcpServers(newServers)}
              onAddServer={(newServer) => {
                setMcpServers((prev) => [...prev, newServer]);
              }}
              onToggleServer={(id) => {
                setMcpServers((prev) =>
                  prev.map((s) =>
                    s.id === id ? { ...s, isConnected: !s.isConnected } : s
                  )
                );
              }}
              onToggleTool={(serverId, toolName) => {
                setMcpServers((prev) =>
                  prev.map((s) => {
                    if (s.id !== serverId) return s;
                    return {
                      ...s,
                      tools: s.tools.map((t) =>
                        t.name === toolName ? { ...t, isEnabled: !t.isEnabled } : t
                      ),
                    };
                  })
                );
              }}
              onDeleteServer={(id) => {
                setMcpServers((prev) => prev.filter((s) => s.id !== id));
              }}
              onRunToolTest={handleRunToolTest}
            />
          )}

          {activeTab === 'token' && (
            <TokenStudioView
              liveKitConfig={liveKitConfig}
              onUpdateLiveKitConfig={(cfg) => setLiveKitConfig(cfg)}
              modelConfig={modelConfig}
              mem0Config={mem0Config}
              voiceConfig={voiceConfig}
              mongoConfig={mongoConfig}
              mcpServers={mcpServers}
              onConnectVoiceWithToken={handleConnectVoiceWithToken}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              liveKitConfig={liveKitConfig}
              onUpdateLiveKitConfig={(cfg) => setLiveKitConfig(cfg)}
              modelConfig={modelConfig}
              onUpdateModelConfig={(cfg) => setModelConfig(cfg)}
              mem0Config={mem0Config}
              onUpdateMem0Config={(cfg) => setMem0Config(cfg)}
              voiceConfig={voiceConfig}
              onUpdateVoiceConfig={(cfg) => setVoiceConfig(cfg)}
              mongoConfig={mongoConfig}
              onUpdateMongoConfig={(cfg) => setMongoConfig(cfg)}
              mcpServers={mcpServers}
              taskCount={tasks.length}
              memoryCount={memories.length}
              serverCount={mcpServers.length}
              onResetData={handleResetData}
              onExportData={handleExportData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
