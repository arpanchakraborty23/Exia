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
} from 'lucide-react';
import { api } from '@/lib/api';
import { ModelConfig } from '@/lib/types';

const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash-realtime', name: 'Gemini 2.0 Flash Realtime (Recommended for Voice)' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

const GEMINI_VOICES = [
  { id: 'Puck', name: 'Puck (Playful, energetic)' },
  { id: 'Charon', name: 'Charon (Deep, calm)' },
  { id: 'Kore', name: 'Kore (Gentle, warm)' },
  { id: 'Fenrir', name: 'Fenrir (Direct, authoritative)' },
  { id: 'Aoede', name: 'Aoede (Melodic, articulate)' },
];

const STT_OPTIONS = [
  { provider: 'Deepgram', model: 'nova-2', name: 'Deepgram Nova-2 (Ultra-low latency)' },
  { provider: 'OpenAI Whisper', model: 'whisper-large-v3', name: 'OpenAI Whisper Large v3 (High accuracy)' },
  { provider: 'AssemblyAI', model: 'conformer-2', name: 'AssemblyAI Conformer-2' },
];

const LLM_OPTIONS = [
  { provider: 'Google Gemini', model: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { provider: 'Anthropic', model: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
  { provider: 'OpenAI', model: 'gpt-4o', name: 'OpenAI GPT-4o' },
  { provider: 'Ollama (Local)', model: 'llama-3.2:3b', name: 'Ollama Llama 3.2 (Local Private)' },
  { provider: 'DeepSeek', model: 'deepseek-r1', name: 'DeepSeek R1' },
];

const TTS_OPTIONS = [
  { provider: 'Cartesia', model: 'sonic-english', name: 'Cartesia Sonic (Fastest voice)' },
  { provider: 'ElevenLabs', model: 'eleven_multilingual_v2', name: 'ElevenLabs Multilingual v2' },
  { provider: 'OpenAI', model: 'tts-1', name: 'OpenAI TTS-1 (Alloy/Nova)' },
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
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-1/3 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-3">
        <p className="text-muted-foreground">Unable to load configuration</p>
        <button
          onClick={fetchConfig}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Model & Voice Engine
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose between unified Gemini Live mode or modular STT / LLM / TTS pipelines
          </p>
        </div>
        <button
          type="button"
          onClick={fetchConfig}
          className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-medium self-start sm:self-auto transition-all"
          title="Refresh config"
        >
          <RefreshCw className="size-4" />
        </button>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="size-4" />
          <span>Model configuration saved successfully via PUT /models/config</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setConfig({ ...config, mode: 'gemini_live' })}
            className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 ${
              config.mode === 'gemini_live'
                ? 'bg-card border-primary ring-2 ring-primary/20 shadow-md'
                : 'bg-card/40 border-border opacity-70 hover:opacity-100 hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center">
                <Sparkles className="size-5" />
              </div>
              {config.mode === 'gemini_live' && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  Active
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Gemini Live Mode</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Native speech-to-speech with Google Gemini Live API. Sub-second latency and natural conversational interruptions.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setConfig({ ...config, mode: 'modular' })}
            className={`p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 ${
              config.mode === 'modular'
                ? 'bg-card border-primary ring-2 ring-primary/20 shadow-md'
                : 'bg-card/40 border-border opacity-70 hover:opacity-100 hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center">
                <Layers className="size-5" />
              </div>
              {config.mode === 'modular' && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  Active
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Modular Pipeline Mode</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Decoupled STT → LLM → TTS architecture. Mix and match Deepgram, Claude, Llama, and Cartesia voices.
              </p>
            </div>
          </button>
        </div>

        {/* Dynamic Mode Details */}
        {config.mode === 'gemini_live' ? (
          /* Gemini Live Settings */
          <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border/80">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Gemini Live Settings</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Gemini Model</label>
                <select
                  value={config.gemini_model}
                  onChange={(e) => setConfig({ ...config, gemini_model: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Voice Persona</label>
                <select
                  value={config.gemini_voice}
                  onChange={(e) => setConfig({ ...config, gemini_voice: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
              <Info className="size-4 shrink-0 text-primary mt-0.5" />
              <span>
                Gemini Live communicates directly through WebRTC data and media channels for the most natural, interruption-friendly voice conversation.
              </span>
            </div>
          </div>
        ) : (
          /* Modular Pipeline Settings */
          <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border/80">
              <Layers className="size-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Modular Stage Providers</h3>
            </div>

            <div className="space-y-4">
              {/* STT */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mic className="size-4 text-muted-foreground" />
                  <label className="text-xs font-semibold text-foreground/80">
                    Speech-to-Text (STT) Provider
                  </label>
                </div>
                <select
                  value={`${config.stt_provider}|${config.stt_model}`}
                  onChange={(e) => {
                    const [provider, model] = e.target.value.split('|');
                    setConfig({ ...config, stt_provider: provider, stt_model: model });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                >
                  {STT_OPTIONS.map((opt) => (
                    <option key={`${opt.provider}|${opt.model}`} value={`${opt.provider}|${opt.model}`}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* LLM */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-muted-foreground" />
                  <label className="text-xs font-semibold text-foreground/80">
                    Large Language Model (LLM) Engine
                  </label>
                </div>
                <select
                  value={`${config.llm_provider}|${config.llm_model}`}
                  onChange={(e) => {
                    const [provider, model] = e.target.value.split('|');
                    setConfig({ ...config, llm_provider: provider, llm_model: model });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                >
                  {LLM_OPTIONS.map((opt) => (
                    <option key={`${opt.provider}|${opt.model}`} value={`${opt.provider}|${opt.model}`}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* TTS */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Volume2 className="size-4 text-muted-foreground" />
                  <label className="text-xs font-semibold text-foreground/80">
                    Text-to-Speech (TTS) Voice
                  </label>
                </div>
                <select
                  value={`${config.tts_provider}|${config.tts_model}`}
                  onChange={(e) => {
                    const [provider, model] = e.target.value.split('|');
                    setConfig({ ...config, tts_provider: provider, tts_model: model });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                >
                  {TTS_OPTIONS.map((opt) => (
                    <option key={`${opt.provider}|${opt.model}`} value={`${opt.provider}|${opt.model}`}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Temperature & Creativity Slider */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground/80">
              Temperature / Creativity: {config.temperature}
            </label>
            <span className="text-[11px] text-muted-foreground">
              {config.temperature < 0.4 ? 'Precise' : config.temperature > 0.8 ? 'Creative' : 'Balanced'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full accent-primary cursor-pointer"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
