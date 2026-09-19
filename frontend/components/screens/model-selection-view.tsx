'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  RefreshCw,
  Volume2,
  Mic,
  Cpu,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ModelConfig } from '@/lib/types';

const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Fastest, Live S2S)', badge: 'OPTIMAL FOR EXIA' },
  { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking (Reasoning)', badge: 'EXPERIMENTAL' },
];

const GEMINI_VOICES = [
  { id: 'Puck', name: 'Puck', description: 'Energetic, expressive, and clear' },
  { id: 'Charon', name: 'Charon', description: 'Deep, calm, authoritative tone (Default Exia)' },
  { id: 'Kore', name: 'Kore', description: 'Warm, natural, friendly cadence' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Direct, focused, military tone' },
  { id: 'Aoede', name: 'Aoede', description: 'Engaging, clear, articulate voice' },
];

const STT_OPTIONS = [
  { provider: 'Deepgram', model: 'nova-2', name: 'Deepgram Nova-2 (~120ms)' },
  { provider: 'Whisper', model: 'whisper-large-v3-turbo', name: 'Groq Whisper Large v3 (~100ms)' },
  { provider: 'Google', model: 'chirp-2', name: 'Google Cloud Speech v2 (~180ms)' },
];

const LLM_OPTIONS = [
  { provider: 'Anthropic', model: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
  { provider: 'OpenAI', model: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { provider: 'Google', model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { provider: 'Ollama', model: 'llama3.2:3b', name: 'Local Ollama (Llama 3.2 3B)' },
];

const TTS_OPTIONS = [
  { provider: 'Cartesia', model: 'sonic-english', name: 'Cartesia Sonic (~90ms)' },
  { provider: 'ElevenLabs', model: 'eleven_turbo_v2_5', name: 'ElevenLabs Flash v2.5 (~120ms)' },
  { provider: 'OpenAI', model: 'tts-1-hd', name: 'OpenAI TTS-1 (~220ms)' },
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
      const data = await api.model.getConfig();
      setConfig(data);
    } catch {
      // Fallback default configuration
      setConfig({
        pipeline_mode: 'gemini_live',
        gemini_model: 'gemini-2.0-flash-exp',
        gemini_voice: 'Charon',
        temperature: 0.7,
        max_output_tokens: 1024,
        stt_provider: 'Deepgram',
        llt_provider: 'Anthropic',
        llm_model: 'claude-3-5-sonnet',
        tts_provider: 'Cartesia',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await api.model.updateConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update model engine configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const currentMode = config?.pipeline_mode || 'gemini_live';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground font-mono">
              INTELLIGENCE & MODEL ENGINE
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold border border-emerald-500/30">
              AUDIO INFERENCE
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Choose between Google Gemini Live native speech-to-speech or a customized modular STT/LLM/TTS pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConfig}
            disabled={isLoading || isSaving}
            className="p-2 rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-all cursor-pointer shadow-xs"
            title="Reload config"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
          <span>Model configuration saved. Exia will use this engine on subsequent sessions.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-mono">
          <AlertCircle className="size-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Architecture Selection Bento Cards */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-bold block">
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
                ? 'bg-gradient-to-b from-emerald-500/10 via-card to-card border-emerald-500/40 shadow-sm dark:from-emerald-950/20 dark:to-card'
                : 'bg-card hover:bg-muted/40 border-border'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center border ${
                      currentMode === 'gemini_live'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground font-mono">
                      Gemini Live Multimodal
                    </h3>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      Native Speech-to-Speech (Zero STT latency)
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    currentMode === 'gemini_live'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {currentMode === 'gemini_live' ? 'ACTIVE SELECTION' : 'AVAILABLE'}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct WebSocket WebRTC pipeline. Voice tokens are understood natively without transcription errors, allowing natural pauses, laughing, and emotion.
              </p>

              {/* Latency benchmark metric */}
              <div className="p-3 rounded-xl bg-muted/60 border border-border flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground font-semibold">End-to-End Latency:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">~180ms - 240ms (Real-time)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border text-[10px] font-mono text-muted-foreground">
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
                ? 'bg-gradient-to-b from-teal-500/10 via-card to-card border-teal-500/40 shadow-sm dark:from-teal-950/20 dark:to-card'
                : 'bg-card hover:bg-muted/40 border-border'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center border ${
                      currentMode === 'modular'
                        ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground font-mono">
                      Modular Pipeline (STT + LLM + TTS)
                    </h3>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-semibold">
                      Multi-vendor component flexibility
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    currentMode === 'modular'
                      ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {currentMode === 'modular' ? 'ACTIVE SELECTION' : 'AVAILABLE'}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Combines Deepgram Nova-2 speech recognition, Claude 3.5 Sonnet / OpenAI reasoning, and Cartesia Sonic high-speed neural synthesis.
              </p>

              {/* Latency benchmark metric */}
              <div className="p-3 rounded-xl bg-muted/60 border border-border flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground font-semibold">End-to-End Latency:</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">~420ms - 550ms</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border text-[10px] font-mono text-muted-foreground">
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
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6 shadow-xs">
          {currentMode === 'gemini_live' ? (
            /* Gemini Live Settings */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
                  <Sparkles className="size-4 text-emerald-500" />
                  <span>Gemini Live Voice Parameters</span>
                </h3>
                <span className="text-xs font-mono text-muted-foreground">Engine: Google DeepMind</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-2">
                    Hosted Live Model
                  </label>
                  <select
                    value={config.gemini_model || GEMINI_MODELS[0].id}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, gemini_model: e.target.value } : null))
                    }
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  >
                    {GEMINI_MODELS.map((m) => (
                      <option key={m.id} value={m.id} className="bg-card text-foreground">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-2">
                    Voice Persona & Timbre
                  </label>
                  <select
                    value={config.gemini_voice || GEMINI_VOICES[0].id}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, gemini_voice: e.target.value } : null))
                    }
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  >
                    {GEMINI_VOICES.map((v) => (
                      <option key={v.id} value={v.id} className="bg-card text-foreground">
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
                    <span className="text-muted-foreground">Response Temperature</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {config.temperature ?? 0.7}{' '}
                      <span className="text-[10px] text-muted-foreground font-normal">
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
                    className="w-full h-2 bg-muted rounded-lg accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-muted-foreground">Max Token Length</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
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
                    className="w-full h-2 bg-muted rounded-lg accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Modular Settings */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
                  <Layers className="size-4 text-teal-500" />
                  <span>Modular Pipeline Components</span>
                </h3>
                <span className="text-xs font-mono text-muted-foreground">Multi-Vendor Hybrid</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* STT */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <Mic className="size-3.5 text-teal-500" />
                    <span>Speech-to-Text (STT)</span>
                  </label>
                  <select
                    value={config.stt_provider || 'Deepgram'}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, stt_provider: e.target.value } : null))
                    }
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    {STT_OPTIONS.map((o) => (
                      <option key={o.provider} value={o.provider} className="bg-card text-foreground">
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LLM */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="size-3.5 text-teal-500" />
                    <span>Reasoning Engine (LLM)</span>
                  </label>
                  <select
                    value={config.llm_model || 'claude-3-5-sonnet'}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, llm_model: e.target.value } : null))
                    }
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    {LLM_OPTIONS.map((o) => (
                      <option key={o.model} value={o.model} className="bg-card text-foreground">
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TTS */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <Volume2 className="size-3.5 text-teal-500" />
                    <span>Voice Synthesis (TTS)</span>
                  </label>
                  <select
                    value={config.tts_provider || 'Cartesia'}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, tts_provider: e.target.value } : null))
                    }
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    {TTS_OPTIONS.map((o) => (
                      <option key={o.provider} value={o.provider} className="bg-card text-foreground">
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
