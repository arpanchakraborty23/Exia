'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Code,
  Copy,
  Edit3,
  FileText,
  Lightbulb,
  Plus,
  RefreshCw,
  Sliders,
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
    title: 'Exia GN-001 Tactical Guardian',
    type: 'system' as const,
    badge: 'DEFAULT',
    icon: Terminal,
    prompt_text:
      'You are Exia (GN-001), an autonomous mecha tactical intelligence designed for home command and personal assistance. Speak with calm, authoritative precision. Keep voice responses crisp and under 2-3 sentences unless asked for an in-depth breakdown. Prioritize safety, smart home diagnostics, and immediate tactical execution.',
  },
  {
    title: 'Minimalist Voice Assistant',
    type: 'system' as const,
    badge: 'ULTRA-FAST',
    icon: Zap,
    prompt_text:
      'You are a high-speed home automation interface. Respond in 1 brief sentence whenever possible. Confirm commands concisely (e.g. "Living room lamps set to 40%"). Never output conversational filler.',
  },
  {
    title: 'Home Diagnostic Macro',
    type: 'quick' as const,
    badge: 'SECURITY',
    icon: Sparkles,
    prompt_text:
      'Run an immediate diagnostic scan of all Home Assistant connected entities. Check HVAC setpoint, exterior perimeter contact sensors, lock statuses, and network latency. Report status anomalies immediately.',
  },
  {
    title: 'Night Patrol Mode',
    type: 'quick' as const,
    badge: 'ROUTINE',
    icon: Sliders,
    prompt_text:
      'Activate Night Patrol protocol: Arm exterior sensors, dim all hallway lighting to 10% warm amber, ensure garage entry is locked, and confirm thermostat is lowered to 68°F.',
  },
];

export function PromptsView() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active directive ID (stored in localStorage)
  const [activeDirectiveId, setActiveDirectiveId] = useState<string>('default-exia');

  // Filter tab: 'all' | 'system' | 'quick'
  const [filterType, setFilterType] = useState<'all' | 'system' | 'quick'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [type, setType] = useState<'system' | 'quick'>('system');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load active directive from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('exia_active_directive_id');
      if (saved) setActiveDirectiveId(saved);
    } catch {
      // ignore
    }
  }, []);

  const handleSetActive = (id: string) => {
    setActiveDirectiveId(id);
    try {
      localStorage.setItem('exia_active_directive_id', id);
    } catch {
      // ignore
    }
  };

  const fetchPrompts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.prompts.getPrompts();
      if (data && data.length > 0) {
        setPrompts(data);
      } else {
        setPrompts(
          CURATED_DIRECTIVES.map((d, index) => ({
            id: `curated-${index}`,
            title: d.title,
            prompt_text: d.prompt_text,
            type: d.type,
            created_at: new Date().toISOString(),
          }))
        );
      }
    } catch {
      setPrompts(
        CURATED_DIRECTIVES.map((d, index) => ({
          id: `curated-${index}`,
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

  const handleOpenAdd = (preset?: {
    title: string;
    prompt_text: string;
    type: 'system' | 'quick';
  }) => {
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
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save directive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this directive?')) return;
    try {
      await api.prompts.deletePrompt(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete directive');
    }
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
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground font-mono text-xl font-extrabold tracking-tight md:text-2xl">
              DIRECTIVE & PROMPT MATRIX
            </h1>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              TACTICAL BRAIN
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Configure system instructions, voice response brevity, and smart home command macros for
            Exia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPrompts}
            disabled={isLoading}
            className="bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border cursor-pointer rounded-xl border p-2 shadow-xs transition-all"
            title="Refresh"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400"
          >
            <Plus className="size-4" />
            <span>New Custom Directive</span>
          </button>
        </div>
      </div>

      {/* Active Directive Spotlight Banner */}
      <div className="via-card to-card relative overflow-hidden rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 p-5 shadow-xs backdrop-blur-xl">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="size-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="font-mono text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                LIVE AGENT DIRECTIVE IN PLAY
              </span>
            </div>
            <h3 className="text-foreground font-mono text-base font-bold">
              Exia GN-001 Tactical Autonomous Butler
            </h3>
            <p className="text-muted-foreground max-w-2xl text-xs leading-relaxed">
              Real-time voice tone tuned to concise military brevity, proactive IoT anomaly
              detection, and rapid tool dispatching.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-muted-foreground hidden text-right font-mono text-[11px] sm:block">
              <div>System Tokens: ~180</div>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                Audio Latency: Optimized
              </div>
            </div>
            <button
              onClick={() => handleOpenAdd(CURATED_DIRECTIVES[0])}
              className="cursor-pointer rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-1.5 font-mono text-xs font-medium text-emerald-700 shadow-xs transition-all hover:bg-emerald-500/25 dark:text-emerald-300"
            >
              Tune Parameters
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
              onClick={() => setFilterType(t)}
              className={`cursor-pointer rounded-xl px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                filterType === t
                  ? 'bg-muted text-foreground border-border border font-bold shadow-xs'
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
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 font-mono text-sm text-rose-600 dark:text-rose-300">
          <AlertCircle className="size-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Directives Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-card border-border h-44 animate-pulse rounded-2xl border" />
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="border-border bg-card/40 space-y-3 rounded-2xl border border-dashed px-4 py-12 text-center">
          <FileText className="text-muted-foreground mx-auto size-10" />
          <h3 className="text-foreground font-semibold">No directives match this filter</h3>
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
                className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all duration-200 ${
                  isActive
                    ? 'bg-card border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                    : 'bg-card hover:bg-card/90 border-border hover:border-emerald-500/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="bg-muted text-foreground border-border flex size-8 shrink-0 items-center justify-center rounded-xl border">
                        {isSystem ? (
                          <Terminal className="size-4 text-emerald-500" />
                        ) : (
                          <Sparkles className="size-4 text-teal-500" />
                        )}
                      </div>
                      <div className="truncate">
                        <h3 className="text-foreground truncate font-mono text-sm font-bold">
                          {item.title}
                        </h3>
                        <span className="py-0.2 bg-muted text-muted-foreground border-border rounded border px-1.5 font-mono text-[10px] uppercase">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(item.prompt_text, item.id)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
                        title="Edit prompt"
                      >
                        <Edit3 className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-muted-foreground cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                        title="Delete prompt"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-muted/50 border-border text-foreground line-clamp-4 rounded-xl border p-3 font-mono text-xs leading-relaxed select-text">
                    {item.prompt_text}
                  </div>
                </div>

                <div className="border-border mt-4 flex items-center justify-between border-t pt-3 text-xs">
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {item.prompt_text.length} chars
                  </span>

                  <button
                    onClick={() => handleSetActive(item.id)}
                    className={`cursor-pointer rounded-lg px-3 py-1 font-mono text-[11px] font-medium transition-all ${
                      isActive
                        ? 'border border-emerald-500/40 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground hover:text-foreground border-border border'
                    }`}
                  >
                    {isActive ? '✓ Active Live' : 'Set as Active'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preset Library Showcase */}
      <div className="border-border space-y-4 border-t pt-4">
        <div>
          <h2 className="text-foreground flex items-center gap-2 font-mono text-sm font-bold tracking-wider uppercase">
            <Zap className="size-3.5 text-emerald-500" />
            <span>Curated Tactical Directives</span>
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Pre-engineered prompts calibrated for voice latency, clarity, and smart home command
            response.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CURATED_DIRECTIVES.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <div
                key={idx}
                className="bg-card hover:bg-muted/50 border-border flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all duration-200 hover:border-emerald-500/30"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex size-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Icon className="size-4" />
                    </div>
                    <span className="py-0.2 bg-muted text-muted-foreground border-border rounded border px-1.5 font-mono text-[9px] font-bold">
                      {preset.badge}
                    </span>
                  </div>
                  <h3 className="text-foreground font-mono text-xs font-bold">{preset.title}</h3>
                  <p className="text-muted-foreground line-clamp-3 text-[11px] leading-relaxed">
                    {preset.prompt_text}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAdd(preset)}
                  className="bg-muted text-foreground border-border mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-medium transition-all hover:border-emerald-500/40 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  <Plus className="size-3.5" />
                  <span>Import Directive</span>
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
                <div className="flex size-8 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground font-mono text-sm font-bold">
                    {editingPrompt ? 'Edit Directive' : 'New Directive'}
                  </h3>
                  <p className="text-muted-foreground text-[11px]">
                    LiveKit system persona injected at voice session start
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

            {modalError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 font-mono text-xs text-rose-600 dark:text-rose-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-foreground mb-1 block font-semibold">Directive Name</label>
                <input
                  type="text"
                  placeholder="e.g. Exia Tactical Butler"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 w-full rounded-xl border px-3 py-2 focus:border-emerald-500/50 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-foreground mb-1 block font-semibold">
                  Type Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('system')}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 transition-all ${
                      type === 'system'
                        ? 'border-emerald-500/40 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <Terminal className="size-3.5" />
                    <span>System Persona</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('quick')}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 transition-all ${
                      type === 'quick'
                        ? 'border-emerald-500/40 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <Sparkles className="size-3.5" />
                    <span>Quick Command</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-foreground font-semibold">Prompt Instructions</label>
                  <span className="text-muted-foreground text-[10px]">
                    Insert variable pills below
                  </span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Enter system instructions for Exia..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 w-full resize-none rounded-xl border p-3 leading-relaxed focus:border-emerald-500/50 focus:outline-none"
                  required
                />
              </div>

              {/* Dynamic Variable Chips */}
              <div className="space-y-1.5">
                <span className="text-muted-foreground text-[10px]">
                  Click to insert dynamic variable:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLE_PILLS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="bg-muted text-foreground border-border cursor-pointer rounded-md border px-2 py-1 text-[10px] transition-colors hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300"
                    >
                      {v}
                    </button>
                  ))}
                </div>
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
                  className="cursor-pointer rounded-xl bg-emerald-500 px-5 py-2 font-bold text-black shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingPrompt
                      ? 'Update Directive'
                      : 'Save Directive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
