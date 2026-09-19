'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Check,
  Copy,
  Terminal,
  Sparkles,
  Zap,
  Sliders,
  AlertCircle,
  RefreshCw,
  X,
  Code,
  Lightbulb,
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

  const handleOpenAdd = (preset?: { title: string; prompt_text: string; type: 'system' | 'quick' }) => {
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground font-mono">
              DIRECTIVE & PROMPT MATRIX
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold border border-emerald-500/30">
              TACTICAL BRAIN
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Configure system instructions, voice response brevity, and smart home command macros for Exia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPrompts}
            disabled={isLoading}
            className="p-2 rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-all cursor-pointer shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="size-4" />
            <span>New Custom Directive</span>
          </button>
        </div>
      </div>

      {/* Active Directive Spotlight Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-card to-card border border-emerald-500/35 backdrop-blur-xl relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                LIVE AGENT DIRECTIVE IN PLAY
              </span>
            </div>
            <h3 className="text-base font-bold font-mono text-foreground">
              Exia GN-001 Tactical Autonomous Butler
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Real-time voice tone tuned to concise military brevity, proactive IoT anomaly detection, and rapid tool dispatching.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono text-[11px] text-muted-foreground hidden sm:block">
              <div>System Tokens: ~180</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Audio Latency: Optimized</div>
            </div>
            <button
              onClick={() => handleOpenAdd(CURATED_DIRECTIVES[0])}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 text-xs font-mono font-medium hover:bg-emerald-500/25 transition-all cursor-pointer shadow-xs"
            >
              Tune Parameters
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'system', 'quick'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-muted text-foreground border border-border shadow-xs font-bold'
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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-sm font-mono">
          <AlertCircle className="size-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Directives Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
          <FileText className="size-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-foreground">No directives match this filter</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Choose a curated preset below or add a new custom instruction.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrompts.map((item) => {
            const isCopied = copiedId === item.id;
            const isSystem = item.type === 'system';
            const isActive = activeDirectiveId === item.id;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group shadow-xs ${
                  isActive
                    ? 'bg-card border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                    : 'bg-card hover:bg-card/90 border-border hover:border-emerald-500/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 border border-border">
                        {isSystem ? <Terminal className="size-4 text-emerald-500" /> : <Sparkles className="size-4 text-teal-500" />}
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-sm text-foreground truncate font-mono">
                          {item.title}
                        </h3>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(item.prompt_text, item.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Edit prompt"
                      >
                        <Edit3 className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete prompt"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-foreground font-mono leading-relaxed line-clamp-4 select-text">
                    {item.prompt_text}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-4 border-t border-border text-xs">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {item.prompt_text.length} chars
                  </span>

                  <button
                    onClick={() => handleSetActive(item.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
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
      <div className="space-y-4 pt-4 border-t border-border">
        <div>
          <h2 className="text-sm font-bold font-mono text-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap className="size-3.5 text-emerald-500" />
            <span>Curated Tactical Directives</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pre-engineered prompts calibrated for voice latency, clarity, and smart home command response.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CURATED_DIRECTIVES.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                      {preset.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-foreground font-mono">{preset.title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                    {preset.prompt_text}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAdd(preset)}
                  className="mt-4 w-full py-1.5 px-3 rounded-xl bg-muted hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 text-foreground text-xs font-mono font-medium border border-border hover:border-emerald-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground font-mono">
                    {editingPrompt ? 'Edit Directive' : 'New Directive'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    LiveKit system persona injected at voice session start
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-mono">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-foreground font-semibold mb-1">Directive Name</label>
                <input
                  type="text"
                  placeholder="e.g. Exia Tactical Butler"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-foreground font-semibold mb-1">Type Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('system')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      type === 'system'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <Terminal className="size-3.5" />
                    <span>System Persona</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('quick')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      type === 'quick'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <Sparkles className="size-3.5" />
                    <span>Quick Command</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-foreground font-semibold">Prompt Instructions</label>
                  <span className="text-[10px] text-muted-foreground">Insert variable pills below</span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Enter system instructions for Exia..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/50 leading-relaxed resize-none"
                  required
                />
              </div>

              {/* Dynamic Variable Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground">Click to insert dynamic variable:</span>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLE_PILLS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="px-2 py-1 rounded-md bg-muted hover:bg-emerald-500/15 text-foreground hover:text-emerald-700 dark:hover:text-emerald-300 border border-border text-[10px] transition-colors cursor-pointer"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingPrompt ? 'Update Directive' : 'Save Directive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
