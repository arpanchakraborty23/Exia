'use client';

import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Sparkles,
  Layers,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Mic,
  Cpu,
  Loader2,
  Info,
  Zap,
  Gauge,
  Activity,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ModelConfig } from '@/lib/types';

const GEMINI_MODELS = [
  {
    id: 'gemini-2.0-flash-realtime',
    name: 'Gemini 2.0 Flash Realtime',
    badge: 'OPTIMAL FOR EXIA',
    latency: '180ms',
    features: 'Native Multimodal Speech-to-Speech, LiveKit WebRTC Direct',
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash Experimental',
    badge: 'LATEST EXP',
    latency: '200ms',
    features: 'Fastest reasoning tokens, enhanced tool execution',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    badge: 'DEEP THINKING',
    latency: '450ms',
    features: '2 Million context window for dense smart home manuals',
  },
];

const GEMINI_VOICES = [
  { id: 'Charon', name: 'Charon', description: 'Deep, calm, tactical mecha operator' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Authoritative, direct, military commander' },
  { id: 'Puck', name: 'Puck', description: 'Energetic, crisp, responsive' },
  { id: 'Aoede', name: 'Aoede', description: 'Melodic, articulate, clear' },
  { id: 'Kore', name: 'Kore', description: 'Warm, calm, ambient butler' },
];

const STT_OPTIONS = [
  { provider: 'Deepgram', model: 'nova-2', name: 'Deepgram Nova-2 (Ultra-low latency, ~120ms)' },
  { provider: 'OpenAI Whisper', model: 'whisper-large-v3', name: 'OpenAI Whisper Large v3 (Highest phonetic accuracy)' },
  { provider: 'AssemblyAI', model: 'conformer-2', name: 'AssemblyAI Conformer-2' },
];

const LLM_OPTIONS = [
  { provider: 'Anthropic', model: 'claude-3-5-sonnet', name: 'Anthropic Claude 3.5 Sonnet' },
  { provider: 'OpenAI', model: 'gpt-4o', name: 'OpenAI GPT-4o' },
  { provider: 'Google Gemini', model: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { provider: 'Ollama (Local)', model: 'llama-3.2:3b', name: 'Ollama Llama 3.2 (Local Private LAN)' },
];

const TTS_OPTIONS = [
  { provider: 'Cartesia', model: 'sonic-english', name: 'Cartesia Sonic (Sub-100ms voice generation)' },
  { provider: 'ElevenLabs', model: 'eleven_multilingual_v2', name: 'ElevenLabs Multilingual v2' },
  { provider: 'OpenAI', model: 'tts-1', name: 'OpenAI TTS-1' },
];

export function ModelSelectionView() {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.models.getConfig();
      setConfig(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load model config');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const updated = await api.models.updateConfig(config);
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save model configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-white/[0.04] rounded-xl animate-pulse" />
        <div className="h-64 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse" />
      </div>
    );
  }

  const currentMode = config?.pipeline_mode || 'gemini_live';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-mono">
              INTELLIGENCE & MODEL ENGINE
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30">
              AUDIO INFERENCE
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Choose between Google Gemini Live native speech-to-speech or a customized modular STT/LLM/TTS pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConfig}
            disabled={isLoading || isSaving}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-all"
            title="Reload config"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            <span>{isSaving ? 'Deploying...' : saveSuccess ? 'Saved & Synced' : 'Apply Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
          <span>Model configuration saved. Exia will use this engine on subsequent sessions.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Architecture Selection Bento Cards */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold block">
          Select Primary Audio Pipeline Architecture
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Gemini Live */}
          <div
            onClick={() =>
              setConfig((prev) => (prev ? { ...prev, pipeline_mode: 'gemini_live' } : null))
            }
            className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              currentMode === 'gemini_live'
                ? 'bg-gradient-to-b from-emerald-950/20 to-black/40 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.07]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center border ${
                      currentMode === 'gemini_live'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_#10b981]'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
                    }`}
                  >
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white font-mono">
                      Gemini Live Multimodal
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Native Speech-to-Speech (Zero STT latency)
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    currentMode === 'gemini_live'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/[0.04] text-zinc-500 border-white/[0.08]'
                  }`}
                >
                  {currentMode === 'gemini_live' ? 'ACTIVE SELECTION' : 'AVAILABLE'}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct WebSocket WebRTC pipeline. Voice tokens are understood natively without transcription errors, allowing natural pauses, laughing, and emotion.
              </p>

              {/* Latency benchmark metric */}
              <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">End-to-End Latency:</span>
                <span className="text-emerald-400 font-bold">~180ms - 240ms (Real-time)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06] text-[10px] font-mono text-zinc-500">
              <span>Opus 48kHz</span>
              <span>•</span>
              <span>Native Interruption Handling</span>
              <span>•</span>
              <span>Gemini 2.0 Flash</span>
            </div>
          </div>

          {/* Card 2: Modular Pipeline */}
          <div
            onClick={() =>
              setConfig((prev) => (prev ? { ...prev, pipeline_mode: 'modular' } : null))
            }
            className={`p-6 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              currentMode === 'modular'
                ? 'bg-gradient-to-b from-teal-950/20 to-black/40 border-teal-500/40 shadow-[0_0_20px_rgba(20,184,166,0.1)]'
                : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.07]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center border ${
                      currentMode === 'modular'
                        ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
                    }`}
                  >
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white font-mono">
                      Modular Pipeline (STT + LLM + TTS)
                    </h3>
                    <span className="text-[10px] text-teal-400 font-mono">
                      Multi-vendor component flexibility
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    currentMode === 'modular'
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-white/[0.04] text-zinc-500 border-white/[0.08]'
                  }`}
                >
                  {currentMode === 'modular' ? 'ACTIVE SELECTION' : 'AVAILABLE'}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Combines Deepgram Nova-2 speech recognition, Claude 3.5 Sonnet / OpenAI reasoning, and Cartesia Sonic high-speed neural synthesis.
              </p>

              {/* Latency benchmark metric */}
              <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">End-to-End Latency:</span>
                <span className="text-teal-400 font-bold">~420ms - 550ms</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06] text-[10px] font-mono text-zinc-500">
              <span>Custom Voice Clones</span>
              <span>•</span>
              <span>Local Ollama Support</span>
              <span>•</span>
              <span>Full Text Hooks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Config Details */}
      {config && (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-6">
          {currentMode === 'gemini_live' ? (
            /* Gemini Live Settings */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-emerald-400" />
                  <span>Gemini Live Voice Parameters</span>
                </h3>
                <span className="text-xs font-mono text-zinc-500">Engine: Google DeepMind</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2">
                    Hosted Live Model
                  </label>
                  <select
                    value={config.gemini_model || GEMINI_MODELS[0].id}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, gemini_model: e.target.value } : null))
                    }
                    className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    {GEMINI_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-2">
                    Voice Persona & Timbre
                  </label>
                  <select
                    value={config.gemini_voice || GEMINI_VOICES[0].id}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, gemini_voice: e.target.value } : null))
                    }
                    className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    {GEMINI_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Temperature & Token Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-zinc-400">Response Temperature</span>
                    <span className="text-emerald-400 font-bold">
                      {config.temperature ?? 0.7}{' '}
                      <span className="text-[10px] text-zinc-500 font-normal">
                        {(config.temperature ?? 0.7) <= 0.3
                          ? '(Tactical / Deterministic)'
                          : (config.temperature ?? 0.7) <= 0.7
                          ? '(Balanced)'
                          : '(Creative)'}
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.temperature ?? 0.7}
                    onChange={(e) =>
                      setConfig((prev) =>
                        prev ? { ...prev, temperature: parseFloat(e.target.value) } : null
                      )
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-zinc-400">Max Token Length</span>
                    <span className="text-emerald-400 font-bold">
                      {config.max_output_tokens ?? 1024} tokens
                    </span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max="4096"
                    step="256"
                    value={config.max_output_tokens ?? 1024}
                    onChange={(e) =>
                      setConfig((prev) =>
                        prev ? { ...prev, max_output_tokens: parseInt(e.target.value) } : null
                      )
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Modular Settings */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Layers className="size-4 text-teal-400" />
                  <span>Modular Pipeline Components</span>
                </h3>
                <span className="text-xs font-mono text-zinc-500">Multi-Vendor Hybrid</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* STT */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    <Mic className="size-3.5 text-teal-400" />
                    <span>Speech-to-Text (STT)</span>
                  </label>
                  <select
                    value={config.stt_provider || 'Deepgram'}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, stt_provider: e.target.value } : null))
                    }
                    className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-teal-500/50"
                  >
                    {STT_OPTIONS.map((o) => (
                      <option key={o.provider} value={o.provider}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LLM */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    <Cpu className="size-3.5 text-teal-400" />
                    <span>Reasoning Engine (LLM)</span>
                  </label>
                  <select
                    value={config.llm_model || 'claude-3-5-sonnet'}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, llm_model: e.target.value } : null))
                    }
                    className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-teal-500/50"
                  >
                    {LLM_OPTIONS.map((o) => (
                      <option key={o.model} value={o.model}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TTS */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    <Volume2 className="size-3.5 text-teal-400" />
                    <span>Voice Synthesis (TTS)</span>
                  </label>
                  <select
                    value={config.tts_provider || 'Cartesia'}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, tts_provider: e.target.value } : null))
                    }
                    className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-teal-500/50"
                  >
                    {TTS_OPTIONS.map((o) => (
                      <option key={o.provider} value={o.provider}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
