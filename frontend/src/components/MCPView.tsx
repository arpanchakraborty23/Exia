import React, { useState, useEffect } from 'react';
import {
  Blocks,
  Plus,
  Server,
  Power,
  Wrench,
  Terminal,
  Globe,
  Trash2,
  Play,
  HelpCircle,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { MCPServer, MCPTool } from '../types';
import {
  checkAndSaveMcpToMongo,
  fetchMcpServersFromMongo,
  toggleMcpToolInMongo,
  deleteMcpServerFromMongo,
} from '../services/tokenService';

interface MCPViewProps {
  servers: MCPServer[];
  onSetServers?: (servers: MCPServer[]) => void;
  onAddServer: (server: MCPServer) => void;
  onToggleServer: (id: string) => void;
  onToggleTool: (serverId: string, toolName: string) => void;
  onDeleteServer: (id: string) => void;
  onRunToolTest: (serverId: string, tool: MCPTool) => void;
}

export const MCPView: React.FC<MCPViewProps> = ({
  servers,
  onSetServers,
  onAddServer,
  onToggleServer,
  onToggleTool,
  onDeleteServer,
  onRunToolTest,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [transport, setTransport] = useState<'stdio' | 'sse'>('stdio');
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState('');
  const [url, setUrl] = useState('');

  // Status & Data Source State
  const [isChecking, setIsChecking] = useState(false);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [serversSource, setServersSource] = useState<'mongodb_atlas' | 'local_cache'>('local_cache');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Fetch servers and their tool lists from MongoDB Atlas on mount
  useEffect(() => {
    loadServersFromDb();
  }, []);

  const loadServersFromDb = async () => {
    setIsLoadingFromDb(true);
    try {
      const dbServers = await fetchMcpServersFromMongo();
      if (dbServers && dbServers.length > 0) {
        onSetServers?.(dbServers);
        setServersSource('mongodb_atlas');
        setFeedbackMessage({
          type: 'success',
          text: `Loaded ${dbServers.length} MCP servers and tool schemas directly from MongoDB Atlas ('mcp_servers').`,
        });
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    } catch (err) {
      console.warn('Could not fetch from MongoDB:', err);
    } finally {
      setIsLoadingFromDb(false);
    }
  };

  // Check connection and save new server + tools to MongoDB Atlas
  const handleCreateAndSaveToMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsChecking(true);
    setFeedbackMessage({ type: 'info', text: 'Checking connection & discovering tools...' });

    const newServer: MCPServer = {
      id: `mcp-${Date.now()}`,
      name: name.trim(),
      transport,
      command: transport === 'stdio' ? command.trim() : undefined,
      args: transport === 'stdio' && args.trim() ? args.split(' ') : undefined,
      url: transport === 'sse' ? url.trim() : undefined,
      isConnected: true,
      tools: [],
    };

    // 1. Check connect & discover tools, store to MongoDB Atlas
    const res = await checkAndSaveMcpToMongo(newServer);

    // 2. Fetch updated servers and tools from MongoDB Atlas
    const dbServers = await fetchMcpServersFromMongo();
    if (dbServers && dbServers.length > 0) {
      onSetServers?.(dbServers);
      setServersSource('mongodb_atlas');
    } else {
      onAddServer(newServer);
    }

    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `✅ ${newServer.name}: Connected & tools stored in MongoDB Atlas ('mcp_servers'). Tools displayed below!`,
      });
    } else {
      setFeedbackMessage({
        type: 'warning',
        text: `⚠️ Saved locally (${res.message}). Will sync to MongoDB Atlas when backend is active.`,
      });
    }

    setName('');
    setCommand('');
    setArgs('');
    setUrl('');
    setIsAdding(false);
    setIsChecking(false);

    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Check connection for an individual server, discover tools, and fetch from DB
  const handleCheckAndSyncSingle = async (server: MCPServer) => {
    setTestingServerId(server.id);
    setFeedbackMessage({ type: 'info', text: `Testing connection to '${server.name}' & discovering tools...` });

    const res = await checkAndSaveMcpToMongo(server);

    // Re-fetch all servers and tools directly from MongoDB Atlas
    const dbServers = await fetchMcpServersFromMongo();
    if (dbServers && dbServers.length > 0) {
      onSetServers?.(dbServers);
      setServersSource('mongodb_atlas');
    }

    setFeedbackMessage({
      type: res.success ? 'success' : 'warning',
      text: res.success
        ? `✅ '${server.name}' verified! Tool catalog updated and loaded from MongoDB Atlas.`
        : `⚠️ Connection notice for '${server.name}': ${res.message}`,
    });

    setTestingServerId(null);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Toggle individual tool and update directly in MongoDB Atlas
  const handleToggleToolWithDb = async (serverId: string, tool: MCPTool) => {
    onToggleTool(serverId, tool.name);
    await toggleMcpToolInMongo(serverId, tool.name, !tool.isEnabled);
  };

  // Delete server from local state and MongoDB Atlas
  const handleDeleteServerWithDb = async (serverId: string) => {
    onDeleteServer(serverId);
    await deleteMcpServerFromMongo(serverId);
  };

  // Sync all servers to MongoDB Atlas
  const handleSyncAllToMongo = async () => {
    setIsChecking(true);
    setFeedbackMessage({ type: 'info', text: 'Checking connection & storing all MCP servers into MongoDB Atlas...' });
    let count = 0;
    for (const server of servers) {
      const res = await checkAndSaveMcpToMongo(server);
      if (res.success) count++;
    }

    // Refresh from DB
    const dbServers = await fetchMcpServersFromMongo();
    if (dbServers && dbServers.length > 0) {
      onSetServers?.(dbServers);
      setServersSource('mongodb_atlas');
    }

    setIsChecking(false);
    setFeedbackMessage({
      type: 'success',
      text: `✅ Synced ${count} MCP servers directly to MongoDB Atlas. All tools fetched from database!`,
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const totalTools = servers.reduce(
    (acc, s) => acc + (s.isConnected ? s.tools.filter((t) => t.isEnabled).length : 0),
    0
  );

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <Blocks className="w-5 h-5 text-indigo-400" />
            Model Context Protocol (MCP) Tools Hub
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Check MCP connections and browse tools. All tool lists are stored in and fetched directly from <span className="text-cyan-300 font-semibold">MongoDB Atlas (`mcp_servers`)</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadServersFromDb}
            disabled={isLoadingFromDb}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Fetch all servers and tools from MongoDB Atlas"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingFromDb ? 'animate-spin' : ''}`} />
            <span>{isLoadingFromDb ? 'Fetching DB...' : 'Fetch from DB'}</span>
          </button>

          <button
            onClick={handleSyncAllToMongo}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/30 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Sync All to DB</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add MCP Server</span>
          </button>
        </div>
      </div>

      {/* Banner / Feedback */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : feedbackMessage.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Explainer / Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-500">Servers Configured</div>
            <div className="text-sm font-semibold text-zinc-100">
              {servers.filter((s) => s.isConnected).length} Active / {servers.length} Total
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-500">Database Source</div>
            <div className="text-sm font-semibold text-cyan-300 flex items-center gap-1.5">
              <span>{serversSource === 'mongodb_atlas' ? 'MongoDB Atlas' : 'Local Cache'}</span>
              <span className="text-[10px] font-mono text-zinc-400 font-normal">(`mcp_servers`)</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-500">Active AI Tools in DB</div>
            <div className="text-sm font-semibold text-emerald-300">{totalTools} Tools Enabled</div>
          </div>
        </div>
      </div>

      {/* Add Server Modal / Collapse Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateAndSaveToMongo}
          className="p-5 rounded-2xl bg-zinc-900/90 border border-indigo-500/30 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
              Add New MCP Server (Check Connection, Discover Tools & Store to MongoDB Atlas)
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Stores in MongoDB Atlas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Server Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SQLite Database, Spotify, Notion, GitHub"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">Transport Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTransport('stdio')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    transport === 'stdio'
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  stdio (CLI)
                </button>
                <button
                  type="button"
                  onClick={() => setTransport('sse')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    transport === 'sse'
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  sse (HTTP)
                </button>
              </div>
            </div>
          </div>

          {transport === 'stdio' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">
                  Command (e.g. npx, python, uvx)
                </label>
                <input
                  type="text"
                  required
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="npx -y @modelcontextprotocol/server-postgres"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 mb-1 block">Arguments (optional)</label>
                <input
                  type="text"
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  placeholder="postgresql://user:pass@localhost/db"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-zinc-400 mb-1 block">SSE Endpoint URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8088/events"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isChecking}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow cursor-pointer disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isChecking ? 'Checking & Discovering Tools...' : 'Check Connection & Save to MongoDB Atlas'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Server & Tools Catalog List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {servers.map((server) => {
          const isThisChecking = testingServerId === server.id;
          return (
            <div
              key={server.id}
              className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4"
            >
              {/* Server Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      server.isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    <Server className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-zinc-100">{server.name}</h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          server.transport === 'stdio'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}
                      >
                        {server.transport.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        Stored in MongoDB Atlas
                      </span>
                    </div>

                    <div className="text-xs text-zinc-500 font-mono mt-1">
                      {server.transport === 'stdio' ? server.command : server.url}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCheckAndSyncSingle(server)}
                    disabled={isThisChecking}
                    title="Check connection, discover tools, and update MongoDB Atlas"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/30 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isThisChecking ? 'animate-spin text-indigo-400' : 'text-cyan-400'}`} />
                    <span>{isThisChecking ? 'Checking Connection...' : 'Check Connection & Tools'}</span>
                  </button>

                  <button
                    onClick={() => onToggleServer(server.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      server.isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{server.isConnected ? 'Connected' : 'Offline'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteServerWithDb(server.id)}
                    title="Remove server from MongoDB Atlas"
                    className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tools Catalog: All tools displayed directly from DB */}
              <div className="pt-3 border-t border-zinc-800/60">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>Discovered Tools in DB ({server.tools.length})</span>
                    <span className="text-[10px] lowercase font-normal px-2 py-0.5 rounded bg-zinc-950 text-cyan-400 border border-zinc-800">
                      from db: mcp_servers
                    </span>
                  </span>
                  <span className="text-zinc-500 font-normal">
                    AI agent calls these via <code className="text-indigo-400">search_mcp_tools</code> & <code className="text-purple-400">execute_mcp_tool</code>
                  </span>
                </div>

                {server.tools.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-500 flex items-center justify-between">
                    <span>No tools discovered yet. Click "Check Connection & Tools" above to discover tools and store them in MongoDB Atlas.</span>
                    <button
                      onClick={() => handleCheckAndSyncSingle(server)}
                      className="text-cyan-400 underline text-xs cursor-pointer ml-2"
                    >
                      Discover Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {server.tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-start justify-between gap-3 group hover:border-zinc-700 transition-colors"
                      >
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-zinc-200">
                              {tool.name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[140px]">
                              ({tool.parametersSummary || 'args: object'})
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onRunToolTest(server.id, tool)}
                            title="Simulate tool execution in assistant voice chat"
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-indigo-600 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleToolWithDb(server.id, tool)}
                            title={`Toggle tool ${tool.name} in MongoDB Atlas`}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                              tool.isEnabled
                                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                            }`}
                          >
                            <span className="text-[10px] font-bold">
                              {tool.isEnabled ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
