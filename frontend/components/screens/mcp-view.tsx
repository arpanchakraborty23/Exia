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
  const [serverType, setServerType] = useState<'stdio' | 'sse'>('stdio');
  const [commandOrUrl, setCommandOrUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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

  const handleOpenAdd = () => {
    setEditingServer(null);
    setName('');
    setServerType('stdio');
    setCommandOrUrl('npx -y @modelcontextprotocol/server-filesystem D:/Workspace');
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
    // Optimistic update
    setServers((prev) =>
      prev.map((s) => (s.id === server.id ? { ...s, enabled: updatedStatus } : s))
    );
    try {
      await api.mcp.update(server.id, { enabled: updatedStatus });
    } catch (err: any) {
      console.error('Failed to update enabled status:', err);
      // Revert on error
      setServers((prev) =>
        prev.map((s) => (s.id === server.id ? { ...s, enabled: server.enabled } : s))
      );
    }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !commandOrUrl.trim()) {
      setModalError('Please provide both a server name and command/URL');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingServer) {
        const updated = await api.mcp.update(editingServer.id, {
          name: name.trim(),
          server_type: serverType,
          command_or_url: commandOrUrl.trim(),
          auth_token: authToken.trim() || undefined,
          enabled,
        });
        setServers((prev) =>
          prev.map((s) => (s.id === editingServer.id ? { ...s, ...updated } : s))
        );
      } else {
        const created = await api.mcp.create({
          name: name.trim(),
          server_type: serverType,
          command_or_url: commandOrUrl.trim(),
          auth_token: authToken.trim() || undefined,
          enabled,
          status: 'connected',
        });
        setServers((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to save MCP server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            MCP Server Registry
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure Model Context Protocol tools for local filesystem, databases, and APIs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchServers}
            disabled={isLoading}
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:opacity-90 transition-all shadow-sm shadow-primary/20"
          >
            <Plus className="size-4" />
            <span>Add MCP Server</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchServers} className="ml-auto underline font-medium text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Cpu className="size-6" />
          </div>
          <h3 className="font-semibold text-foreground">No MCP servers registered</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Add an MCP server via stdio (CLI command) or SSE (HTTP endpoint) so the voice agent can call tools.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
          >
            <Plus className="size-4" />
            <span>Add First Server</span>
          </button>
        </div>
      ) : (
        /* Servers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map((server) => (
            <div
              key={server.id}
              className={`p-5 rounded-2xl bg-card border transition-all flex flex-col justify-between gap-4 ${
                server.enabled
                  ? 'border-border hover:border-primary/40 shadow-xs'
                  : 'border-border/60 opacity-70 bg-card/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {server.server_type === 'stdio' ? (
                        <Terminal className="size-4.5" />
                      ) : (
                        <Globe className="size-4.5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">{server.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                          {server.server_type}
                        </span>
                        <span
                          className={`text-[11px] flex items-center gap-1 font-medium ${
                            server.enabled ? 'text-emerald-500' : 'text-muted-foreground'
                          }`}
                        >
                          {server.enabled ? (
                            <>
                              <CheckCircle2 className="size-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="size-3" />
                              Disabled
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={server.enabled}
                      onChange={() => handleToggleEnabled(server)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                {/* Command or URL */}
                <div className="mt-3 p-2.5 rounded-xl bg-muted/60 border border-border/80 font-mono text-[11px] text-muted-foreground break-all">
                  {server.command_or_url}
                </div>

                {server.auth_token && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                    <ShieldCheck className="size-3.5 text-primary" />
                    <span>Credentials encrypted</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                <span className="text-[11px] text-muted-foreground">
                  ID: {server.id}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(server)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(server.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground">
                {editingServer ? 'Edit MCP Server' : 'Add New MCP Server'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Server Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Local Filesystem or Home Automation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Transport Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setServerType('stdio')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                      serverType === 'stdio'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    <Terminal className="size-3.5" />
                    <span>stdio (CLI command)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setServerType('sse')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                      serverType === 'sse'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    <Globe className="size-3.5" />
                    <span>sse (HTTP endpoint)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">
                  {serverType === 'stdio' ? 'Command Line Execution' : 'SSE Server URL'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    serverType === 'stdio'
                      ? 'e.g. npx -y @modelcontextprotocol/server-filesystem D:/'
                      : 'e.g. http://localhost:8123/api/mcp/sse'
                  }
                  value={commandOrUrl}
                  onChange={(e) => setCommandOrUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm font-mono text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">
                  Auth Token / Credentials (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Bearer token or API key"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="enabledCheckbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="size-4 rounded-sm border-border text-primary focus:ring-primary/40"
                />
                <label htmlFor="enabledCheckbox" className="text-xs font-medium text-foreground cursor-pointer">
                  Enable tool immediately for voice agent
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-medium hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                  <span>{editingServer ? 'Save Changes' : 'Add Server'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
