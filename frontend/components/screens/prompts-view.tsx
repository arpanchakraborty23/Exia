'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Edit3,
  FileText,
  Plus,
  RefreshCw,
  Sparkles,
  Terminal,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PromptItem } from '@/lib/types';

const VARIABLE_PILLS = [
  '{user_name}',
  '{current_time}',
  '{home_temp}',
  '{security_status}',
  '{active_room}',
];

const CURATED_DIRECTIVES = [
  {
    title: 'Exia Standard Persona',
    type: 'system' as const,
    badge: 'DEFAULT',
    icon: Terminal,
    prompt_text:
      'You are Exia, an intelligent multimodal assistant. Speak with calm, natural precision. Keep voice responses crisp and under 2-3 sentences unless asked for an in-depth breakdown. Prioritize helpfulness, smart device actions, and immediate clarity.',
  },
  {
    title: 'Concise Voice Assistant',
    type: 'system' as const,
    badge: 'FAST',
    icon: Zap,
    prompt_text:
      'You are a high-speed home automation interface. Respond in 1 brief sentence whenever possible. Confirm commands concisely (e.g. "Living room lights set to 40%"). Avoid conversational filler.',
  },
  {
    title: 'Home Diagnostic Macro',
    type: 'quick' as const,
    badge: 'DIAGNOSTICS',
    icon: Sparkles,
    prompt_text:
      'Inspect home telemetry across all registered MCP servers. Report disconnected endpoints, battery alerts, and offline smart sensors immediately.',
  },
  {
    title: 'Technical Coding Companion',
    type: 'system' as const,
    badge: 'EXPERT',
    icon: FileText,
    prompt_text:
      'You are a software engineering peer assistant. Provide code snippets directly, highlight potential bugs or edge cases, and keep architectural explanations clear and structured.',
  },
];

export function PromptsView() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active directive ID
  const [activeDirectiveId, setActiveDirectiveId] = useState<string>('preset_0');

  // Filter state: 'all' | 'system' | 'quick'
  const [filterType, setFilterType] = useState<'all' | 'system' | 'quick'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [type, setType] = useState<'system' | 'quick'>('system');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.prompts.getPrompts();
      setPrompts(data || []);
      if (data && data.length > 0 && activeDirectiveId === 'preset_0') {
        setActiveDirectiveId(data[0].id);
      }
    } catch (err: unknown) {
      console.warn('API fetch failed, falling back to defaults:', err);
      // Fallback curated defaults so page never renders empty
      setPrompts(
        CURATED_DIRECTIVES.map((d, i) => ({
          id: `preset_${i}`,
          title: d.title,
          prompt_text: d.prompt_text,
          type: d.type,
          created_at: new Date().toISOString(),
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleOpenAdd = (preset?: (typeof CURATED_DIRECTIVES)[0]) => {
    setEditingPrompt(null);
    setTitle(preset?.title || '');
    setPromptText(preset?.prompt_text || '');
    setType(preset?.type || 'system');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prompt: PromptItem) => {
    setEditingPrompt(prompt);
    setTitle(prompt.title);
    setPromptText(prompt.prompt_text);
    setType(prompt.type);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!title.trim() || !promptText.trim()) {
      setModalError('Title and prompt instructions are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPrompt) {
        await api.prompts.updatePrompt(editingPrompt.id, {
          title: title.trim(),
          prompt_text: promptText.trim(),
          type,
        });
      } else {
        await api.prompts.createPrompt({
          title: title.trim(),
          prompt_text: promptText.trim(),
          type,
        });
      }
      setIsModalOpen(false);
      fetchPrompts();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to save directive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this directive?')) return;
    try {
      await api.prompts.deletePrompt(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      if (activeDirectiveId === id) {
        setActiveDirectiveId(prompts[0]?.id || 'preset_0');
      }
    } catch (err: unknown) {
      console.error('Delete error:', err);
    }
  };

  const handleSetActive = (id: string) => {
    setActiveDirectiveId(id);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertVariable = (variable: string) => {
    setPromptText((prev) => `${prev} ${variable}`);
  };

  const filteredPrompts = prompts.filter((p) =>
    filterType === 'all' ? true : p.type === filterType
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Directives & System Prompts
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure system personas, conversational brevity, and smart home command behavior for Exia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPrompts}
            disabled={isLoading}
            className="border-border hover:bg-muted text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center justify-center rounded-xl border p-2 transition-colors"
            title="Refresh directives"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="size-4" />
            <span>New Directive</span>
          </button>
        </div>
      </div>

      {/* Active Directive Spotlight Banner */}
      <div className="border-border bg-card relative overflow-hidden rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground text-xs font-medium">
                Active Live Directive
              </span>
            </div>
            <h3 className="text-foreground text-base font-semibold">
              Exia Standard Persona
            </h3>
            <p className="text-muted-foreground max-w-2xl text-xs leading-relaxed">
              Sub-second conversational audio tuned to concise responses, IoT anomaly detection, and automated tool calls.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenAdd(CURATED_DIRECTIVES[0])}
              className="border-border hover:bg-muted text-foreground inline-flex cursor-pointer items-center rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              Tune parameters
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-border flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'system', 'quick'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                filterType === t
                  ? 'border-border bg-muted text-foreground border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {t === 'all'
                ? `All Directives (${prompts.length})`
                : t === 'system'
                  ? 'System Personas'
                  : 'Quick Macros'}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-500">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directives Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="border-border bg-card h-40 animate-pulse rounded-2xl border" />
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="border-border bg-card/40 space-y-3 rounded-2xl border border-dashed px-4 py-12 text-center">
          <FileText className="text-muted-foreground mx-auto size-10" />
          <h3 className="text-foreground text-sm font-semibold">No directives match this filter</h3>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs">
            Choose a curated preset below or add a new custom instruction.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredPrompts.map((item) => {
            const isCopied = copiedId === item.id;
            const isSystem = item.type === 'system';
            const isActive = activeDirectiveId === item.id;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all ${
                  isActive
                    ? 'border-primary/40 bg-card ring-1 ring-primary/20'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="border-border bg-muted/60 flex size-8 shrink-0 items-center justify-center rounded-xl border">
                        {isSystem ? (
                          <Terminal className="text-primary size-4" />
                        ) : (
                          <Sparkles className="text-primary size-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <h3 className="text-foreground truncate text-sm font-semibold">
                          {item.title}
                        </h3>
                        <span className="text-muted-foreground text-[10px] font-medium uppercase">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.prompt_text, item.id)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
                        title="Copy prompt text"
                      >
                        {isCopied ? (
                          <Check className="text-primary size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
                        title="Edit directive"
                      >
                        <Edit3 className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer rounded-lg p-1.5 transition-colors"
                        title="Delete directive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <p className="border-border bg-muted/30 text-foreground/80 line-clamp-3 rounded-xl border p-3 text-xs leading-relaxed">
                    {item.prompt_text}
                  </p>
                </div>

                <div className="border-border mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground text-[11px]">
                    {item.prompt_text.length} characters
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSetActive(item.id)}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      isActive
                        ? 'border border-primary/30 bg-primary/10 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground border'
                    }`}
                  >
                    {isActive ? 'Active' : 'Set active'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preset Library Showcase */}
      <div className="border-border space-y-4 border-t pt-6">
        <div>
          <h2 className="text-foreground text-sm font-semibold">
            Curated Directives
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Pre-configured templates calibrated for sub-second latency and smart home execution.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CURATED_DIRECTIVES.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <div
                key={idx}
                className="border-border bg-card hover:bg-muted/20 flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                      <Icon className="size-4" />
                    </div>
                    <span className="border-border bg-muted text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] font-medium">
                      {preset.badge}
                    </span>
                  </div>
                  <h3 className="text-foreground text-xs font-semibold">{preset.title}</h3>
                  <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
                    {preset.prompt_text}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAdd(preset)}
                  className="border-border bg-muted/30 hover:bg-muted text-foreground mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <Plus className="size-3.5" />
                  <span>Import</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border bg-card text-foreground w-full max-w-lg space-y-5 rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">
                    {editingPrompt ? 'Edit Directive' : 'New Directive'}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    System persona injected during LiveKit voice sessions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-1.5 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-500">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-foreground text-xs font-medium">Directive Name</label>
                <input
                  type="text"
                  placeholder="e.g. Exia Personal Butler"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-sm transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground text-xs font-medium">Directive Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('system')}
                    className={`cursor-pointer rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                      type === 'system'
                        ? 'border-primary/40 bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    System Persona
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('quick')}
                    className={`cursor-pointer rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                      type === 'quick'
                        ? 'border-primary/40 bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    Quick Macro
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-foreground text-xs font-medium">Instructions</label>
                  <span className="text-muted-foreground text-[10px]">Supports prompt variables</span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Describe voice demeanor, domain knowledge, and response constraints..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border p-3 text-sm leading-relaxed transition-all"
                  required
                />
              </div>

              {/* Dynamic Variables */}
              <div className="space-y-1.5">
                <span className="text-muted-foreground text-[11px]">Insert variables:</span>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLE_PILLS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="border-border bg-muted/40 hover:bg-muted text-foreground/80 cursor-pointer rounded-md border px-2 py-0.5 text-[10px] transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-border flex items-center justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer rounded-xl border px-4 py-2 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Directive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
