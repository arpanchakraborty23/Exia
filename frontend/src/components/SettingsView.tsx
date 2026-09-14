import React, { useState } from 'react';
import {
  Settings,
  Radio,
  Cpu,
  Database,
  Download,
  RotateCcw,
  Check,
  ShieldCheck,
  Key,
  Blocks,
  Copy,
  Sparkles,
  Brain,
  Search,
  Wrench,
  Server,
  ArrowRight,
} from 'lucide-react';
import { LiveKitConfig, MCPServer, ModelConfig, Mem0Config, VoiceConfig, MongoConfig } from '../types';
import { generateTokenWithFullSettings, TokenGenerationResult } from '../services/tokenService';

interface SettingsViewProps {
  liveKitConfig: LiveKitConfig;
  onUpdateLiveKitConfig: (config: LiveKitConfig) => void;
  modelConfig: ModelConfig;
  onUpdateModelConfig: (config: ModelConfig) => void;
  mem0Config: Mem0Config;
  onUpdateMem0Config: (config: Mem0Config) => void;
  voiceConfig: VoiceConfig;
  onUpdateVoiceConfig: (config: VoiceConfig) => void;
  mongoConfig: MongoConfig;
  onUpdateMongoConfig: (config: MongoConfig) => void;
  mcpServers: MCPServer[];
  taskCount: number;
  memoryCount: number;
  serverCount: number;
  onResetData: () => void;
  onExportData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  liveKitConfig,
  onUpdateLiveKitConfig,
  modelConfig,
  onUpdateModelConfig,
  mem0Config,
  onUpdateMem0Config,
  voiceConfig,
  onUpdateVoiceConfig,
  mongoConfig,
  onUpdateMongoConfig,
  mcpServers,
  taskCount,
  memoryCount,
  serverCount,
  onResetData,
  onExportData,
}) => {
  const [lkConfig, setLkConfig] = useState<LiveKitConfig>(liveKitConfig);
  const [localModel, setLocalModel] = useState<ModelConfig>(modelConfig);
  const [localMem0, setLocalMem0] = useState<Mem0Config>(mem0Config);
  const [localVoice, setLocalVoice] = useState<VoiceConfig>(voiceConfig);
  const [localMongo, setLocalMongo] = useState<MongoConfig>(mongoConfig);

  const [saved, setSaved] = useState(false);
  const [tokenResult, setTokenResult] = useState<TokenGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLiveKitConfig(lkConfig);
    onUpdateModelConfig(localModel);
    onUpdateMem0Config(localMem0);
    onUpdateVoiceConfig(localVoice);
    onUpdateMongoConfig(localMongo);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      const result = await generateTokenWithFullSettings({
        roomName: lkConfig.roomName,
        identity: localMem0.userId || 'desktop-user',
        participantName: lkConfig.participantName || 'Home Assistant User',
        apiKey: lkConfig.apiKey || 'devkey',
        apiSecret: lkConfig.apiSecret || 'secret',
        mcpServers,
        modelConfig: localModel,
        memoryConfig: localMem0,
        voiceConfig: localVoice,
        mongoConfig: localMongo,
      });

      setTokenResult(result);

      const updatedLk = { ...lkConfig, token: result.token };
      setLkConfig(updatedLk);
      onUpdateLiveKitConfig(updatedLk);
      onUpdateModelConfig(localModel);
      onUpdateMem0Config(localMem0);
      onUpdateVoiceConfig(localVoice);
      onUpdateMongoConfig(localMongo);
    } catch (err) {
      console.error('Failed to generate token:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToken = () => {
    if (tokenResult?.token) {
      navigator.clipboard.writeText(tokenResult.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeMcpCount = mcpServers.filter((s) => s.isConnected).length;

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Top Title */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Settings: MongoDB Atlas, Models, Mem0 & MCP Tools
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Configure MongoDB Atlas URI, select models, manage Mem0 local memory, and inspect the 2-step MCP tool discovery and execution pipeline.
        </p>
      </div>

      {/* 1. MASTER TOKEN GENERATION WITH ALL SETTINGS */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-900/40 border border-indigo-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Key className="w-4 h-4 text-indigo-400" />
              LiveKit Token Minting (All Settings Passed into Token)
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Embeds Model Selection + MCP Tools + Mem0 Memory into the LiveKit JWT metadata.
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Model: {localModel.model}
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {activeMcpCount} MCP Servers
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
              Mem0 Memory Active
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              MongoDB Atlas Ready
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleGenerateToken}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Minting Token with All Settings...' : 'Generate Token with Model + MCP + Mem0'}</span>
          </button>

          <span className="text-[11px] text-zinc-500 font-mono">
            Backend Endpoint: <code className="text-zinc-400">POST http://localhost:8000/api/token</code>
          </span>
        </div>

        {/* Generated Token Result & Full Metadata Inspector */}
        {tokenResult && (
          <div className="mt-3 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Token Generated with All UI Settings!
              </span>
              <button
                onClick={handleCopyToken}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy Token'}</span>
              </button>
            </div>

            <div>
              <div className="text-[11px] text-zinc-500 mb-1">Generated JWT AccessToken:</div>
              <div className="text-[11px] font-mono text-zinc-300 bg-zinc-900 p-2 rounded-lg break-all border border-zinc-800/80 select-all">
                {tokenResult.token}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-zinc-500 mb-1">
                Full Metadata Payload Embedded in Token (Passed to Python Agent):
              </div>
              <pre className="text-[10px] font-mono text-indigo-300 bg-zinc-900 p-2.5 rounded-lg overflow-x-auto border border-zinc-800/80 max-h-48">
                {JSON.stringify(tokenResult.payloadSent, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* 2. THE TWO MCP TOOLS ARCHITECTURE CALLOUT */}
      <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Wrench className="w-4 h-4 text-indigo-400" />
          Assistant MCP Tool Execution Architecture (2 Core Tools)
        </div>
        <p className="text-xs text-zinc-400">
          To prevent overloading the LLM context with hundreds of tool schemas, the assistant operates using a two-step discovery and execution workflow:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Tool 1 */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-indigo-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-400" />
                Tool 1: search_mcp_tools(query)
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Step 1: Discovery
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              When the user requests an action, the LLM calls <code className="text-indigo-300 font-mono">search_mcp_tools</code> first to see what tools are available on connected servers and inspect their exact argument schemas.
            </p>
          </div>

          {/* Tool 2 */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-purple-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                Tool 2: execute_mcp_tool(server, tool, args)
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Step 2: Execution
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Once the LLM finds the tool name and schema, it calls <code className="text-purple-300 font-mono">execute_mcp_tool</code> with the validated arguments. The MCP client runs the tool and returns the response.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. MODEL SELECTION FROM UI */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Cpu className="w-4 h-4 text-emerald-400" />
                Model Selection (Sent to Agent)
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Private Local AI
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Inference Provider</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['ollama', 'lmstudio', 'openai', 'gemini'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setLocalModel({ ...localModel, provider: prov })}
                      className={`py-2 rounded-xl text-xs font-medium capitalize border transition-all ${
                        localModel.provider === prov
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Select Model</label>
                <select
                  value={localModel.model}
                  onChange={(e) => setLocalModel({ ...localModel, model: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="llama3.2:latest">Llama 3.2 (Default - Ultra-fast voice)</option>
                  <option value="qwen2.5:latest">Qwen 2.5 (High reasoning & tool calling)</option>
                  <option value="deepseek-r1:8b">DeepSeek R1 8B (Deep local reasoning)</option>
                  <option value="mistral:latest">Mistral 7B (Daily task model)</option>
                  <option value="gpt-4o-mini">OpenAI GPT-4o-mini</option>
                  <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                  <option value="custom">Custom Model Name...</option>
                </select>
              </div>

              {localModel.model === 'custom' && (
                <div>
                  <label className="text-[11px] text-zinc-400 mb-1 block">Custom Model Identifier</label>
                  <input
                    type="text"
                    onChange={(e) => setLocalModel({ ...localModel, model: e.target.value })}
                    placeholder="e.g. dolphin-mixtral, codellama:13b"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">API Base URL</label>
                <input
                  type="text"
                  value={localModel.baseUrl}
                  onChange={(e) => setLocalModel({ ...localModel, baseUrl: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <span>Temperature: {localModel.temperature}</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={localModel.temperature}
                  onChange={(e) =>
                    setLocalModel({ ...localModel, temperature: parseFloat(e.target.value) })
                  }
                  className="w-36 accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 4. MEM0 MEMORY SETTINGS */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Brain className="w-4 h-4 text-pink-400" />
                Mem0 Memory Layer Settings
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 font-mono">
                Mem0 Engine
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Mem0 User ID (Partition Key)</label>
                <input
                  type="text"
                  value={localMem0.userId}
                  onChange={(e) => setLocalMem0({ ...localMem0, userId: e.target.value })}
                  placeholder="desktop-user"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Mem0 extracts facts and stores them under this user ID in your local vector store.
                </p>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Memory Store Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sqlite', 'qdrant', 'chroma'] as const).map((store) => (
                    <button
                      key={store}
                      type="button"
                      onClick={() => setLocalMem0({ ...localMem0, vectorStore: store })}
                      className={`py-2 rounded-xl text-xs font-medium uppercase border transition-all ${
                        localMem0.vectorStore === store
                          ? 'bg-pink-500/15 text-pink-300 border-pink-500/40 font-bold'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {store === 'sqlite' ? 'SQLite (Local)' : store}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">SQLite Database File Path</label>
                <input
                  type="text"
                  value={localMem0.localStoragePath}
                  onChange={(e) => setLocalMem0({ ...localMem0, localStoragePath: e.target.value })}
                  placeholder="./memory.db"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">
                  Optional: Mem0 Platform API Key (leave empty for 100% local)
                </label>
                <input
                  type="password"
                  value={localMem0.apiKey || ''}
                  onChange={(e) => setLocalMem0({ ...localMem0, apiKey: e.target.value })}
                  placeholder="m0-..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. MONGODB ATLAS DATABASE CONFIGURATION */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Database className="w-4 h-4 text-cyan-400" />
              MongoDB Atlas Database Configuration
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
              Atlas Cloud Store
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-[11px] text-zinc-400 mb-1 block">MongoDB Atlas URI (Connection String)</label>
              <input
                type="password"
                value={localMongo.uri}
                onChange={(e) => setLocalMongo({ ...localMongo, uri: e.target.value })}
                placeholder="mongodb+srv://admin:password@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Used in <code className="text-zinc-400">backend/.env</code> as <code className="text-cyan-300">MONGODB_URI</code> to persist tasks and conversations.
              </p>
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Database Name</label>
              <input
                type="text"
                value={localMongo.dbName}
                onChange={(e) => setLocalMongo({ ...localMongo, dbName: e.target.value })}
                placeholder="home_assistant"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 6. LIVEKIT CONNECTION & VOICE SETTINGS */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Radio className="w-4 h-4 text-purple-400" />
              LiveKit Server Connection & Room Settings
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
              WebRTC Audio
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">LiveKit Server URL</label>
              <input
                type="text"
                value={lkConfig.serverUrl}
                onChange={(e) => setLkConfig({ ...lkConfig, serverUrl: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">LiveKit API Key</label>
              <input
                type="text"
                value={lkConfig.apiKey || ''}
                onChange={(e) => setLkConfig({ ...lkConfig, apiKey: e.target.value })}
                placeholder="devkey"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">LiveKit API Secret</label>
              <input
                type="password"
                value={lkConfig.apiSecret || ''}
                onChange={(e) => setLkConfig({ ...lkConfig, apiSecret: e.target.value })}
                placeholder="secret"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Room Name</label>
              <input
                type="text"
                value={lkConfig.roomName}
                onChange={(e) => setLkConfig({ ...lkConfig, roomName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Participant Name</label>
              <input
                type="text"
                value={lkConfig.participantName || ''}
                onChange={(e) => setLkConfig({ ...lkConfig, participantName: e.target.value })}
                placeholder="Home Assistant User"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Voice Synthesis (TTS Voice)</label>
              <select
                value={localVoice.voice}
                onChange={(e) => setLocalVoice({ ...localVoice, voice: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="alloy">Alloy (Neutral & Clear)</option>
                <option value="echo">Echo (Warm Voice)</option>
                <option value="fable">Fable (Expressive)</option>
                <option value="onyx">Onyx (Deep & Authoritative)</option>
                <option value="nova">Nova (Energetic)</option>
                <option value="shimmer">Shimmer (Gentle & Calm)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md cursor-pointer"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{saved ? 'Saved All Configurations' : 'Save Configurations'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 7. DATABASE STATS & BACKUP */}
      <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Database className="w-4 h-4 text-cyan-400" />
            Storage Overview (MongoDB Atlas + Mem0)
          </div>
          <span className="text-xs text-zinc-400 font-mono">Database: {localMongo.dbName}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-[11px] text-zinc-500">Tasks Collection</div>
            <div className="text-base font-bold text-zinc-100">{taskCount} Records</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-[11px] text-zinc-500">Mem0 Memories</div>
            <div className="text-base font-bold text-zinc-100">{memoryCount} Items</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-[11px] text-zinc-500">MCP Servers</div>
            <div className="text-base font-bold text-zinc-100">{serverCount} Registered</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-[11px] text-zinc-500">Selected LLM</div>
            <div className="text-base font-bold text-emerald-400 truncate">{localModel.model}</div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/60">
          <div className="flex items-center gap-2">
            <button
              onClick={onExportData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full JSON Backup</span>
            </button>

            <button
              onClick={onResetData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Factory Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
