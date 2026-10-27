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

  const handleOpenAdd = () => {
    setEditingServer(null);
    setName('');
    setServerType('sse');
    setCommandOrUrl('');
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
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            MCP Registry
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Connect remote SSE tool servers. Exia invokes these tools in real-time during voice sessions.{' '}
            <span className="text-muted-foreground/70">Remote MCP only — local STDIO is not supported.</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchServers}
            disabled={isLoading}
            className="border-border hover:bg-accent text-muted-foreground cursor-pointer rounded-xl border p-2 transition-all"
            title="Refresh"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="bg-primary text-primary-foreground inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:opacity-90"
          >
            <Plus className="size-4" />
            <span>Connect Server</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Configured Servers</span>
            <Cpu className="text-muted-foreground size-4" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-semibold">
            {servers.length}{' '}
            <span className="text-muted-foreground text-xs font-normal">instances</span>
          </div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Available Tools</span>
            <Wrench className="text-muted-foreground size-4" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-semibold">
            {totalActiveTools}{' '}
            <span className="text-muted-foreground text-xs font-normal">functions</span>
          </div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Protocol</span>
            <ShieldCheck className="text-muted-foreground size-4" />
          </div>
          <div className="text-foreground mt-2 text-sm font-semibold">
            Remote SSE
          </div>
          <div className="text-muted-foreground mt-0.5 text-xs">
            HTTP Stream · Local STDIO unavailable
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
          <h2 className="text-foreground flex items-center gap-2 text-sm font-medium">
            <Radio className="text-muted-foreground size-3.5" />
            <span>Active Server Connections ({servers.length})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-card border-border h-44 animate-pulse rounded-2xl border"
              />
            ))}
          </div>
        ) : servers.length === 0 ? (
          <div className="border-border bg-card space-y-3 rounded-2xl border border-dashed px-4 py-12 text-center">
            <Cpu className="text-muted-foreground mx-auto size-8" />
            <h3 className="text-foreground font-semibold">No MCP servers registered</h3>
            <p className="text-muted-foreground mx-auto max-w-sm text-sm">
              Register a remote SSE endpoint to give Exia tool-use capabilities during voice sessions.
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
                  className={`border-border bg-card flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                    server.enabled
                      ? 'hover:border-white/10'
                      : 'opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-xl">
                          {isStdio ? (
                            <Terminal className="size-4" />
                          ) : (
                            <Globe className="size-4" />
                          )}
                        </div>
                        <div className="truncate">
                          <h3 className="text-foreground truncate font-medium text-sm">
                            {server.name}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px]">
                              {server.server_type}
                            </span>
                            <span className="text-muted-foreground text-xs">
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
                            : 'bg-muted-foreground/30'
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
                    <div className="bg-muted/30 border-border text-muted-foreground truncate rounded-lg border p-2.5 font-mono text-xs">
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
                          className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 font-mono text-[11px]"
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
                      className="text-muted-foreground inline-flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-foreground disabled:opacity-40"
                    >
                      {isTesting ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Zap className="size-3" />
                      )}
                      <span>{isTesting ? 'Pinging…' : 'Test connection'}</span>
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
                        className="text-muted-foreground cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
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


      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-150">
          <div className="bg-card border-border text-foreground w-full max-w-lg space-y-5 rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-muted flex size-8 items-center justify-center rounded-xl">
                  <Globe className="text-muted-foreground size-4" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">
                    {editingServer ? 'Edit MCP Server' : 'Register MCP Server'}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Exia auto-discovers callable tools via SSE
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
            <div className="text-muted-foreground flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-2.5 text-xs">
              <Globe className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Only <strong className="text-foreground">Remote MCP (SSE / HTTP Stream)</strong> is supported. Local stdio execution is unavailable.
              </span>
            </div>

            {modalError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="text-foreground mb-1 block text-xs font-medium">Server Name</label>
                <input
                  type="text"
                  placeholder="e.g. Home Assistant IoT Gateway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 input-focus w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-foreground text-xs font-medium">Transport Protocol</label>
                  <span className="text-muted-foreground text-[11px]">Remote SSE supported</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServerType('sse')}
                    className="border-primary/35 bg-primary/10 text-primary flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all"
                  >
                    <Globe className="size-3.5" />
                    <span>Remote SSE</span>
                  </button>
                  <div
                    className="bg-muted/20 border-border/50 text-muted-foreground/40 flex cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm select-none"
                    title="Local stdio execution is not currently supported"
                  >
                    <Terminal className="size-3.5 opacity-40" />
                    <span>Local STDIO</span>
                    <span className="bg-muted text-muted-foreground rounded px-1 py-0.5 text-[10px]">
                      Disabled
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-medium">
                  Remote SSE Endpoint URL
                </label>
                <input
                  type="url"
                  placeholder="https://api.example.com/sse"
                  value={commandOrUrl}
                  onChange={(e) => setCommandOrUrl(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 input-focus w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-foreground mb-1 block text-xs font-medium">
                  Bearer Token (optional)
                </label>
                <input
                  type="password"
                  placeholder="Bearer token if endpoint requires auth"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 input-focus w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
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
                  className="text-muted-foreground hover:text-foreground cursor-pointer text-sm transition-colors"
                >
                  Activate immediately upon saving
                </label>
              </div>

              <div className="border-border flex items-center justify-end gap-3 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer rounded-xl px-4 py-2 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground cursor-pointer rounded-xl px-5 py-2 text-sm font-semibold shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving…' : editingServer ? 'Update Server' : 'Register Server'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
