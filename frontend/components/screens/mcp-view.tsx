'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Cpu,
  Database,
  Edit3,
  Globe,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MCPServer } from '@/lib/types';

// Curated 1-Click Remote MCP Presets
const MCP_CATALOG_PRESETS = [
  {
    name: 'Home Assistant IoT Core',
    server_type: 'sse' as const,
    command_or_url: 'http://homeassistant.local:8123/api/mcp/sse',
    description:
      'Direct remote control over smart lights, HVAC thermostat, motion sensors, and security scenes via SSE.',
    icon: Zap,
    category: 'Home Automation (Remote)',
    defaultTools: ['lights.toggle', 'climate.set_temp', 'scene.activate', 'sensors.query_status'],
  },
  {
    name: 'Home Automation Cloud API',
    server_type: 'sse' as const,
    command_or_url: 'https://cloud.home-assistant.io/api/mcp/sse',
    description:
      'Remote cloud assistant integration for weather alerts, notifications, and device telemetry streams.',
    icon: Globe,
    category: 'Cloud Gateway (Remote)',
    defaultTools: ['weather.current', 'notify.mobile', 'energy.analytics', 'devices.list'],
  },
  {
    name: 'Remote Web Intelligence SSE',
    server_type: 'sse' as const,
    command_or_url: 'https://mcp.intelligence.internal/sse',
    description:
      'Remote real-time web search, traffic telemetry, weather forecasts, and online knowledge retrieval.',
    icon: Search,
    category: 'Web Research (Remote)',
    defaultTools: ['web_search', 'news_query', 'fetch_page_content'],
  },
  {
    name: 'Remote Sensor & Analytics Archive',
    server_type: 'sse' as const,
    command_or_url: 'https://metrics.homeassistant.internal/api/mcp/sse',
    description:
      'Remote telemetry queries, sensor trend analytics, and energy consumption historical reports.',
    icon: Database,
    category: 'Data Analytics (Remote)',
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
  const [serverType, setServerType] = useState<'stdio' | 'sse'>('sse');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MCP servers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleOpenAdd = (preset?: (typeof MCP_CATALOG_PRESETS)[0]) => {
    setEditingServer(null);
    if (preset) {
      setName(preset.name);
      setServerType(preset.server_type);
      setCommandOrUrl(preset.command_or_url);
    } else {
      setName('');
      setServerType('sse');
      setCommandOrUrl('http://homeassistant.local:8123/api/mcp/sse');
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
    } catch (err) {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete MCP server';
      alert(msg);
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
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to save server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalActiveTools = servers
    .filter((s) => s.enabled)
    .reduce((acc, s) => acc + (s.tools?.length || 4), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      {/* Screen Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground font-mono text-xl font-extrabold tracking-tight md:text-2xl">
              MODEL CONTEXT PROTOCOL (MCP) REGISTRY
            </h1>
            <span className="rounded border border-primary/25 bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary dark:text-primary">
              REMOTE ONLY
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Connect remote SSE tool servers (HTTP Stream). Exia invokes these tools in real-time
            during voice sessions. Currently, only Remote MCP is supported.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchServers}
            disabled={isLoading}
            className="bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border cursor-pointer rounded-xl border p-2 transition-all"
            title="Refresh"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? 'animate-spin text-primary dark:text-primary' : ''}`}
            />
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(31,213,249,0.25)] transition-all hover:bg-primary/80 dark:text-black dark:hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span>Connect Remote Server</span>
          </button>
        </div>
      </div>

      {/* Remote Support Notice Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-accent p-4 text-xs text-foreground dark:text-foreground/80">
        <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground dark:text-muted-foreground" />
        <div className="space-y-0.5">
          <p className="font-bold">Currently, we support Remote MCP servers (SSE / HTTP Stream)</p>
          <p className="text-[11px] text-muted-foreground/90 dark:text-foreground/80/80">
            Local STDIO server execution (npx / shell command) is not supported at this time. Please
            connect external or self-hosted MCP endpoints using their remote SSE URLs.
          </p>
        </div>
      </div>

      {/* Bento Status Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        <div className="bg-card/80 border-border rounded-2xl border p-4 backdrop-blur-xl">
          <div className="text-muted-foreground flex items-center justify-between font-mono text-xs">
            <span>Configured Servers</span>
            <Cpu className="size-4 text-primary" />
          </div>
          <div className="text-foreground mt-2 font-mono text-2xl font-bold">
            {servers.length}{' '}
            <span className="text-muted-foreground text-xs font-normal">active instances</span>
          </div>
        </div>

        <div className="bg-card/80 border-border rounded-2xl border p-4 backdrop-blur-xl">
          <div className="text-muted-foreground flex items-center justify-between font-mono text-xs">
            <span>Armed Tools</span>
            <Wrench className="size-4 text-primary" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-primary">
            {totalActiveTools}{' '}
            <span className="text-muted-foreground text-xs font-normal">callable functions</span>
          </div>
        </div>

        <div className="bg-card/80 border-border rounded-2xl border p-4 backdrop-blur-xl">
          <div className="text-muted-foreground flex items-center justify-between font-mono text-xs">
            <span>Protocol Standard</span>
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <div className="text-foreground mt-2 font-mono text-sm font-bold">
            Remote SSE (HTTP Stream)
          </div>
          <div className="text-muted-foreground mt-0.5 font-mono text-[10px]">
            Remote MCP Supported · Local STDIO Unavailable
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Servers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground flex items-center gap-2 font-mono text-sm font-bold tracking-wider uppercase">
            <Radio className="size-3.5 text-primary" />
            <span>Active Server Connections ({servers.length})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-card/80 border-border h-44 animate-pulse rounded-2xl border"
              />
            ))}
          </div>
        ) : servers.length === 0 ? (
          <div className="border-border bg-card space-y-3 rounded-2xl border border-dashed px-4 py-12 text-center">
            <Cpu className="text-muted-foreground mx-auto size-10" />
            <h3 className="text-foreground font-semibold">No Remote MCP servers registered</h3>
            <p className="text-muted-foreground mx-auto max-w-sm text-xs">
              Install a 1-click remote preset below or register a custom remote SSE endpoint to give
              Exia tool-use capabilities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {servers.map((server) => {
              const isStdio = server.server_type === 'stdio';
              const isTesting = testingId === server.id;

              return (
                <div
                  key={server.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                    server.enabled
                      ? 'bg-card hover:bg-card/90 border-border shadow-xs hover:border-primary/25'
                      : 'bg-card border-border/50 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                            server.enabled
                              ? 'border-primary/25 bg-primary/10 text-primary dark:text-primary'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {isStdio ? (
                            <Terminal className="size-4.5" />
                          ) : (
                            <Globe className="size-4.5" />
                          )}
                        </div>
                        <div className="truncate">
                          <h3 className="text-foreground truncate font-mono text-sm font-bold">
                            {server.name}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="py-0.2 bg-muted text-muted-foreground border-border rounded border px-1.5 font-mono text-[10px] uppercase">
                              {server.server_type}
                            </span>
                            <span className="text-muted-foreground font-mono text-[11px]">
                              {server.tools?.length || 4} tools
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Enable Switch */}
                      <button
                        onClick={() => handleToggleEnabled(server)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          server.enabled
                            ? 'bg-primary'
                            : 'bg-muted-foreground/30 dark:bg-zinc-700'
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
                    <div className="bg-muted/40 border-border text-muted-foreground truncate rounded-xl border p-2.5 font-mono text-[11px]">
                      <span className="text-muted-foreground mr-1.5 select-none">$</span>
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
                          className="bg-card/80 text-muted-foreground border-border rounded-md border px-2 py-0.5 font-mono text-[10px]"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="border-border mt-4 flex items-center justify-between border-t pt-4 text-xs">
                    <button
                      onClick={() => handleTestPing(server.id)}
                      disabled={isTesting || !server.enabled}
                      className="text-muted-foreground inline-flex cursor-pointer items-center gap-1.5 font-mono text-[11px] transition-colors hover:text-primary disabled:opacity-40 dark:hover:text-primary"
                    >
                      {isTesting ? (
                        <Loader2 className="size-3 animate-spin text-primary dark:text-primary" />
                      ) : (
                        <Zap className="size-3 text-primary dark:text-primary" />
                      )}
                      <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(server)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
                        title="Edit server"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(server.id)}
                        className="text-muted-foreground cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
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
      <div className="border-border space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground flex items-center gap-2 font-mono text-sm font-bold tracking-wider uppercase">
              <Zap className="size-3.5 text-primary dark:text-primary" />
              <span>Recommended 1-Click MCP Presets</span>
            </h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Click any verified preset below to auto-populate configuration and connect.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MCP_CATALOG_PRESETS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <div
                key={idx}
                className="bg-card hover:bg-muted/50 border-border group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:border-primary/25"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex size-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-transform group-hover:scale-105 dark:text-primary">
                      <Icon className="size-4" />
                    </div>
                    <span className="py-0.2 bg-muted text-muted-foreground border-border rounded border px-1.5 font-mono text-[10px]">
                      {preset.category}
                    </span>
                  </div>
                  <h3 className="text-foreground font-mono text-xs font-bold">{preset.name}</h3>
                  <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAdd(preset)}
                  className="bg-card border-border text-foreground mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-medium transition-all hover:border-primary/35 hover:bg-primary/10 hover:text-primary dark:hover:text-primary"
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
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-150">
          <div className="bg-card border-border text-foreground w-full max-w-lg space-y-5 rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/15 text-primary dark:text-primary">
                  <Globe className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground font-mono text-sm font-bold">
                    {editingServer ? 'Edit Remote MCP Server' : 'Register Remote MCP Server'}
                  </h3>
                  <p className="text-muted-foreground text-[11px]">
                    LiveKit voice agent will auto-discover callable tools via SSE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-1.5 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Remote Support Note */}
            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-accent p-2.5 text-[11px] text-foreground dark:text-foreground/80">
              <Globe className="mt-0.5 size-3.5 shrink-0 text-muted-foreground dark:text-muted-foreground" />
              <span>
                Currently, only <strong>Remote MCP (SSE / HTTP Stream)</strong> is supported. Local
                (stdio) command execution is unavailable.
              </span>
            </div>

            {modalError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 font-mono text-xs text-rose-600 dark:text-rose-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-foreground mb-1 block font-semibold">Server Name</label>
                <input
                  type="text"
                  placeholder="e.g. Home Assistant IoT Gateway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary w-full rounded-xl border px-3 py-2 focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-foreground font-semibold">Transport Protocol</label>
                  <span className="text-[10px] font-medium text-primary dark:text-primary">
                    Remote SSE Supported
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServerType('sse')}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/15 px-3 py-2 font-bold text-primary transition-all dark:text-primary"
                  >
                    <Globe className="size-3.5" />
                    <span>Remote SSE (Stream)</span>
                  </button>
                  <div
                    className="bg-muted/20 border-border/50 text-muted-foreground/40 flex cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border px-3 py-2 select-none"
                    title="Local stdio execution is not currently supported"
                  >
                    <Terminal className="size-3.5 opacity-40" />
                    <span>Local STDIO</span>
                    <span className="bg-muted text-muted-foreground rounded px-1 py-0.5 text-[9px]">
                      Disabled
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground mt-1 text-[10px]">
                  Local command execution is currently not supported. Please provide a remote SSE
                  endpoint URL.
                </p>
              </div>

              <div>
                <label className="text-foreground mb-1 block font-semibold">
                  Remote SSE Endpoint URL
                </label>
                <input
                  type="url"
                  placeholder="e.g. http://homeassistant.local:8123/api/mcp/sse or https://api.example.com/sse"
                  value={commandOrUrl}
                  onChange={(e) => setCommandOrUrl(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary w-full rounded-xl border px-3 py-2 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-foreground mb-1 block font-semibold">
                  Bearer Token / Secret (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Bearer token if endpoint requires auth"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary w-full rounded-xl border px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="border-border rounded text-primary focus:ring-primary"
                />
                <label
                  htmlFor="enabled"
                  className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  Activate server immediately upon saving
                </label>
              </div>

              <div className="border-border flex items-center justify-end gap-3 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer rounded-xl px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-xl bg-primary px-5 py-2 font-bold text-white shadow-[0_0_12px_rgba(31,213,249,0.25)] transition-all hover:bg-primary/80 disabled:opacity-50 dark:text-black dark:hover:bg-primary/90"
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
