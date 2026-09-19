'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Terminal,
  Zap,
  Shield,
  Home,
  Code,
  Sun,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PromptItem } from '@/lib/types';

// Curated Mecha Tactical Directives
const CURATED_DIRECTIVES = [
  {
    title: 'Exia GN-001 Tactical Guardian',
    type: 'system' as const,
    category: 'Mecha Tactical',
    icon: Shield,
    badge: 'ACTIVE RECOMMENDED',
    prompt_text:
      'You are Exia (GN-001), an autonomous mecha tactical intelligence designed for home command and personal assistance. Speak with calm, authoritative precision. Keep voice responses crisp and under 2-3 sentences unless asked for an in-depth breakdown. Prioritize safety, smart home diagnostics, and immediate tactical execution.',
  },
  {
    title: 'Smart Home IoT Sentinel',
    type: 'system' as const,
    category: 'Home Automation',
    icon: Home,
    badge: 'IOT SPECIALIST',
    prompt_text:
      'You are the central home automation controller. When the user mentions lighting, temperature, or locks, immediately query MCP tools to inspect states and trigger requested home scenes. Confirm actions gracefully with room names and temperatures: "Living room set to 22°C."',
  },
  {
    title: 'Software Architect & Terminal Operator',
    type: 'system' as const,
    category: 'Developer Core',
    icon: Code,
    badge: 'CODE ENGINE',
    prompt_text:
      'You are a senior full-stack AI engineer. You help the user debug code, inspect git diffs, inspect filesystem directories via MCP, and reason through architecture problems. Give direct, high-signal solutions without boilerplate pleasantries.',
  },
  {
    title: 'Morning Briefing & Daily Intel',
    type: 'quick' as const,
    category: 'Daily Protocol',
    icon: Sun,
    badge: 'ROUTINE',
    prompt_text:
      'Good morning, Commander {user_name}. Current home climate is {home_temp}, all perimeter sensors are secure, and you have 3 scheduled priorities today. Would you like me to read the top tech headlines?',
  },
];

const VARIABLE_PILLS = [
  '{user_name}',
  '{home_temp}',
  '{current_time}',
  '{active_tools}',
  '{security_status}',
  '{weather_forecast}',
];

export function PromptsView() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'system' | 'quick'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDirectiveId, setActiveDirectiveId] = useState<string | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'system' | 'quick'>('system');
  const [promptText, setPromptText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.prompts.list();
      setPrompts(data || []);
      if (data && data.length > 0 && !activeDirectiveId) {
        setActiveDirectiveId(data[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load prompts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleOpenAdd = (preset?: typeof CURATED_DIRECTIVES[0]) => {
    setEditingPrompt(null);
    if (preset) {
      setTitle(preset.title);
      setType(preset.type);
      setPromptText(preset.prompt_text);
    } else {
      setTitle('');
      setType('system');
      setPromptText('');
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PromptItem) => {
    setEditingPrompt(item);
    setTitle(item.title);
    setType(item.type);
    setPromptText(item.prompt_text);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      await api.prompts.delete(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete prompt');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertVariable = (varName: string) => {
    setPromptText((prev) => prev + (prev.endsWith(' ') ? '' : ' ') + varName + ' ');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !promptText.trim()) {
      setModalError('Please provide both a title and prompt text');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingPrompt) {
        const updated = await api.prompts.update(editingPrompt.id, {
          title,
          type,
          prompt_text: promptText,
        });
        setPrompts((prev) => prev.map((p) => (p.id === editingPrompt.id ? updated : p)));
      } else {
        const created = await api.prompts.create({
          title,
          type,
          prompt_text: promptText,
        });
        setPrompts((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save prompt');
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-mono">
              DIRECTIVE & PROMPT MATRIX
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30">
              TACTICAL BRAIN
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Configure system instructions, voice response brevity, and smart home command macros for Exia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPrompts}
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
            <span>New Custom Directive</span>
          </button>
        </div>
      </div>

      {/* Active Directive Spotlight */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-black/40 to-black/60 border border-emerald-500/30 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                LIVE AGENT DIRECTIVE IN PLAY
              </span>
            </div>
            <h3 className="text-base font-bold font-mono text-white">
              Exia GN-001 Tactical Autonomous Butler
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Real-time voice tone tuned to concise military brevity, proactive IoT anomaly detection, and rapid tool dispatching.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono text-[11px] text-zinc-400 hidden sm:block">
              <div>System Tokens: ~180</div>
              <div className="text-emerald-400">Audio Latency: Optimized</div>
            </div>
            <button
              onClick={() => handleOpenAdd(CURATED_DIRECTIVES[0])}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-medium hover:bg-emerald-500/25 transition-all"
            >
              Tune Parameters
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'system', 'quick'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                filterType === t
                  ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                  : 'text-zinc-500 hover:text-zinc-300'
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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Directives Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01] space-y-3">
          <FileText className="size-10 text-zinc-600 mx-auto" />
          <h3 className="font-semibold text-white">No directives match this filter</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
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
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
                  isActive
                    ? 'bg-white/[0.03] border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.06)]'
                    : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.07] hover:border-white/[0.15]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-xl bg-white/[0.04] text-zinc-300 flex items-center justify-center shrink-0 border border-white/[0.06]">
                        {isSystem ? <Terminal className="size-4" /> : <Sparkles className="size-4" />}
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-sm text-white truncate font-mono">
                          {item.title}
                        </h3>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(item.prompt_text, item.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <Check className="size-4 text-emerald-400" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="Edit prompt"
                      >
                        <Edit3 className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete prompt"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] text-xs text-zinc-300 font-mono leading-relaxed line-clamp-4 select-text">
                    {item.prompt_text}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-4 border-t border-white/[0.06] text-xs">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {item.prompt_text.length} chars
                  </span>

                  <button
                    onClick={() => setActiveDirectiveId(item.id)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/[0.06]'
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
      <div className="space-y-4 pt-4 border-t border-white/[0.08]">
        <div>
          <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="size-3.5 text-emerald-400" />
            <span>Curated Tactical Directives</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pre-engineered prompts calibrated for voice latency, clarity, and smart home command response.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CURATED_DIRECTIVES.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                      {preset.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-white font-mono">{preset.title}</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">
                    {preset.prompt_text}
                  </p>
                </div>

                <button
                  onClick={() => handleOpenAdd(preset)}
                  className="mt-4 w-full py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 hover:text-emerald-300 text-zinc-300 text-xs font-mono font-medium border border-white/[0.08] hover:border-emerald-500/40 transition-all flex items-center justify-center gap-1.5"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0a0e17] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {editingPrompt ? 'Edit Directive' : 'New Directive'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    LiveKit system persona injected at voice session start
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

            <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">Directive Name</label>
                <input
                  type="text"
                  placeholder="e.g. Exia Tactical Butler"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Type Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('system')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      type === 'system'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    <Terminal className="size-3.5" />
                    <span>System Persona</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('quick')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      type === 'quick'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.08] hover:text-white'
                    }`}
                  >
                    <Sparkles className="size-3.5" />
                    <span>Quick Command</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400">Prompt Instructions</label>
                  <span className="text-[10px] text-zinc-500">Insert variable pills below</span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Enter system instructions for Exia..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl p-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 leading-relaxed resize-none"
                  required
                />
              </div>

              {/* Dynamic Variable Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500">Click to insert dynamic variable:</span>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLE_PILLS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="px-2 py-1 rounded-md bg-white/[0.04] hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 border border-white/[0.08] text-[10px] transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
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
