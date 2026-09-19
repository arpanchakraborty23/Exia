'use client';

import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Edit3,
  Terminal,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
  ShieldCheck,
  Zap,
  HardDrive,
  Database,
  Search,
  ExternalLink,
  Wrench,
  Radio,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MCPServer } from '@/lib/types';

// Curated 1-Click MCP Presets
const MCP_CATALOG_PRESETS = [
  {
    name: 'Home Assistant IoT Core',
    server_type: 'sse' as const,
    command_or_url: 'http://homeassistant.local:8123/api/mcp',
    description: 'Direct control over smart lights, HVAC thermostat, motion sensors, and security scenes.',
    icon: Zap,
    category: 'Home Automation',
    defaultTools: ['lights.toggle', 'climate.set_temp', 'scene.activate', 'sensors.query_status'],
  },
  {
    name: 'Local Filesystem MCP',
    server_type: 'stdio' as const,
    command_or_url: 'npx -y @modelcontextprotocol/server-filesystem D:/GENAIProjects/HomeAsstant',
    description: 'Read and analyze local project documentation, smart home configuration YAMLs, and logs.',
    icon: HardDrive,
    category: 'System Storage',
    defaultTools: ['read_file', 'write_file', 'list_directory', 'get_file_info'],
  },
  {
    name: 'Brave Search & Intelligence',
    server_type: 'stdio' as const,
    command_or_url: 'npx -y @modelcontextprotocol/server-brave-search',
    description: 'Real-time web browsing, current traffic reports, weather alerts, and news inquiries.',
    icon: Search,
    category: 'Web Research',
    defaultTools: ['brave_web_search', 'brave_local_search'],
  },
  {
    name: 'PostgreSQL Sensor Archive',
    server_type: 'stdio' as const,
    command_or_url: 'npx -y @modelcontextprotocol/server-postgres postgresql://localhost/homeassistant',
    description: 'Historical telemetry queries, sensor trend analytics, and energy consumption logs.',
    icon: Database,
    category: 'Data Analytics',
    defaultTools: ['query_db', 'list_tables', 'describe_table'],
  },
];

export function MCPView() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [name, setName] = useState('');
  const [serverType, setServerType] = useState<'stdio' | 'sse'>('stdio');
  const [commandOrUrl, setCommandOrUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Ping Testing State
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchServers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.mcp.list();
      setServers(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load MCP servers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleOpenAdd = (preset?: typeof MCP_CATALOG_PRESETS[0]) => {
    setEditingServer(null);
    if (preset) {
      setName(preset.name);
      setServerType(preset.server_type);
      setCommandOrUrl(preset.command_or_url);
    } else {
      setName('');
      setServerType('stdio');
      setCommandOrUrl('npx -y @modelcontextprotocol/server-filesystem D:/Workspace');
    }
    setAuthToken('');
    setEnabled(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (server: MCPServer) => {
    setEditingServer(server);
    setName(server.name);
    setServerType(server.server_type);
    setCommandOrUrl(server.command_or_url);
    setAuthToken(server.auth_token || '');
    setEnabled(server.enabled);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleEnabled = async (server: MCPServer) => {
    const updatedStatus = !server.enabled;
    setServers((prev) =>
      prev.map((s) => (s.id === server.id ? { ...s, enabled: updatedStatus } : s))
    );
    try {
      await api.mcp.update(server.id, { enabled: updatedStatus });
    } catch (err: any) {
      console.error('Failed to update enabled status:', err);
      setServers((prev) =>
        prev.map((s) => (s.id === server.id ? { ...s, enabled: server.enabled } : s))
      );
    }
  };

  const handleTestPing = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
    }, 1200);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this MCP server connection?')) return;
    try {
      await api.mcp.delete(id);
      setServers((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete MCP server');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !commandOrUrl.trim()) {
      setModalError('Server Name and Command/URL are required');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingServer) {
        const updated = await api.mcp.update(editingServer.id, {
          name,
          server_type: serverType,
          command_or_url: commandOrUrl,
          auth_token: authToken || undefined,
          enabled,
        });
        setServers((prev) => prev.map((s) => (s.id === editingServer.id ? updated : s)));
      } else {
        const created = await api.mcp.create({
          name,
          server_type: serverType,
          command_or_url: commandOrUrl,
          auth_token: authToken || undefined,
          enabled,
        });
        setServers((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalActiveTools = servers
    .filter((s) => s.enabled)
    .reduce((acc, s) => acc + (s.tools?.length || 4), 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-mono">
              MODEL CONTEXT PROTOCOL (MCP) REGISTRY
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30">
              TOOL BUS
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Connect local stdio binaries and remote SSE servers. Exia invokes these tools in real-time during voice sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchServers}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-all"
            title="Refresh"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Plus className="size-4" />
            <span>Connect Custom Server</span>
          </button>
        </div>
      </div>

      {/* Bento Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Configured Servers</span>
            <Cpu className="size-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {servers.length} <span className="text-xs font-normal text-zinc-500">active instances</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Armed Tools</span>
            <Wrench className="size-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {totalActiveTools} <span className="text-xs font-normal text-zinc-500">callable functions</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Protocol Standard</span>
            <ShieldCheck className="size-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold font-mono text-white mt-2">
            Anthropic MCP 2024-11
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">STDIO / SSE Bidirectional</div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Servers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="size-3.5 text-emerald-400" />
            <span>Active Server Connections ({servers.length})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : servers.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01] space-y-3">
            <Cpu className="size-10 text-zinc-600 mx-auto" />
            <h3 className="font-semibold text-white">No MCP servers registered</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Install a 1-click preset below or register a custom stdio command to give Exia tool-use capabilities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servers.map((server) => {
              const isStdio = server.server_type === 'stdio';
              const isTesting = testingId === server.id;

              return (
                <div
                  key={server.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    server.enabled
                      ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.08] hover:border-emerald-500/30 shadow-xs'
                      : 'bg-black/40 border-white/[0.04] opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            server.enabled
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
                          }`}
                        >
                          {isStdio ? <Terminal className="size-4.5" /> : <Globe className="size-4.5" />}
                        </div>
                        <div className="truncate">
                          <h3 className="font-bold text-sm text-white truncate font-mono">
                            {server.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                              {server.server_type}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {server.tools?.length || 4} tools
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Enable Switch */}
                      <button
                        onClick={() => handleToggleEnabled(server)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          server.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            server.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Command / URL */}
                    <div className="p-2.5 rounded-xl bg-black/60 border border-white/[0.06] font-mono text-[11px] text-zinc-400 truncate">
                      <span className="text-zinc-600 select-none mr-1.5">$</span>
                      {server.command_or_url}
                    </div>

                    {/* Available Tools Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {(server.tools && server.tools.length > 0
                        ? server.tools
                        : ['query_status', 'execute_action', 'inspect_state']
                      ).map((tool, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.03] text-zinc-400 border border-white/[0.06]"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06] text-xs">
                    <button
                      onClick={() => handleTestPing(server.id)}
                      disabled={isTesting || !server.enabled}
                      className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 font-mono text-[11px] transition-colors disabled:opacity-40"
                    >
                      {isTesting ? (
                        <Loader2 className="size-3 animate-spin text-emerald-400" />
                      ) : (
                        <Zap className="size-3 text-emerald-400" />
                      )}
                      <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(server)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Edit server"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(server.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete server"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1-Click Preset Catalog */}
      <div className="space-y-4 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="size-3.5 text-emerald-400" />
              <span>Recommended 1-Click MCP Presets</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Click any verified preset below to auto-populate configuration and connect.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MCP_CATALOG_PRESETS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                      {preset.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-white font-mono">{preset.name}</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAdd(preset)}
                  className="mt-4 w-full py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 hover:text-emerald-300 text-zinc-300 text-xs font-mono font-medium border border-white/[0.08] hover:border-emerald-500/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>Use Preset</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0a0e17] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                  <Cpu className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {editingServer ? 'Edit MCP Server' : 'Register MCP Server'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    LiveKit voice agent will auto-discover callable tools
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">Server Name</label>
                <input
                  type="text"
                  placeholder="e.g. Home Assistant IoT"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Transport Protocol</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServerType('stdio')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      serverType === 'stdio'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    <Terminal className="size-3.5" />
                    <span>STDIO (Command)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setServerType('sse')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      serverType === 'sse'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    <Globe className="size-3.5" />
                    <span>SSE (HTTP Stream)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">
                  {serverType === 'stdio' ? 'Shell Execution Command' : 'SSE Endpoint URL'}
                </label>
                <input
                  type="text"
                  placeholder={
                    serverType === 'stdio'
                      ? 'e.g. npx -y @modelcontextprotocol/server-filesystem D:/Workspace'
                      : 'e.g. http://localhost:8123/mcp'
                  }
                  value={commandOrUrl}
                  onChange={(e) => setCommandOrUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">
                  Bearer Token / Secret (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Bearer token if endpoint requires auth"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-black/40"
                />
                <label htmlFor="enabled" className="text-zinc-300 cursor-pointer">
                  Activate server immediately upon saving
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingServer ? 'Update Server' : 'Register Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
