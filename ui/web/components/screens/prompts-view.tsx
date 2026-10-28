'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Code,
  Copy,
  Cpu,
  Database,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  Home,
  Layers,
  Mic,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  UserCheck,
  Volume2,
  Waves,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PromptItem, AgentSkill } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// PROMPT VARIABLES & PRESETS
// ─────────────────────────────────────────────────────────────

const VARIABLE_PILLS = [
  '{user_name}',
  '{current_time}',
  '{active_room}',
  '{home_temp}',
  '{security_status}',
  '{last_command}',
  '{speaker_identity}',
];

const BASE_PROMPT_PRESETS = [
  {
    title: 'Exia Standard Persona',
    badge: 'DEFAULT',
    text: `You are Exia, an intelligent multimodal home assistant and AI companion.
Speak with calm, articulate precision. Keep conversational voice answers under 2-3 sentences unless an in-depth breakdown is explicitly requested.
Always confirm device actions clearly. When executing tools or MCP operations, prioritize safety and verify state changes.`,
  },
  {
    title: 'Technical Coding Copilot',
    badge: 'ENGINEERING',
    text: `You are an expert technical coding copilot and software architect.
Provide direct code solutions with minimal conversational fluff. Highlight edge cases, potential memory or concurrency pitfalls, and follow modern language idioms.`,
  },
  {
    title: 'Ultra-Fast Voice Operator',
    badge: 'LOW LATENCY',
    text: `You are an ultra-fast voice automation agent.
Respond in a single brief sentence whenever possible. Confirm commands with immediate brevity (e.g., "Living room lights set to 40%"). Avoid conversational filler.`,
  },
  {
    title: 'Tactical Sentinel',
    badge: 'SECURITY',
    text: `You are Exia Tactical Sentinel.
Monitor perimeter security, device statuses, and system telemetry. Report anomalies immediately with military brevity and explicit sensor states.`,
  },
];

// ─────────────────────────────────────────────────────────────
// AGENT SKILLS REGISTRY (Modular Capabilities)
// ─────────────────────────────────────────────────────────────

export const DEFAULT_SKILLS: AgentSkill[] = [
  {
    id: 'skill_automation',
    name: 'Home Automation & Smart Devices (MCP)',
    description: 'Controls smart lights, switches, thermostats, and IoT devices through registered MCP servers.',
    category: 'automation',
    enabled: true,
    triggers: ['turn on', 'dim lights', 'set temperature', 'lock door', 'run scene'],
    instruction_prompt:
      'When the user requests home control actions, immediately invoke the corresponding MCP tool. Confirm state changes concisely without unnecessary filler.',
  },
  {
    id: 'skill_search',
    name: 'Live Web Search & Grounding',
    description: 'Performs real-time searches for news, weather forecasts, live sports scores, and technical documentation.',
    category: 'search',
    enabled: true,
    triggers: ['search', 'weather', 'latest news', 'who won', 'lookup online'],
    instruction_prompt:
      'For queries requiring real-time facts or external information, execute web search queries and synthesize up-to-date facts concisely with citations.',
  },
  {
    id: 'skill_code',
    name: 'Code Execution & Terminal Sandboxing',
    description: 'Executes commands, inspects local files, parses JSON/YAML configurations, and helps with engineering tasks.',
    category: 'code',
    enabled: true,
    triggers: ['run command', 'debug code', 'git status', 'check syntax', 'inspect file'],
    instruction_prompt:
      'Provide production-quality code. When running commands or scripts, ensure operations are sandboxed and explain any potential side effects.',
  },
  {
    id: 'skill_memory',
    name: 'Long-Term Memory & Context Recall',
    description: 'Retains past conversation context, user habits, and custom preferences across multiple sessions.',
    category: 'memory',
    enabled: true,
    triggers: ['remember this', 'what did I say', 'my preference', 'recall note'],
    instruction_prompt:
      'Persist important user preferences and recurring context in memory. Reference previous conversation facts naturally when relevant.',
  },
  {
    id: 'skill_voice',
    name: 'Speaker Voice Identification',
    description: 'Verifies speaker identity against enrolled voice signatures in users.json and enforces role permissions.',
    category: 'voice',
    enabled: true,
    triggers: ['identify speaker', 'who is speaking', 'voice check', 'authenticate me'],
    instruction_prompt:
      'Check speaker voice signature against enrolled profiles in users.json. Require admin confirmation for destructive or privileged operations.',
  },
  {
    id: 'skill_calendar',
    name: 'Calendar & Scheduling Automation',
    description: 'Manages daily agenda, schedules reminders, schedules timers, and delivers morning briefings.',
    category: 'automation',
    enabled: false,
    triggers: ['schedule meeting', 'remind me', 'what is on my calendar', 'morning briefing'],
    instruction_prompt:
      'Organize schedule items chronologically. Alert the user to upcoming conflicts and deliver daily agenda summaries with exact start times.',
  },
];

const CURATED_DIRECTIVES = [
  {
    title: 'Exia Standard Persona',
    type: 'system' as const,
    badge: 'DEFAULT',
    prompt_text:
      'You are Exia, an intelligent multimodal assistant. Speak with calm, natural precision. Keep voice responses crisp and under 2-3 sentences unless asked for an in-depth breakdown. Prioritize helpfulness, smart device actions, and immediate clarity.',
  },
  {
    title: 'Concise Voice Assistant',
    type: 'system' as const,
    badge: 'FAST',
    prompt_text:
      'You are a high-speed home automation interface. Respond in 1 brief sentence whenever possible. Confirm commands concisely (e.g. "Living room lights set to 40%"). Avoid conversational filler.',
  },
  {
    title: 'Home Diagnostic Macro',
    type: 'quick' as const,
    badge: 'DIAGNOSTICS',
    prompt_text:
      'Inspect home telemetry across all registered MCP servers. Report disconnected endpoints, battery alerts, and offline smart sensors immediately.',
  },
  {
    title: 'Technical Coding Companion',
    type: 'system' as const,
    badge: 'EXPERT',
    prompt_text:
      'You are a software engineering peer assistant. Provide code snippets directly, highlight potential bugs or edge cases, and keep architectural explanations clear and structured.',
  },
];

type StudioTab = 'base' | 'prompts' | 'skills';

export function PromptsView() {
  const [activeTab, setActiveTab] = useState<StudioTab>('base');

  // 1. BASE SYSTEM PROMPT STATE
  const [basePrompt, setBasePrompt] = useState<string>(BASE_PROMPT_PRESETS[0].text);
  const [isSavingBase, setIsSavingBase] = useState(false);
  const [basePromptSaved, setBasePromptSaved] = useState(false);

  // 2. PROMPT LIBRARY (STORED IN DB)
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [promptFilter, setPromptFilter] = useState<'all' | 'system' | 'quick'>('all');
  const [activePromptId, setActivePromptId] = useState<string>('preset_0');

  // Prompt Modal State
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalPromptText, setModalPromptText] = useState('');
  const [modalType, setModalType] = useState<'system' | 'quick'>('system');
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // 3. AGENT SKILLS STATE
  const [skills, setSkills] = useState<AgentSkill[]>(DEFAULT_SKILLS);
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<AgentSkill['category']>('custom');
  const [newSkillTriggers, setNewSkillTriggers] = useState('');
  const [newSkillInstruction, setNewSkillInstruction] = useState('');

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // LIFECYCLE: LOAD DATA FROM DB & LOCAL STORAGE
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // A. Load Base Prompt
    try {
      const storedBase = localStorage.getItem('exia_base_system_prompt');
      if (storedBase) {
        setBasePrompt(storedBase);
      }
    } catch {}

    // B. Load Skills
    try {
      const storedSkills = localStorage.getItem('exia_agent_skills');
      if (storedSkills) {
        setSkills(JSON.parse(storedSkills));
      }
    } catch {}

    // C. Fetch Prompts from MongoDB API
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setIsLoadingPrompts(true);
    try {
      const data = await api.prompts.getPrompts();
      if (data && data.length > 0) {
        setPrompts(data);
        setActivePromptId(data[0].id);
      } else {
        // Fallback default prompts
        setPrompts(
          CURATED_DIRECTIVES.map((d, i) => ({
            id: `preset_${i}`,
            title: d.title,
            prompt_text: d.prompt_text,
            type: d.type,
            created_at: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.warn('Prompts API error, loading local fallback:', err);
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
      setIsLoadingPrompts(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // BASE PROMPT HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleSaveBasePrompt = async () => {
    setIsSavingBase(true);
    try {
      localStorage.setItem('exia_base_system_prompt', basePrompt);
      // Sync to backend model config and MongoDB
      try {
        await api.models.updateConfig({
          base_system_prompt: basePrompt,
          system_prompt_override: basePrompt,
        });
      } catch {}
      setBasePromptSaved(true);
      setTimeout(() => setBasePromptSaved(false), 2500);
    } catch (err) {
      console.error('Save base prompt error:', err);
    } finally {
      setIsSavingBase(false);
    }
  };

  const handleApplyPreset = (text: string) => {
    setBasePrompt(text);
  };

  const handleInsertBaseVariable = (variable: string) => {
    setBasePrompt((prev) => `${prev} ${variable}`);
  };

  // ─────────────────────────────────────────────────────────────
  // PROMPTS LIBRARY HANDLERS (MongoDB CRUD)
  // ─────────────────────────────────────────────────────────────

  const handleOpenAddPrompt = (preset?: (typeof CURATED_DIRECTIVES)[0]) => {
    setEditingPrompt(null);
    setModalTitle(preset?.title || '');
    setModalPromptText(preset?.prompt_text || '');
    setModalType(preset?.type || 'system');
    setModalError(null);
    setIsPromptModalOpen(true);
  };

  const handleOpenEditPrompt = (prompt: PromptItem) => {
    setEditingPrompt(prompt);
    setModalTitle(prompt.title);
    setModalPromptText(prompt.prompt_text);
    setModalType(prompt.type);
    setModalError(null);
    setIsPromptModalOpen(true);
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalTitle.trim() || !modalPromptText.trim()) {
      setModalError('Title and prompt text are required.');
      return;
    }

    setIsSubmittingPrompt(true);
    try {
      if (editingPrompt) {
        await api.prompts.updatePrompt(editingPrompt.id, {
          title: modalTitle.trim(),
          prompt_text: modalPromptText.trim(),
          type: modalType,
        });
      } else {
        await api.prompts.createPrompt({
          title: modalTitle.trim(),
          prompt_text: modalPromptText.trim(),
          type: modalType,
        });
      }
      setIsPromptModalOpen(false);
      fetchPrompts();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to save prompt to database');
    } finally {
      setIsSubmittingPrompt(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to remove this prompt from the database?')) return;
    try {
      await api.prompts.deletePrompt(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      if (activePromptId === id) {
        setActivePromptId(prompts[0]?.id || 'preset_0');
      }
    } catch (err: unknown) {
      console.error('Delete error:', err);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─────────────────────────────────────────────────────────────
  // SKILLS HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleToggleSkill = (id: string) => {
    setSkills((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
      try {
        localStorage.setItem('exia_agent_skills', JSON.stringify(updated));
        api.models.updateConfig({ skills: updated }).catch(() => {});
      } catch {}
      return updated;
    });
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillInstruction.trim()) return;

    const newSkill: AgentSkill = {
      id: `skill_${Date.now().toString(36)}`,
      name: newSkillName.trim(),
      description: newSkillDesc.trim() || 'Custom user capability module',
      category: newSkillCategory,
      enabled: true,
      triggers: newSkillTriggers
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      instruction_prompt: newSkillInstruction.trim(),
      created_at: new Date().toISOString(),
    };

    setSkills((prev) => {
      const updated = [...prev, newSkill];
      try {
        localStorage.setItem('exia_agent_skills', JSON.stringify(updated));
        api.models.updateConfig({ skills: updated }).catch(() => {});
      } catch {}
      return updated;
    });

    setNewSkillName('');
    setNewSkillDesc('');
    setNewSkillTriggers('');
    setNewSkillInstruction('');
    setIsSkillModalOpen(false);
  };

  const handleDeleteSkill = (id: string) => {
    setSkills((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('exia_agent_skills', JSON.stringify(updated));
        api.models.updateConfig({ skills: updated }).catch(() => {});
      } catch {}
      return updated;
    });
  };

  const filteredPrompts = prompts.filter((p) =>
    promptFilter === 'all' ? true : p.type === promptFilter
  );

  const activeSkillsCount = skills.filter((s) => s.enabled).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & TOP NAV TABS
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              Agent Prompts & Skills Studio
            </h1>
            <span className="border-primary/30 bg-primary/15 text-primary rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
              DB SYNCED
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure Exia's base system prompt, prompt templates, and modular capabilities stored in database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'prompts' && (
            <button
              type="button"
              onClick={() => handleOpenAddPrompt()}
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="size-4" />
              <span>New Prompt</span>
            </button>
          )}

          {activeTab === 'skills' && (
            <button
              type="button"
              onClick={() => setIsSkillModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="size-4" />
              <span>Add Custom Skill</span>
            </button>
          )}

          {activeTab === 'base' && (
            <button
              type="button"
              onClick={handleSaveBasePrompt}
              disabled={isSavingBase}
              className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              {basePromptSaved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
              <span>{basePromptSaved ? 'Saved to Database' : 'Save Base Prompt'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Studio Tabs Navigation */}
      <div className="border-border flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('base')}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'base'
                ? 'border border-primary/40 bg-primary/10 text-primary font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Terminal className="size-3.5" />
            <span>Base System Prompt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompts')}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'prompts'
                ? 'border border-primary/40 bg-primary/10 text-primary font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Database className="size-3.5" />
            <span>Prompt Library ({prompts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'skills'
                ? 'border border-primary/40 bg-primary/10 text-primary font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>Skills & Capabilities ({activeSkillsCount}/{skills.length})</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: BASE SYSTEM PROMPT (Agent Core Instructions)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'base' && (
        <section className="space-y-6">
          <div className="border-border bg-card relative space-y-6 overflow-hidden rounded-2xl border p-6 shadow-sm">
            <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="border-primary/40 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl border">
                  <Terminal className="size-5" />
                </div>
                <div>
                  <h3 className="text-foreground text-base font-semibold">Agent Core Identity & Base Instructions</h3>
                  <p className="text-muted-foreground text-xs">
                    The fundamental directive injected into every conversational turn across Realtime S2S and Modular agents.
                  </p>
                </div>
              </div>

              {basePromptSaved && (
                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
                  <CheckCircle2 className="size-3.5" />
                  <span>Synchronized to Engine</span>
                </div>
              )}
            </div>

            {/* Presets Row */}
            <div className="space-y-2">
              <label className="text-foreground text-xs font-medium">Quick Personas / Baseline Presets</label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {BASE_PROMPT_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handleApplyPreset(preset.text)}
                    className="border-border bg-muted/20 hover:bg-muted/40 text-left rounded-xl border p-3 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-xs font-semibold">{preset.title}</span>
                      <span className="border-border bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 rounded border font-mono">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
                      {preset.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Base Prompt Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-foreground text-xs font-medium">Base System Prompt Content</label>
                <span className="text-muted-foreground text-[11px]">
                  ~{Math.round(basePrompt.length / 4)} tokens · {basePrompt.length} chars
                </span>
              </div>

              <textarea
                rows={9}
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                placeholder="Write the core agent instructions, identity, conversational cadence, and guardrails..."
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border p-4 text-xs font-mono leading-relaxed transition-all"
              />
            </div>

            {/* Dynamic Variable Pills */}
            <div className="space-y-2 border-t border-border pt-4">
              <span className="text-muted-foreground text-[11px]">Click to insert runtime variable:</span>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLE_PILLS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleInsertBaseVariable(v)}
                    className="border-border bg-muted/40 hover:bg-muted text-foreground/80 cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-mono transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PROMPTS LIBRARY (Stored in MongoDB via /api/prompts)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'prompts' && (
        <section className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {(['all', 'system', 'quick'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPromptFilter(t)}
                  className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    promptFilter === t
                      ? 'border-border bg-muted text-foreground border shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {t === 'all'
                    ? `All Prompts (${prompts.length})`
                    : t === 'system'
                    ? 'System Personas'
                    : 'Quick Macros'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchPrompts}
              disabled={isLoadingPrompts}
              className="border-border hover:bg-muted text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
              title="Refresh from database"
            >
              <RefreshCw className={`size-3.5 ${isLoadingPrompts ? 'animate-spin text-primary' : ''}`} />
              <span>Sync DB</span>
            </button>
          </div>

          {/* Prompts Grid */}
          {isLoadingPrompts ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="border-border bg-card h-40 animate-pulse rounded-2xl border" />
              ))}
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="border-border bg-card/40 space-y-3 rounded-2xl border border-dashed px-4 py-12 text-center">
              <FileText className="text-muted-foreground mx-auto size-10" />
              <h3 className="text-foreground text-sm font-semibold">No prompts match this filter</h3>
              <p className="text-muted-foreground mx-auto max-w-sm text-xs">
                Create a new prompt to save custom directives to the database.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredPrompts.map((item) => {
                const isCopied = copiedId === item.id;
                const isSystem = item.type === 'system';
                const isActive = activePromptId === item.id;

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
                            onClick={() => handleOpenEditPrompt(item)}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg p-1.5 transition-colors"
                            title="Edit prompt"
                          >
                            <Edit3 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePrompt(item.id)}
                            className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer rounded-lg p-1.5 transition-colors"
                            title="Delete prompt"
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
                        onClick={() => setActivePromptId(item.id)}
                        className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          isActive
                            ? 'border border-primary/30 bg-primary/10 text-primary font-semibold'
                            : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground border'
                        }`}
                      >
                        {isActive ? 'Active Directive' : 'Set active'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: SKILLS & CAPABILITIES STUDIO (Modular Expansion)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'skills' && (
        <section className="space-y-6">
          <div className="border-border bg-card relative space-y-4 overflow-hidden rounded-2xl border p-6 shadow-sm">
            <div className="border-border flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-foreground text-base font-semibold">Modular Agent Skills</h3>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  When enabled, each skill automatically injects specialized domain rules, tool directives, and behavior constraints into Exia.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                  {activeSkillsCount} Active Skills
                </span>
              </div>
            </div>

            {/* Skills List Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {skills.map((skill) => {
                const isExpanded = expandedSkillId === skill.id;
                return (
                  <div
                    key={skill.id}
                    className={`border-border bg-muted/20 hover:bg-muted/30 flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                      skill.enabled ? 'border-primary/40 bg-card shadow-xs' : 'opacity-75'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-9 items-center justify-center rounded-xl border ${
                              skill.enabled
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-border bg-muted text-muted-foreground'
                            }`}
                          >
                            {skill.category === 'automation' && <Home className="size-4" />}
                            {skill.category === 'search' && <Globe className="size-4" />}
                            {skill.category === 'code' && <Code className="size-4" />}
                            {skill.category === 'memory' && <Sparkles className="size-4" />}
                            {skill.category === 'voice' && <Mic className="size-4" />}
                            {skill.category === 'custom' && <Wrench className="size-4" />}
                          </div>
                          <div>
                            <h4 className="text-foreground text-sm font-semibold">{skill.name}</h4>
                            <span className="text-muted-foreground text-[10px] font-mono uppercase">
                              {skill.category}
                            </span>
                          </div>
                        </div>

                        {/* Enable/Disable Switch */}
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={skill.enabled}
                              onChange={() => handleToggleSkill(skill.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                          </label>

                          {skill.category === 'custom' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSkill(skill.id)}
                              className="text-muted-foreground hover:text-red-400 p-1 cursor-pointer"
                              title="Delete custom skill"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {skill.description}
                      </p>

                      {/* Trigger chips */}
                      {skill.triggers && skill.triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {skill.triggers.map((trig) => (
                            <span
                              key={trig}
                              className="border-border bg-muted/60 text-foreground rounded-lg border px-2 py-0.5 text-[10px] font-mono"
                            >
                              "{trig}"
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expandable Injected Instruction */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                          className="text-primary hover:underline text-[11px] font-medium cursor-pointer"
                        >
                          {isExpanded ? 'Hide Instruction Directive ▲' : 'View Injected Directive ▼'}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 rounded-xl border border-border bg-muted/40 p-3 text-xs font-mono text-foreground leading-relaxed">
                            {skill.instruction_prompt}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT PROMPT (MongoDB CRUD)
         ───────────────────────────────────────────────────────────── */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border bg-card text-foreground w-full max-w-lg space-y-5 rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">
                    {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Saved directly to database and accessible in runtime sessions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPromptModalOpen(false)}
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

            <form onSubmit={handleSavePrompt} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-foreground text-xs font-medium">Prompt Title</label>
                <input
                  type="text"
                  placeholder="e.g. Security Check Macro, Butler Persona..."
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-sm transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground text-xs font-medium">Prompt Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType('system')}
                    className={`cursor-pointer rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                      modalType === 'system'
                        ? 'border-primary/40 bg-primary/10 text-primary font-semibold'
                        : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    System Persona
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType('quick')}
                    className={`cursor-pointer rounded-xl border p-2.5 text-center text-xs font-medium transition-all ${
                      modalType === 'quick'
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
                  <label className="text-foreground text-xs font-medium">Prompt Instructions</label>
                  <span className="text-muted-foreground text-[10px]">Supports dynamic variables</span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Describe demeanor, operational rules, tool constraints, and output format..."
                  value={modalPromptText}
                  onChange={(e) => setModalPromptText(e.target.value)}
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
                      onClick={() => setModalPromptText((prev) => `${prev} ${v}`)}
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
                  onClick={() => setIsPromptModalOpen(false)}
                  className="border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer rounded-xl border px-4 py-2 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPrompt}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmittingPrompt ? 'Saving to DB...' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD CUSTOM AGENT SKILL
         ───────────────────────────────────────────────────────────── */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border bg-card text-foreground w-full max-w-lg space-y-5 rounded-2xl border p-6 shadow-2xl">
            <div className="border-border flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">Create Custom Agent Skill</h3>
                  <p className="text-muted-foreground text-xs">
                    Define triggers and specialized instructions for Exia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSkillModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-1.5 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomSkill} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-foreground text-xs font-medium">Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g. Media Player Control, Stock Ticker..."
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-sm transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground text-xs font-medium">Category</label>
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value as AgentSkill['category'])}
                  className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                >
                  <option value="custom" className="bg-card text-foreground">Custom Integration</option>
                  <option value="automation" className="bg-card text-foreground">Home Automation</option>
                  <option value="search" className="bg-card text-foreground">Search & Intelligence</option>
                  <option value="code" className="bg-card text-foreground">Code & Terminal</option>
                  <option value="memory" className="bg-card text-foreground">Memory & Recall</option>
                  <option value="voice" className="bg-card text-foreground">Voice & Audio</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground text-xs font-medium">Description</label>
                <input
                  type="text"
                  placeholder="Short description of what this capability achieves..."
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-xs transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground text-xs font-medium">Trigger Keywords (comma separated)</label>
                <input
                  type="text"
                  placeholder="play, pause, next track, volume"
                  value={newSkillTriggers}
                  onChange={(e) => setNewSkillTriggers(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-xs transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground text-xs font-medium">Injected Instruction Prompt</label>
                <textarea
                  rows={4}
                  placeholder="Explain exactly how the agent should handle these requests..."
                  value={newSkillInstruction}
                  onChange={(e) => setNewSkillInstruction(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border p-3 text-xs leading-relaxed transition-all"
                  required
                />
              </div>

              <div className="border-border flex items-center justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer rounded-xl border px-4 py-2 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary-hover cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all"
                >
                  Save & Enable Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
