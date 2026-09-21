'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Loader2,
  Mic,
  RefreshCw,
  Save,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ModelConfig } from '@/lib/types';

const GEMINI_MODELS = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Fastest, Live S2S)',
    badge: 'OPTIMAL FOR EXIA',
  },
  {
    id: 'gemini-2.0-flash-thinking-exp',
    name: 'Gemini 2.0 Flash Thinking (Reasoning)',
    badge: 'EXPERIMENTAL',
  },
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
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load model configuration from backend endpoint'
      );
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update model engine configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const currentMode = config?.pipeline_mode || 'gemini_live';

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      {/* Screen Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground font-mono text-xl font-extrabold tracking-tight md:text-2xl">
              INTELLIGENCE & MODEL ENGINE
            </h1>
            <span className="rounded border border-primary/25 bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary dark:text-primary">
              AUDIO INFERENCE
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Choose between Google Gemini Live native speech-to-speech or a customized modular
            STT/LLM/TTS pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConfig}
            disabled={isLoading || isSaving}
            className="bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border cursor-pointer rounded-xl border p-2 shadow-xs transition-all"
            title="Reload config"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-black shadow-[0_0_15px_rgba(31,213,249,0.25)] transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Save className="size-4" />
            )}
            <span>
              {isSaving ? 'Deploying...' : saveSuccess ? 'Saved & Synced' : 'Apply Configuration'}
            </span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/15 p-4 font-mono text-xs text-primary dark:text-primary">
          <CheckCircle2 className="size-4 shrink-0 text-primary" />
          <span>Model configuration saved. Exia will use this engine on subsequent sessions.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 font-mono text-xs text-rose-600 dark:text-rose-300">
          <AlertCircle className="size-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Architecture Selection Bento Cards */}
      <div className="space-y-3">
        <label className="text-muted-foreground block font-mono text-xs font-bold tracking-wider uppercase">
          Select Primary Audio Pipeline Architecture
        </label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card 1: Gemini Live */}
          <div
            onClick={() =>
              setConfig((prev) => (prev ? { ...prev, pipeline_mode: 'gemini_live' } : null))
            }
            className={`relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-200 ${
              currentMode === 'gemini_live'
                ? 'via-card to-card dark:to-card border-primary/30 bg-gradient-to-b from-primary/8 shadow-sm dark:from-primary/5'
                : 'bg-card hover:bg-muted/40 border-border'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl border ${
                      currentMode === 'gemini_live'
                        ? 'border-primary/25 bg-primary/15 text-primary shadow-[0_0_10px_rgba(16,185,129,0.2)] dark:text-primary'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-mono text-sm font-bold">
                      Gemini Live Multimodal
                    </h3>
                    <span className="font-mono text-[10px] font-semibold text-primary dark:text-primary">
                      Native Speech-to-Speech (Zero STT latency)
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                    currentMode === 'gemini_live'
                      ? 'border-primary/35 bg-primary/15 text-primary dark:text-primary'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {currentMode === 'gemini_live' ? 'ACTIVE SELECTION' : 'AVAILABLE'}
                </span>
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed">
                Direct WebSocket WebRTC pipeline. Voice tokens are understood natively without
                transcription errors, allowing natural pauses, laughing, and emotion.
              </p>

              {/* Latency benchmark metric */}
              <div className="bg-muted/60 border-border flex items-center justify-between rounded-xl border p-3 font-mono text-[11px]">
                <span className="text-muted-foreground font-semibold">End-to-End Latency:</span>
                <span className="font-bold text-primary dark:text-primary">
                  ~180ms - 240ms (Real-time)
                </span>
              </div>
            </div>

            <div className="border-border text-muted-foreground mt-4 flex items-center gap-2 border-t pt-3 font-mono text-[10px]">
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
            className={`relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-200 ${
              currentMode === 'modular'
                ? 'via-card to-card dark:to-card border-primary/30 bg-gradient-to-b from-primary/8 shadow-sm dark:from-primary/5'
                : 'bg-card hover:bg-muted/40 border-border'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl border ${
                      currentMode === 'modular'
                        ? 'border-primary/25 bg-primary/12 text-primary dark:text-primary'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    <Layers className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-mono text-sm font-bold">
                      Modular Pipeline (STT + LLM + TTS)
                    </h3>
                    <span className="font-mono text-[10px] font-semibold text-primary dark:text-primary">
                      Multi-vendor component flexibility
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                    currentMode === 'modular'
                      ? 'border-primary/35 bg-primary/12 text-primary dark:text-primary'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {currentMode === 'modular' ? 'ACTIVE SELECTION' : 'AVAILABLE'}
                </span>
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed">
                Combines Deepgram Nova-2 speech recognition, Claude 3.5 Sonnet / OpenAI reasoning,
                and Cartesia Sonic high-speed neural synthesis.
              </p>

              {/* Latency benchmark metric */}
              <div className="bg-muted/60 border-border flex items-center justify-between rounded-xl border p-3 font-mono text-[11px]">
                <span className="text-muted-foreground font-semibold">End-to-End Latency:</span>
                <span className="font-bold text-primary dark:text-primary">~420ms - 550ms</span>
              </div>
            </div>

            <div className="border-border text-muted-foreground mt-4 flex items-center gap-2 border-t pt-3 font-mono text-[10px]">
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
        <div className="bg-card border-border space-y-6 rounded-2xl border p-6 shadow-xs">
          {currentMode === 'gemini_live' ? (
            /* Gemini Live Settings */
            <div className="space-y-6">
              <div className="border-border flex items-center justify-between border-b pb-3">
                <h3 className="text-foreground flex items-center gap-2 font-mono text-sm font-bold">
                  <Sparkles className="size-4 text-primary" />
                  <span>Gemini Live Voice Parameters</span>
                </h3>
                <span className="text-muted-foreground font-mono text-xs">
                  Engine: Google DeepMind
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="text-muted-foreground mb-2 block font-mono text-xs">
                    Hosted Live Model
                  </label>
                  <select
                    value={config.gemini_model || GEMINI_MODELS[0].id}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, gemini_model: e.target.value } : null))
                    }
                    className="bg-muted/40 border-border text-foreground w-full cursor-pointer rounded-xl border px-3 py-2 font-mono text-xs focus:border-primary/50 focus:outline-none"
                  >
                    {GEMINI_MODELS.map((m) => (
                      <option key={m.id} value={m.id} className="bg-card text-foreground">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-muted-foreground mb-2 block font-mono text-xs">
                    Voice Persona & Timbre
                  </label>
                  <select
                    value={config.gemini_voice || GEMINI_VOICES[0].id}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, gemini_voice: e.target.value } : null))
                    }
                    className="bg-muted/40 border-border text-foreground w-full cursor-pointer rounded-xl border px-3 py-2 font-mono text-xs focus:border-primary/50 focus:outline-none"
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
              <div className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">Response Temperature</span>
                    <span className="font-bold text-primary dark:text-primary">
                      {config.temperature ?? 0.7}{' '}
                      <span className="text-muted-foreground text-[10px] font-normal">
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
                    className="bg-muted h-2 w-full cursor-pointer rounded-lg accent-primary"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">Max Token Length</span>
                    <span className="font-bold text-primary dark:text-primary">
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
                    className="bg-muted h-2 w-full cursor-pointer rounded-lg accent-primary"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Modular Settings */
            <div className="space-y-6">
              <div className="border-border flex items-center justify-between border-b pb-3">
                <h3 className="text-foreground flex items-center gap-2 font-mono text-sm font-bold">
                  <Layers className="size-4 text-primary" />
                  <span>Modular Pipeline Components</span>
                </h3>
                <span className="text-muted-foreground font-mono text-xs">Multi-Vendor Hybrid</span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* STT */}
                <div className="space-y-2">
                  <label className="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
                    <Mic className="size-3.5 text-primary" />
                    <span>Speech-to-Text (STT)</span>
                  </label>
                  <select
                    value={config.stt_provider || 'Deepgram'}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, stt_provider: e.target.value } : null))
                    }
                    className="bg-muted/40 border-border text-foreground w-full cursor-pointer rounded-xl border px-3 py-2 font-mono text-xs focus:border-primary/50 focus:outline-none"
                  >
                    {STT_OPTIONS.map((o) => (
                      <option
                        key={o.provider}
                        value={o.provider}
                        className="bg-card text-foreground"
                      >
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LLM */}
                <div className="space-y-2">
                  <label className="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
                    <Cpu className="size-3.5 text-primary" />
                    <span>Reasoning Engine (LLM)</span>
                  </label>
                  <select
                    value={config.llm_model || 'claude-3-5-sonnet'}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, llm_model: e.target.value } : null))
                    }
                    className="bg-muted/40 border-border text-foreground w-full cursor-pointer rounded-xl border px-3 py-2 font-mono text-xs focus:border-primary/50 focus:outline-none"
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
                  <label className="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
                    <Volume2 className="size-3.5 text-primary" />
                    <span>Voice Synthesis (TTS)</span>
                  </label>
                  <select
                    value={config.tts_provider || 'Cartesia'}
                    onChange={(e) =>
                      setConfig((prev) => (prev ? { ...prev, tts_provider: e.target.value } : null))
                    }
                    className="bg-muted/40 border-border text-foreground w-full cursor-pointer rounded-xl border px-3 py-2 font-mono text-xs focus:border-primary/50 focus:outline-none"
                  >
                    {TTS_OPTIONS.map((o) => (
                      <option
                        key={o.provider}
                        value={o.provider}
                        className="bg-card text-foreground"
                      >
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
