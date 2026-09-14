import React, { useState, useEffect } from 'react';
import {
  Key,
  Sparkles,
  Copy,
  Check,
  Radio,
  Cpu,
  Brain,
  Blocks,
  Database,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Layers,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  User,
  ChevronRight,
} from 'lucide-react';
import { LiveKitConfig, MCPServer, ModelConfig, Mem0Config, VoiceConfig, MongoConfig } from '../types';
import {
  generateTokenWithFullSettings,
  checkBackendStats,
  decodeLiveKitToken,
  fetchSessionHistory,
  TokenGenerationResult,
  DecodedJwtInfo,
  SessionRecord,
} from '../services/tokenService';

interface TokenStudioViewProps {
  liveKitConfig: LiveKitConfig;
  onUpdateLiveKitConfig: (config: LiveKitConfig) => void;
  modelConfig: ModelConfig;
  mem0Config: Mem0Config;
  voiceConfig: VoiceConfig;
  mongoConfig: MongoConfig;
  mcpServers: MCPServer[];
  onConnectVoiceWithToken: (token: string, roomName: string, serverUrl: string) => void;
}

export const TokenStudioView: React.FC<TokenStudioViewProps> = ({
  liveKitConfig,
  onUpdateLiveKitConfig,
  modelConfig,
  mem0Config,
  voiceConfig,
  mongoConfig,
  mcpServers,
  onConnectVoiceWithToken,
}) => {
  // Sub-view tab: 'mint' or 'history'
  const [activeSubTab, setActiveSubTab] = useState<'mint' | 'history'>('mint');

  // Mode: auto, browser (pure client WebCrypto), or server (FastAPI + MongoDB)
  const [generationMode, setGenerationMode] = useState<'auto' | 'browser' | 'server'>('browser');

  // Credentials & Parameters
  const [apiKey, setApiKey] = useState(liveKitConfig.apiKey || 'devkey');
  const [apiSecret, setApiSecret] = useState(liveKitConfig.apiSecret || 'secret');
  const [showSecret, setShowSecret] = useState(false);
  const [roomName, setRoomName] = useState(liveKitConfig.roomName || 'home-assistant-room');
  const [identity, setIdentity] = useState(liveKitConfig.identity || 'desktop-user');
  const [participantName, setParticipantName] = useState(liveKitConfig.participantName || 'Home Assistant Master');
  const [ttlHours, setTtlHours] = useState(6);

  // Video Grants
  const [grants, setGrants] = useState({
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenResult, setTokenResult] = useState<TokenGenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverStats, setServerStats] = useState<{
    online: boolean;
    mongoStatus?: string;
    mongoCounts?: Record<string, number>;
  }>({ online: false });

  // Session History State (Fetched from MongoDB Atlas)
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionSource, setSessionSource] = useState<string>('mongodb_atlas');
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  // Custom token decoder input
  const [manualToken, setManualToken] = useState('');
  const [manualDecoded, setManualDecoded] = useState<DecodedJwtInfo | null>(null);

  // Active MCP Tools count
  const activeServers = mcpServers.filter((s) => s.isConnected);
  const totalActiveTools = activeServers.reduce((acc, s) => acc + s.tools.filter((t) => t.isEnabled).length, 0);

  // Poll backend health & fetch session history on mount
  useEffect(() => {
    checkBackendStats().then((res) => {
      setServerStats(res);
      if (res.online) {
        setGenerationMode('auto');
      }
    });
    loadSessionHistory();
  }, []);

  const loadSessionHistory = async () => {
    setIsLoadingSessions(true);
    const result = await fetchSessionHistory();
    setSessions(result.sessions);
    setSessionSource(result.source);
    setIsLoadingSessions(false);
  };

  // Handle Token Generation (Sends session_id and identity; MCP data stored in MongoDB Atlas)
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateTokenWithFullSettings({
        roomName,
        identity,
        participantName,
        apiKey,
        apiSecret,
        ttlSeconds: ttlHours * 3600,
        grants,
        mcpServers,
        includeMcpInToken: false, // Clean architecture: MCP tools stored in MongoDB Atlas
        modelConfig,
        memoryConfig: mem0Config,
        voiceConfig,
        mongoConfig,
        generationMode,
      });

      setTokenResult(result);

      // Record session locally and refresh
      const newSession: SessionRecord = {
        session_id: result.sessionId,
        room_name: result.roomName,
        identity: result.identity,
        participant_name: participantName,
        status: 'active',
        model_config: {
          provider: modelConfig.provider,
          model: modelConfig.model,
        },
        memory_config: {
          engine: mem0Config.engine,
          user_id: mem0Config.userId,
        },
        created_at: new Date().toISOString(),
      };

      setSessions((prev) => [newSession, ...prev.filter((s) => s.session_id !== newSession.session_id)]);
      const historyList = [newSession, ...sessions.slice(0, 49)];
      localStorage.setItem('ha_session_history', JSON.stringify(historyList));

      // Also update parent LiveKitConfig
      const updatedConfig: LiveKitConfig = {
        ...liveKitConfig,
        token: result.token,
        serverUrl: result.serverUrl,
        roomName: result.roomName,
        apiKey,
        apiSecret,
        identity,
        participantName,
      };
      onUpdateLiveKitConfig(updatedConfig);
    } catch (err: any) {
      console.error('Token generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (tokenResult?.token) {
      navigator.clipboard.writeText(tokenResult.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectNow = () => {
    if (tokenResult?.token) {
      onConnectVoiceWithToken(tokenResult.token, roomName, liveKitConfig.serverUrl);
    }
  };

  const handleDecodeManualToken = (tok: string) => {
    setManualToken(tok);
    if (tok.trim()) {
      setManualDecoded(decodeLiveKitToken(tok));
    } else {
      setManualDecoded(null);
    }
  };

  const activeDecoded = tokenResult?.decoded || (manualDecoded ? manualDecoded : null);

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-400" />
            LiveKit Token Studio & Session History
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Mints lightweight tokens with <code className="text-indigo-300 font-mono">session_id</code> & <code className="text-purple-300 font-mono">identity</code>. MCP servers are stored in MongoDB Atlas, and session history is loaded directly from MongoDB.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                serverStats.online ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
              }`}
            />
            <span className="text-zinc-300">
              {serverStats.online ? 'FastAPI + MongoDB: Connected' : 'In-UI WebCrypto Mode: Ready'}
            </span>
          </div>

          <button
            onClick={() => {
              checkBackendStats().then(setServerStats);
              loadSessionHistory();
            }}
            title="Refresh connection & session history"
            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Tabs: 1. Mint Token | 2. Session History from MongoDB Atlas */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveSubTab('mint')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'mint'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Mint Token (Lightweight Metadata)</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('history');
            loadSessionHistory();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'history'
              ? 'border-cyan-500 text-cyan-300 bg-cyan-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Session History (from MongoDB Atlas)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300">
            {sessions.length}
          </span>
        </button>
      </div>

      {/* TAB 1: MINT LIGHTWEIGHT TOKEN */}
      {activeSubTab === 'mint' && (
        <div className="space-y-6">
          {/* Architecture Callout Banner */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200">
                  Clean Architecture: Lightweight Token + Direct MongoDB Atlas Store
                </div>
                <div className="text-[11px] text-zinc-400">
                  Token metadata contains only <span className="text-indigo-300 font-mono">session_id</span> & <span className="text-purple-300 font-mono">identity</span>. MCP tool definitions are read directly from MongoDB Atlas!
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                MCP in MongoDB
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Token ~300 Bytes
              </span>
            </div>
          </div>

          {/* Engine Mode Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setGenerationMode('browser')}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                generationMode === 'browser'
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-semibold flex items-center justify-between">
                <span>In-UI Direct Generator</span>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Signs HMAC-SHA256 JWT in-browser using Web Crypto. Works 100% offline with zero external dependencies.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setGenerationMode('server')}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                generationMode === 'server'
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-semibold flex items-center justify-between">
                <span>FastAPI Token Server</span>
                <Server className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Calls <code className="text-zinc-300 font-mono">:8000/api/token</code> and commits schemas into MongoDB Atlas collections.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setGenerationMode('auto')}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                generationMode === 'auto'
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-semibold flex items-center justify-between">
                <span>Auto (Smart Fallback)</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Uses FastAPI token server if active for MongoDB sync; seamlessly falls back to In-UI Web Crypto if offline.
              </p>
            </button>
          </div>

          {/* Credentials & Token Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: LiveKit Credentials & Room */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-purple-400" />
                  LiveKit Credentials & Room Identity
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  LiveKit JWT
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 mb-1 block">LiveKit API Key (iss)</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="devkey"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 mb-1 flex items-center justify-between">
                    <span>API Secret (HMAC-SHA256)</span>
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </label>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="secret"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 mb-1 block">Participant Identity (sub)</label>
                  <input
                    type="text"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    placeholder="desktop-user"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 mb-1 block">Display Name</label>
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Home Assistant Master"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 mb-1 block">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="home-assistant-room"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 mb-1 block">Token Validity (TTL)</label>
                  <select
                    value={ttlHours}
                    onChange={(e) => setTtlHours(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={1}>1 Hour (Quick Test)</option>
                    <option value={6}>6 Hours (Standard Session)</option>
                    <option value={24}>24 Hours (Full Day)</option>
                    <option value={168}>7 Days (Persistent Desktop)</option>
                  </select>
                </div>
              </div>

              {/* Video Grants */}
              <div>
                <label className="text-[11px] text-zinc-400 mb-2 block">LiveKit Room Permissions (VideoGrants)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grants.roomJoin}
                      onChange={(e) => setGrants({ ...grants, roomJoin: e.target.checked })}
                      className="rounded text-indigo-500 accent-indigo-500"
                    />
                    <span>roomJoin</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grants.canPublish}
                      onChange={(e) => setGrants({ ...grants, canPublish: e.target.checked })}
                      className="rounded text-indigo-500 accent-indigo-500"
                    />
                    <span>canPublish (Mic)</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grants.canSubscribe}
                      onChange={(e) => setGrants({ ...grants, canSubscribe: e.target.checked })}
                      className="rounded text-indigo-500 accent-indigo-500"
                    />
                    <span>canSubscribe</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grants.canPublishData}
                      onChange={(e) => setGrants({ ...grants, canPublishData: e.target.checked })}
                      className="rounded text-indigo-500 accent-indigo-500"
                    />
                    <span>canPublishData</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Embedded Metadata Preview */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  What is Embedded in Token Metadata
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Minimal & Clean
                </span>
              </div>

              <div className="space-y-2.5">
                {/* 1. Session ID & Identity */}
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Session ID & Identity</div>
                      <div className="text-[10px] text-zinc-400">
                        Identity: <span className="font-mono text-zinc-200">{identity}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10">
                    Auto-Generated
                  </span>
                </div>

                {/* 2. Model Selection */}
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Model Selection</div>
                      <div className="text-[10px] text-zinc-400">
                        Provider: <span className="text-zinc-200 capitalize">{modelConfig.provider}</span> • Temp: {modelConfig.temperature}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10">
                    {modelConfig.model}
                  </span>
                </div>

                {/* 3. Mem0 SQLite */}
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-pink-400" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Mem0 Memory Storage</div>
                      <div className="text-[10px] text-zinc-400">
                        User ID: <span className="font-mono text-zinc-200">{mem0Config.userId}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-pink-300 px-2 py-0.5 rounded bg-pink-500/10">
                    SQLite ({mem0Config.localStoragePath})
                  </span>
                </div>

                {/* 4. MCP Servers Notice */}
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-cyan-200">MCP Servers Storage</div>
                      <div className="text-[10px] text-cyan-400/80">
                        Stored in MongoDB Atlas <code className="font-mono text-cyan-300">mcp_servers</code> collection
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    Not In Token
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? 'Minting LiveKit JWT...' : 'Create LiveKit Token Now'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Generated Token Result & Live JWT Inspector */}
          {tokenResult && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-zinc-900/60 to-zinc-950 border border-indigo-500/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-sm font-semibold text-zinc-100">LiveKit Token Successfully Generated!</span>
                    <span className="text-xs text-zinc-400 ml-2">
                      Session ID: <code className="text-indigo-300 font-mono">{tokenResult.sessionId}</code>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Token'}</span>
                  </button>

                  <button
                    onClick={handleConnectNow}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <span>Join Voice Room with Token</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {tokenResult.serverError && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{tokenResult.serverError}</span>
                </div>
              )}

              {/* Raw Token Output */}
              <div>
                <div className="text-[11px] text-zinc-400 mb-1 flex items-center justify-between">
                  <span>Signed JWT Access Token (HS256):</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Lightweight: ~{tokenResult.token.length} chars (No MCP bloat)
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 font-mono text-xs text-zinc-200 break-all select-all border border-zinc-800 max-h-24 overflow-y-auto">
                  {tokenResult.token}
                </div>
              </div>

              {/* Decoded JWT Inspector */}
              {activeDecoded && (
                <div className="space-y-3 pt-1">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    Decoded JWT Claims & Embedded Metadata Inspector
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5">
                      <div className="text-[11px] font-semibold text-indigo-400">1. Header (Algorithm)</div>
                      <pre className="text-[10px] font-mono text-indigo-200 overflow-x-auto">
                        {JSON.stringify(activeDecoded.header, null, 2)}
                      </pre>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5">
                      <div className="text-[11px] font-semibold text-purple-400">2. Claims (VideoGrants)</div>
                      <div className="text-[10px] font-mono text-purple-200 space-y-1 overflow-x-auto">
                        <div>iss: {activeDecoded.payload.iss}</div>
                        <div>sub: {activeDecoded.payload.sub}</div>
                        <div>room: {activeDecoded.payload.video?.room}</div>
                        <div>canPublish: {String(activeDecoded.payload.video?.canPublish)}</div>
                        <div>expires: {activeDecoded.expiresAt}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1.5">
                      <div className="text-[11px] font-semibold text-emerald-400">3. Embedded AI Metadata</div>
                      <div className="text-[10px] font-mono text-emerald-200 space-y-1 overflow-x-auto">
                        <div>Session ID: {activeDecoded.metadata?.session_id}</div>
                        <div>Identity: {activeDecoded.metadata?.identity}</div>
                        <div>Model: {activeDecoded.metadata?.model_config?.model}</div>
                        <div>MCP Storage: MongoDB Atlas (`mcp_servers`)</div>
                      </div>
                    </div>
                  </div>

                  {/* Full JSON Metadata Viewer */}
                  <details className="group">
                    <summary className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer list-none flex items-center gap-1.5">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      <span>View Full Lightweight Metadata JSON</span>
                    </summary>
                    <div className="mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 overflow-x-auto max-h-48">
                      <pre className="text-[10px] font-mono text-zinc-300">
                        {JSON.stringify(activeDecoded.metadata, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* Manual Token Decoder */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-400" />
                Paste Any LiveKit Token to Inspect Claims
              </span>
              <span className="text-[10px] text-zinc-500">
                Inspect external tokens from LiveKit Cloud or CLI
              </span>
            </div>

            <input
              type="text"
              value={manualToken}
              onChange={(e) => handleDecodeManualToken(e.target.value)}
              placeholder="Paste JWT string (eyJhbGciOiJIUzI1Ni...)..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
            />

            {manualDecoded && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 space-y-1">
                <div className="text-emerald-400 font-semibold">Valid LiveKit Token:</div>
                <div>Room: {manualDecoded.payload.video?.room || 'none'}</div>
                <div>Identity: {manualDecoded.payload.sub}</div>
                <div>Expires: {manualDecoded.expiresAt} ({manualDecoded.isExpired ? 'EXPIRED' : 'ACTIVE'})</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SESSION HISTORY FROM MONGODB ATLAS */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <div>
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Session History: Fetched Directly from MongoDB Atlas (`sessions` collection)</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Source: <span className="font-mono text-cyan-300">{sessionSource}</span> • Total Sessions Recorded: {sessions.length}
              </div>
            </div>

            <button
              onClick={loadSessionHistory}
              disabled={isLoadingSessions}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingSessions ? 'animate-spin' : ''}`} />
              <span>{isLoadingSessions ? 'Fetching...' : 'Refresh from MongoDB Atlas'}</span>
            </button>
          </div>

          {/* Session List & Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Session Cards List */}
            <div className="lg:col-span-2 space-y-3">
              {sessions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/60 text-center space-y-2">
                  <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="text-xs font-medium text-zinc-400">No session history records found.</div>
                  <p className="text-[11px] text-zinc-500">
                    Mint a token above or connect to LiveKit to create your first session in MongoDB Atlas.
                  </p>
                </div>
              ) : (
                sessions.map((sess) => {
                  const isSelected = selectedSession?.session_id === sess.session_id;
                  return (
                    <div
                      key={sess.session_id}
                      onClick={() => setSelectedSession(sess)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/20 border-cyan-500/40 shadow-md'
                          : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-zinc-100">
                              {sess.session_id}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
                              {sess.status || 'active'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-zinc-500" />
                              {sess.identity}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Radio className="w-3 h-3 text-purple-400" />
                              Room: {sess.room_name}
                            </span>
                            {sess.model_config?.model && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                                  <Cpu className="w-3 h-3" />
                                  {sess.model_config.model}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(sess.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {new Date(sess.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Col: Selected Session Info Inspector */}
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Session Info Inspector
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  MongoDB Document
                </span>
              </div>

              {selectedSession ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] text-zinc-500">Session ID:</div>
                    <div className="text-xs font-mono text-zinc-200 bg-zinc-950 p-2 rounded-lg border border-zinc-800 select-all break-all">
                      {selectedSession.session_id}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <div className="text-[10px] text-zinc-500">Identity</div>
                      <div className="font-mono text-zinc-200 mt-0.5">{selectedSession.identity}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <div className="text-[10px] text-zinc-500">Room Name</div>
                      <div className="font-mono text-zinc-200 mt-0.5">{selectedSession.room_name}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-zinc-500 mb-1">Full Document Data from MongoDB:</div>
                    <pre className="text-[10px] font-mono text-cyan-200 bg-zinc-950 p-2.5 rounded-xl overflow-x-auto border border-zinc-800/80 max-h-56">
                      {JSON.stringify(selectedSession, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  Select a session from the list on the left to inspect its MongoDB Atlas document.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
