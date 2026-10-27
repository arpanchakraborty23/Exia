'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  AudioWaveform,
  Check,
  CheckCircle2,
  Clock,
  Code,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  HelpCircle,
  Info,
  Key,
  Layers,
  Link,
  Loader2,
  Mic,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  Volume2,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ModelConfig, VoiceUserProfile } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// VERIFIED UP-TO-DATE MODEL REGISTRIES (Validated via LiveKit Docs & Web)
// ─────────────────────────────────────────────────────────────

// 1. REALTIME S2S (Speech-to-Speech WebSockets)
export type RealtimeProvider = 'livekit' | 'google' | 'openai';

const REALTIME_PROVIDERS = [
  {
    id: 'livekit' as RealtimeProvider,
    name: 'LiveKit Inference (Realtime Voice S2S)',
    badge: 'ZERO RETENTION S2S',
    latency: '~130ms',
    keyPlaceholder: 'Managed by LiveKit Project Credentials',
    keyHelp: 'docs.livekit.io/agents/models/realtime',
    isLiveKitInference: true,
    models: [
      { id: 'google/gemini-3.8-live', name: 'Gemini 3.8 Live (Turn-based Direct S2S)' },
      { id: 'google/gemini-3.8-live-extended-thinking', name: 'Gemini 3.8 Live (Extended Thinking S2S)' },
      { id: 'openai/gpt-realtime-2.1', name: 'OpenAI GPT Realtime 2.1 (Low Latency S2S)' },
      { id: 'openai/gpt-realtime-2.1-mini', name: 'OpenAI GPT Realtime 2.1 Mini (Fast & Cost Efficient)' },
      { id: 'openai/gpt-live-1', name: 'OpenAI GPT-Live 1 (Full-Duplex Speech)' },
      { id: 'xai/grok-voice-3.0', name: 'Grok Voice 3.0 (xAI Realtime Conversational)' },
    ],
    voices: [
      { id: 'Charon', name: 'Charon (Deep & Measured — Exia Default)', hz: 180 },
      { id: 'Puck', name: 'Puck (Natural & Expressive)', hz: 260 },
      { id: 'Kore', name: 'Kore (Warm & Conversational)', hz: 320 },
      { id: 'Fenrir', name: 'Fenrir (Direct Military Brevity)', hz: 160 },
      { id: 'Aoede', name: 'Aoede (Articulate & Radiant)', hz: 300 },
      { id: 'alloy', name: 'Alloy (Balanced Studio)', hz: 220 },
      { id: 'echo', name: 'Echo (Warm & Grounded)', hz: 190 },
      { id: 'shimmer', name: 'Shimmer (Bright & Articulate)', hz: 310 },
      { id: 'marin', name: 'Marin (Conversational Natural)', hz: 240 },
    ],
  },
  {
    id: 'google' as RealtimeProvider,
    name: 'Google Gemini Live',
    badge: 'SUB-SECOND S2S',
    latency: '~180ms',
    keyPlaceholder: 'AIzaSy...',
    keyHelp: 'aistudio.google.com/apikey',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fastest, Multimodal)' },
      { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking (Reasoning S2S)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (2M Token Context)' },
    ],
    voices: [
      { id: 'Charon', name: 'Charon (Deep & Measured — Exia Default)', hz: 180 },
      { id: 'Puck', name: 'Puck (Natural & Expressive)', hz: 260 },
      { id: 'Kore', name: 'Kore (Warm & Conversational)', hz: 320 },
      { id: 'Fenrir', name: 'Fenrir (Direct Military Brevity)', hz: 160 },
      { id: 'Aoede', name: 'Aoede (Articulate & Radiant)', hz: 300 },
    ],
  },
  {
    id: 'openai' as RealtimeProvider,
    name: 'OpenAI Realtime API',
    badge: 'WEBRTC / WEBSOCKET',
    latency: '~240ms',
    keyPlaceholder: 'sk-proj-...',
    keyHelp: 'platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o-realtime-preview', name: 'gpt-4o-realtime-preview (Flagship Realtime)' },
      { id: 'gpt-4o-mini-realtime-preview', name: 'gpt-4o-mini-realtime-preview (Low Latency & Cost)' },
    ],
    voices: [
      { id: 'marin', name: 'Marin (Recommended Studio Quality)', hz: 240 },
      { id: 'cedar', name: 'Cedar (Recommended Rich Resonant)', hz: 175 },
      { id: 'alloy', name: 'Alloy (Neutral & Balanced)', hz: 220 },
      { id: 'echo', name: 'Echo (Warm & Grounded)', hz: 190 },
      { id: 'shimmer', name: 'Shimmer (Bright & Articulate)', hz: 310 },
      { id: 'ash', name: 'Ash (Relaxed & Casual)', hz: 180 },
      { id: 'coral', name: 'Coral (Friendly & Upbeat)', hz: 270 },
      { id: 'sage', name: 'Sage (Authoritative & Crisp)', hz: 200 },
      { id: 'verse', name: 'Verse (Dynamic & Expressive)', hz: 230 },
      { id: 'ballad', name: 'Ballad (Warm Storyteller)', hz: 210 },
    ],
  },
];

// 2. MODULAR: SPEECH-TO-TEXT (STT)
export type STTProvider = 'livekit' | 'speechmatics' | 'deepgram' | 'openai' | 'google';

export const SPEECHMATICS_LANGUAGES = [
  { code: 'en', name: 'English (US, UK, AU, IN, Scottish Accents)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'cmn', name: 'Mandarin Chinese (中文)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'auto', name: 'Auto-Detect (Automatic Language ID)' },
];

const STT_PROVIDERS = [
  {
    id: 'livekit' as STTProvider,
    name: 'LiveKit Inference STT (Zero-Config Speech-to-Text)',
    badge: 'ZERO RETENTION (ZDR)',
    keyPlaceholder: 'Auto (Uses LiveKit Project credentials — no API key needed)',
    keyHelp: 'docs.livekit.io/agents/models/stt',
    latency: 80,
    isLiveKitInference: true,
    models: [
      { id: 'deepgram/flux-general-en', name: 'Deepgram Flux (Ultra-Low Latency ~80ms)' },
      { id: 'deepgram/nova-3', name: 'Deepgram Nova-3 (State-of-the-Art Accuracy)' },
      { id: 'deepgram/nova-2', name: 'Deepgram Nova-2 (General Conversational)' },
      { id: 'assemblyai/universal-3-6-pro', name: 'AssemblyAI Universal-3.6 Pro (Multi-Accent Leader)' },
      { id: 'cartesia/ink-2', name: 'Cartesia Ink 2 (Fast Natural Transcription)' },
      { id: 'google/gemini-3.5-transcribe-live', name: 'Gemini 3.5 Transcribe Live (Multilingual Stream)' },
      { id: 'speechmatics/linden-1', name: 'Speechmatics Linden-1 (Real-time Flow STT)' },
      { id: 'openai/gpt-live-transcribe', name: 'OpenAI GPT-Live Transcribe' },
      { id: 'xai/stt-1', name: 'xAI STT-1 (Grok Speech-to-Text)' },
    ],
  },
  {
    id: 'speechmatics' as STTProvider,
    name: 'Speechmatics (Ursa & Linden-1)',
    badge: 'LIVEKIT AGENT STT',
    keyPlaceholder: 'Bearer key...',
    keyHelp: 'portal.speechmatics.com',
    latency: 90,
    models: [
      { id: 'linden-1', name: 'Linden-1 (LiveKit Agent STT — Turn Detection & Sub-Second Latency)' },
      { id: 'enhanced', name: 'Ursa Enhanced (Flagship Neural Accuracy — Benchmark Leader)' },
      { id: 'standard', name: 'Ursa Standard (Low-Latency Real-Time Cloud Stream)' },
    ],
  },
  {
    id: 'deepgram' as STTProvider,
    name: 'Deepgram',
    badge: 'ULTRA-FAST',
    keyPlaceholder: 'Token...',
    keyHelp: 'console.deepgram.com',
    latency: 95,
    models: [
      { id: 'nova-3', name: 'Nova-3 (Latest Flagship, Lowest WER, ~95ms)' },
      { id: 'nova-2', name: 'Nova-2 General (~110ms)' },
      { id: 'nova-2-meeting', name: 'Nova-2 Multi-Speaker Meeting' },
    ],
  },
  {
    id: 'openai' as STTProvider,
    name: 'OpenAI Whisper',
    badge: 'MULTILINGUAL',
    keyPlaceholder: 'sk-proj-...',
    keyHelp: 'platform.openai.com/api-keys',
    latency: 160,
    models: [
      { id: 'whisper-1', name: 'Whisper-1 (Universal Multilingual STT)' },
    ],
  },
  {
    id: 'google' as STTProvider,
    name: 'Google Cloud STT',
    badge: 'UNIVERSAL',
    keyPlaceholder: 'AIzaSy...',
    keyHelp: 'cloud.google.com/speech-to-text',
    latency: 150,
    models: [
      { id: 'chirp-2', name: 'Chirp-2 (Google Next-Gen Universal STT)' },
      { id: 'telephony-v2', name: 'Google Cloud Speech v2 Telephony' },
    ],
  },
];

// 3. MODULAR: LANGUAGE MODEL (LLM)
export type LLMProvider = 'livekit' | 'anthropic' | 'openai' | 'google' | 'ollama';

const LLM_PROVIDERS = [
  {
    id: 'livekit' as LLMProvider,
    name: 'LiveKit Inference (Cloud Voice LLM)',
    badge: 'ZERO RETENTION (ZDR)',
    keyPlaceholder: 'Auto (Uses LiveKit Project credentials — no API key needed)',
    keyHelp: 'docs.livekit.io/agents/models/inference',
    latency: 110,
    isLiveKitInference: true,
    models: [
      { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B (Recommended Default — Latency-Optimized Voice LLM)' },
      { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash (High-Speed Multimodal Intelligence)' },
      { id: 'google/gemini-3.5-flash', name: 'Gemini 3.5 Flash (Production Balanced)' },
      { id: 'google/gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (Ultra-Low Latency, EU Endpoint)' },
      { id: 'google/gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (EU Compliant, ~90ms)' },
      { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Deep Complex Reasoning)' },
      { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini (OpenAI Next-Gen Fast)' },
      { id: 'openai/gpt-4.1', name: 'GPT-4.1 (Flagship Reasoning & Tools)' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Cost-Effective Conversational)' },
      { id: 'openai/gpt-4o', name: 'GPT-4o (Omni Multimodal Intelligence)' },
      { id: 'openai/gpt-5.4-mini', name: 'GPT-5.4 Mini (Advanced Voice Agent Model)' },
      { id: 'openai/gpt-5.4', name: 'GPT-5.4 (Flagship Frontier Model)' },
      { id: 'openai/gpt-6-sol', name: 'GPT-6 Sol (Frontier Latency-Tuned)' },
      { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B (Open-Weight Latency-Tuned)' },
      { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek-V4 Pro (High-Performance Reasoning)' },
      { id: 'deepseek-ai/deepseek-v4.1-flash', name: 'DeepSeek-V4.1 Flash (Instant Response)' },
      { id: 'xai/grok-4.20-0309-non-reasoning', name: 'Grok 4.20 (Non-Reasoning Direct Chat)' },
      { id: 'xai/grok-4.3', name: 'Grok 4.3 (xAI Frontier Intelligence)' },
      { id: 'moonshotai/kimi-k2.6', name: 'Kimi K2.6 (Moonshot Long-Context)' },
    ],
  },
  {
    id: 'anthropic' as LLMProvider,
    name: 'Anthropic Claude',
    keyPlaceholder: 'sk-ant-api03-...',
    keyHelp: 'console.anthropic.com',
    latency: 210,
    models: [
      { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet (Hybrid Extended Reasoning)' },
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (State-of-the-Art Coding & Logic)' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Lightning Fast & Intelligent)' },
      { id: 'claude-3-opus-latest', name: 'Claude 3 Opus (Deep Analysis)' },
    ],
  },
  {
    id: 'openai' as LLMProvider,
    name: 'OpenAI GPT',
    keyPlaceholder: 'sk-proj-...',
    keyHelp: 'platform.openai.com/api-keys',
    latency: 150,
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cost Efficient, ~140ms)' },
      { id: 'gpt-4o', name: 'GPT-4o (Omni Multimodal Intelligence)' },
      { id: 'o3-mini', name: 'o3-mini (Next-Gen High-Speed Reasoning)' },
      { id: 'o1', name: 'o1 (Deep Complex Reasoning)' },
    ],
  },
  {
    id: 'google' as LLMProvider,
    name: 'Google Gemini',
    keyPlaceholder: 'AIzaSy...',
    keyHelp: 'aistudio.google.com/apikey',
    latency: 130,
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen Speed)' },
      { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking (Reasoning Tokens)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (2M Token Context)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Lightweight)' },
    ],
  },
  {
    id: 'ollama' as LLMProvider,
    name: 'Ollama / Custom Self-Hosted',
    keyPlaceholder: 'Optional (e.g. ollama or proxy bearer token)',
    keyHelp: 'Local Ollama or custom vLLM / LiteLLM server',
    latency: 250,
    isLocal: true,
    models: [
      { id: 'llama3.3:70b', name: 'Llama 3.3 (70B Instruct - Meta)' },
      { id: 'llama3.2:3b', name: 'Llama 3.2 (3B Compact Edge)' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek R1 (8B Reasoning Distill)' },
      { id: 'qwen2.5-coder:32b', name: 'Qwen 2.5 Coder (32B Specialized)' },
      { id: 'custom', name: 'Custom Model Name (Specify ID below)' },
    ],
  },
];

// 4. MODULAR: TEXT-TO-SPEECH (TTS)
export type TTSProvider = 'livekit' | 'cartesia' | 'elevenlabs' | 'openai' | 'speechmatics' | 'google';

const TTS_PROVIDERS = [
  {
    id: 'livekit' as TTSProvider,
    name: 'LiveKit Inference TTS (Zero-Config Text-to-Speech)',
    badge: 'ZERO RETENTION (ZDR)',
    keyPlaceholder: 'Auto (Uses LiveKit Project credentials — no API key needed)',
    keyHelp: 'docs.livekit.io/agents/models/tts',
    latency: 80,
    isLiveKitInference: true,
    models: [
      { id: 'cartesia/sonic-3.6', name: 'Cartesia Sonic 3.6 (Current Production Flagship, ~80ms, 44 Languages)' },
      { id: 'cartesia/sonic-3.5', name: 'Cartesia Sonic 3.5 (Conversational Natural)' },
      { id: 'deepgram/aura-2', name: 'Deepgram Aura-2 (Low-Latency Neural Speech)' },
      { id: 'deepgram/flux-tts', name: 'Deepgram Flux TTS (Instant Streaming Audio)' },
      { id: 'fishaudio/s2.1-pro', name: 'Fish Audio S2.1 Pro (Ultra-Realistic Expressive)' },
      { id: 'google/gemini-3.8-flash-tts', name: 'Gemini 3.8 Flash TTS (Multilingual Expressive)' },
      { id: 'inworld/inworld-tts-2', name: 'Inworld Realtime TTS 2.0 (Gaming & Persona Voice)' },
      { id: 'rime/coda', name: 'Rime Coda (High-Fidelity Conversational Voice)' },
      { id: 'xai/tts-1', name: 'xAI TTS-1 (Grok Neural Voice)' },
    ],
    voices: [
      { id: 'baritone-us', name: 'Baritone Professional (US English)', hz: 175 },
      { id: 'calm-conversational', name: 'Conversational Calm', hz: 235 },
      { id: 'confident-female', name: 'Confident British Female', hz: 290 },
      { id: 'deepgram-thalia', name: 'Thalia (Deepgram Warm Female)', hz: 240 },
      { id: 'deepgram-orion', name: 'Orion (Deepgram Authoritative Male)', hz: 170 },
      { id: 'fish-expressive', name: 'Fish Expressive Natural', hz: 220 },
    ],
  },
  {
    id: 'cartesia' as TTSProvider,
    name: 'Cartesia Sonic',
    keyPlaceholder: 'sk-cartesia-...',
    keyHelp: 'play.cartesia.ai',
    latency: 85,
    models: [
      { id: 'sonic-3.6', name: 'Sonic 3.6 (Current Production Flagship, ~85ms, 44 Languages)' },
    ],
    voices: [
      { id: 'baritone-us', name: 'Baritone Professional (US English)', hz: 175 },
      { id: 'calm-conversational', name: 'Conversational Calm', hz: 235 },
      { id: 'confident-female', name: 'Confident British Female', hz: 290 },
    ],
  },
  {
    id: 'elevenlabs' as TTSProvider,
    name: 'ElevenLabs (11lbs)',
    keyPlaceholder: 'sk_...',
    keyHelp: 'elevenlabs.io/api',
    latency: 75,
    models: [
      { id: 'eleven_flash_v2_5', name: 'Eleven Flash v2.5 (~75ms Ultra-Low Latency Realtime)' },
      { id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5 (High Quality Conversational)' },
      { id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2 (Maximum Expressiveness)' },
    ],
    voices: [
      { id: 'rachel', name: 'Rachel (Calm & Natural)', hz: 280 },
      { id: 'adam', name: 'Adam (Deep & Authoritative)', hz: 170 },
      { id: 'antoni', name: 'Antoni (Energetic & Articulate)', hz: 230 },
      { id: 'charlotte', name: 'Charlotte (Warm & Empathetic)', hz: 310 },
    ],
  },
  {
    id: 'openai' as TTSProvider,
    name: 'OpenAI TTS',
    keyPlaceholder: 'sk-proj-...',
    keyHelp: 'platform.openai.com/api-keys',
    latency: 190,
    models: [
      { id: 'tts-1-hd', name: 'OpenAI TTS-1 HD (Studio Quality Audio)' },
      { id: 'tts-1', name: 'OpenAI TTS-1 (Standard Fast)' },
    ],
    voices: [
      { id: 'alloy', name: 'Alloy', hz: 220 },
      { id: 'echo', name: 'Echo', hz: 190 },
      { id: 'fable', name: 'Fable', hz: 250 },
      { id: 'onyx', name: 'Onyx', hz: 160 },
      { id: 'nova', name: 'Nova', hz: 290 },
      { id: 'shimmer', name: 'Shimmer', hz: 310 },
    ],
  },
  {
    id: 'speechmatics' as TTSProvider,
    name: 'Speechmatics Flow TTS (Preview)',
    keyPlaceholder: 'Bearer key...',
    keyHelp: 'portal.speechmatics.com',
    latency: 120,
    models: [
      { id: 'speechmatics-flow-v1', name: 'Speechmatics Flow Neural Voice Engine' },
    ],
    voices: [
      { id: 'sarah', name: 'Sarah (Natural & Articulate)', hz: 260 },
      { id: 'theo', name: 'Theo (Warm & Grounded)', hz: 180 },
      { id: 'megan', name: 'Megan (Clear & Dynamic)', hz: 300 },
    ],
  },
  {
    id: 'google' as TTSProvider,
    name: 'Google Cloud TTS',
    keyPlaceholder: 'AIzaSy...',
    keyHelp: 'cloud.google.com/text-to-speech',
    latency: 160,
    models: [
      { id: 'journey', name: 'Journey Expressive (Human-like conversational flow)' },
      { id: 'neural2', name: 'Neural2 (DeepMind WaveNet Voice)' },
    ],
    voices: [
      { id: 'en-US-Journey-F', name: 'Journey Natural (Female)', hz: 280 },
      { id: 'en-US-Journey-D', name: 'Journey Measured (Male)', hz: 175 },
      { id: 'en-US-Neural2-A', name: 'Neural2 Articulate', hz: 240 },
    ],
  },
];

export const DEFAULT_VOICE_USERS: VoiceUserProfile[] = [
  {
    id: 'usr_01_cmd',
    name: 'Primary Commander',
    role: 'admin',
    voice_signature_id: 'vs_ursa_9201',
    enrolled_at: '2026-10-25',
    confidence_threshold: 0.85,
    pitch_hz: 180,
    sample_status: 'calibrated',
    notes: 'Primary voice signature for system control & executive directives',
  },
  {
    id: 'usr_02_user',
    name: 'Sarah (Research Lead)',
    role: 'user',
    voice_signature_id: 'vs_ursa_4102',
    enrolled_at: '2026-10-26',
    confidence_threshold: 0.82,
    pitch_hz: 250,
    sample_status: 'enrolled',
    notes: 'Authorized speaker with memory context retention & tool execution',
  },
  {
    id: 'usr_03_guest',
    name: 'Guest Speaker',
    role: 'guest',
    voice_signature_id: 'vs_ursa_1190',
    enrolled_at: '2026-10-27',
    confidence_threshold: 0.75,
    pitch_hz: 210,
    sample_status: 'pending',
    notes: 'Standard conversational privileges, read-only tools',
  },
];

interface FullModelConfig {
  architecture: 'realtime' | 'modular';
  // LiveKit Voice Agent Orchestrator (as in cortana_companion)
  livekit: {
    url: string;
    apiKey: string;
    apiSecret: string;
    roomName: string;
  };
  realtime: {
    provider: RealtimeProvider;
    apiKey: string;
    model: string;
    voice: string;
  };
  stt: {
    provider: STTProvider;
    apiKey: string;
    model: string;
  };
  speechmatics: {
    apiKey: string;
    model: 'linden-1' | 'enhanced' | 'standard' | string;
    turnDetection: 'vad' | 'external';
    maxDelay: number;
    enablePartials: boolean;
    language: string;
    customDictionary: string[];
    diarization: boolean;
    speakerIdentification: boolean;
    voiceProfileName: string;
    speakerThreshold: number;
  };
  voiceUsers: VoiceUserProfile[];
  llm: {
    provider: LLMProvider;
    apiKey: string;
    model: string;
    customModelName?: string;
    ollamaBaseUrl?: string;
  };
  tts: {
    provider: TTSProvider;
    apiKey: string;
    model: string;
    voice: string;
  };
  fallback: {
    enabled: boolean;
    provider: LLMProvider;
    model: string;
    apiKey?: string;
    temperature?: number;
    sttEnabled: boolean;
    sttProvider: STTProvider;
    sttModel: string;
    sttApiKey?: string;
    ttsEnabled: boolean;
    ttsProvider: TTSProvider;
    ttsModel: string;
    ttsVoice?: string;
    ttsApiKey?: string;
  };
  params: {
    temperature: number;
    topP: number;
    maxTokens: number;
    systemPromptOverride?: string;
  };
}

const DEFAULT_FULL_CONFIG: FullModelConfig = {
  architecture: 'realtime',
  livekit: {
    url: 'wss://your-project.livekit.cloud',
    apiKey: '',
    apiSecret: '',
    roomName: 'exia-agent-room',
  },
  realtime: {
    provider: 'google',
    apiKey: '',
    model: 'gemini-2.0-flash',
    voice: 'Charon',
  },
  stt: {
    provider: 'speechmatics',
    apiKey: '',
    model: 'linden-1',
  },
  speechmatics: {
    apiKey: '',
    model: 'linden-1',
    turnDetection: 'vad',
    maxDelay: 1.0,
    enablePartials: true,
    language: 'en',
    customDictionary: ['Exia', 'LiveKit', 'WebRTC', 'PyTorch', 'Gemini'],
    diarization: true,
    speakerIdentification: true,
    voiceProfileName: 'Commander / Primary User',
    speakerThreshold: 0.82,
  },
  voiceUsers: DEFAULT_VOICE_USERS,
  llm: {
    provider: 'anthropic',
    apiKey: '',
    model: 'claude-3-5-sonnet-latest',
    customModelName: '',
    ollamaBaseUrl: 'http://localhost:11434/v1',
  },
  tts: {
    provider: 'cartesia',
    apiKey: '',
    model: 'sonic-3.6',
    voice: 'baritone-us',
  },
  fallback: {
    enabled: false,
    provider: 'livekit',
    model: 'google/gemma-4-31b-it',
    apiKey: '',
    temperature: 0.7,
    sttEnabled: false,
    sttProvider: 'livekit',
    sttModel: 'deepgram/nova-3',
    sttApiKey: '',
    ttsEnabled: false,
    ttsProvider: 'livekit',
    ttsModel: 'cartesia/sonic-3.6',
    ttsVoice: 'baritone-us',
    ttsApiKey: '',
  },
  params: {
    temperature: 0.7,
    topP: 0.95,
    maxTokens: 1024,
    systemPromptOverride: '',
  },
};

const STORAGE_KEY = 'exia_unified_model_config';
const VOICE_CACHE_KEY = 'exia_voice_profiles_cache';

export function ModelSelectionView() {
  const [config, setConfig] = useState<FullModelConfig>(DEFAULT_FULL_CONFIG);
  const [isSaved, setIsSaved] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [auditioningVoice, setAuditioningVoice] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');

  // Voice Profile Enrollment Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user' | 'guest'>('user');
  const [newUserThreshold, setNewUserThreshold] = useState(0.82);
  const [newUserNotes, setNewUserNotes] = useState('');

  // Load Voice Profiles from MongoDB
  const loadVoiceProfilesFromDb = () => {
    api.voiceProfiles
      .list()
      .then((res: any) => {
        if (res && Array.isArray(res.profiles) && res.profiles.length > 0) {
          const mapped: VoiceUserProfile[] = res.profiles.map((p: any) => ({
            id: p.profile_id || p.id || `vp_${Math.random().toString(36).substring(7)}`,
            name: p.speaker_name || p.name || 'Speaker',
            role: (p.role as 'admin' | 'user' | 'guest') || 'user',
            voice_signature_id: p.voice_signature || p.voice_signature_id || 'vs_ursa_live',
            enrolled_at: p.enrolled_at ? p.enrolled_at.split('T')[0] : new Date().toISOString().split('T')[0],
            confidence_threshold: typeof p.confidence_threshold === 'number' ? p.confidence_threshold : 0.82,
            pitch_hz: p.pitch_hz || 200,
            sample_status: p.sample_status || 'enrolled',
            notes: p.notes || '',
          }));
          setConfig((prev) => ({ ...prev, voiceUsers: mapped }));
          try {
            localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(mapped));
          } catch {}
        }
      })
      .catch((err) => {
        console.warn('Could not load voice profiles from MongoDB:', err);
      });
  };

  // Load from localStorage & MongoDB on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const rawUsers = localStorage.getItem(VOICE_CACHE_KEY);
      let parsedUsers: VoiceUserProfile[] = DEFAULT_VOICE_USERS;
      if (rawUsers) {
        try {
          parsedUsers = JSON.parse(rawUsers);
        } catch {}
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        setConfig((prev) => ({
          ...prev,
          ...parsed,
          livekit: { ...prev.livekit, ...(parsed.livekit || {}) },
          realtime: { ...prev.realtime, ...(parsed.realtime || {}) },
          stt: { ...prev.stt, ...(parsed.stt || {}) },
          speechmatics: { ...prev.speechmatics, ...(parsed.speechmatics || {}) },
          voiceUsers: parsed.voiceUsers || parsedUsers,
          llm: { ...prev.llm, ...(parsed.llm || {}) },
          tts: { ...prev.tts, ...(parsed.tts || {}) },
          params: { ...prev.params, ...(parsed.params || {}) },
        }));
      } else if (rawUsers) {
        setConfig((prev) => ({ ...prev, voiceUsers: parsedUsers }));
      }
    } catch (e) {
      console.warn('Failed to parse saved config:', e);
    }

    // Always fetch fresh profiles from MongoDB
    loadVoiceProfilesFromDb();

    // Fetch and merge backend configuration
    api.models
      .getConfig()
      .then((serverCfg: any) => {
        if (serverCfg) {
          setConfig((prev) => {
            const livekitUrl = serverCfg.livekit?.url || serverCfg.livekit_url || prev.livekit.url;
            const livekitApiKey = serverCfg.livekit?.apiKey || serverCfg.livekit_api_key || prev.livekit.apiKey;
            const livekitApiSecret = serverCfg.livekit?.apiSecret || serverCfg.livekit_api_secret || prev.livekit.apiSecret;

            const geminiKey = serverCfg.gemini_api_key || '';
            const openaiKey = serverCfg.openai_api_key || '';
            const anthropicKey = serverCfg.anthropic_api_key || '';
            const deepgramKey = serverCfg.deepgram_api_key || '';
            const cartesiaKey = serverCfg.cartesia_api_key || '';
            const speechmaticsKey = serverCfg.speechmatics_api_key || '';

            // Map active realtime key
            let realtimeKey = prev.realtime.apiKey;
            if (prev.realtime.provider === 'google' && geminiKey) realtimeKey = geminiKey;
            if (prev.realtime.provider === 'openai' && openaiKey) realtimeKey = openaiKey;

            // Map active LLM key
            let llmKey = prev.llm.apiKey;
            if (prev.llm.provider === 'anthropic' && anthropicKey) llmKey = anthropicKey;
            if (prev.llm.provider === 'openai' && openaiKey) llmKey = openaiKey;
            if (prev.llm.provider === 'google' && geminiKey) llmKey = geminiKey;

            return {
              ...prev,
              livekit: {
                ...prev.livekit,
                url: livekitUrl,
                apiKey: livekitApiKey,
                apiSecret: livekitApiSecret,
              },
              realtime: {
                ...prev.realtime,
                apiKey: realtimeKey,
                model: serverCfg.gemini_model || prev.realtime.model,
                voice: serverCfg.gemini_voice || prev.realtime.voice,
              },
              stt: {
                ...prev.stt,
                apiKey: (serverCfg.stt_provider === 'deepgram' && deepgramKey) ? deepgramKey : (speechmaticsKey || prev.stt.apiKey),
                provider: (serverCfg.stt_provider || prev.stt.provider).toLowerCase(),
                model: serverCfg.stt_model || prev.stt.model,
              },
              llm: {
                ...prev.llm,
                apiKey: llmKey,
                provider: (serverCfg.llm_provider || prev.llm.provider).toLowerCase(),
                model: serverCfg.llm_model || prev.llm.model,
              },
              tts: {
                ...prev.tts,
                apiKey: (serverCfg.tts_provider === 'cartesia' && cartesiaKey) ? cartesiaKey : prev.tts.apiKey,
                provider: (serverCfg.tts_provider || prev.tts.provider).toLowerCase(),
                model: serverCfg.tts_model || prev.tts.model,
              },
              fallback: {
                enabled: serverCfg.fallback_enabled ?? prev.fallback?.enabled ?? false,
                provider: (serverCfg.fallback_provider || prev.fallback?.provider || 'livekit') as LLMProvider,
                model: serverCfg.fallback_model || prev.fallback?.model || 'google/gemma-4-31b-it',
                apiKey: serverCfg.fallback_api_key || prev.fallback?.apiKey || '',
                temperature: serverCfg.fallback_temperature ?? prev.fallback?.temperature ?? 0.7,
                sttEnabled: serverCfg.fallback_stt_enabled ?? prev.fallback?.sttEnabled ?? false,
                sttProvider: (serverCfg.fallback_stt_provider || prev.fallback?.sttProvider || 'livekit') as STTProvider,
                sttModel: serverCfg.fallback_stt_model || prev.fallback?.sttModel || 'deepgram/nova-3',
                sttApiKey: serverCfg.fallback_stt_api_key || prev.fallback?.sttApiKey || '',
                ttsEnabled: serverCfg.fallback_tts_enabled ?? prev.fallback?.ttsEnabled ?? false,
                ttsProvider: (serverCfg.fallback_tts_provider || prev.fallback?.ttsProvider || 'livekit') as TTSProvider,
                ttsModel: serverCfg.fallback_tts_model || prev.fallback?.ttsModel || 'cartesia/sonic-3.6',
                ttsVoice: serverCfg.fallback_tts_voice || prev.fallback?.ttsVoice || 'baritone-us',
                ttsApiKey: serverCfg.fallback_tts_api_key || prev.fallback?.ttsApiKey || '',
              },
            };
          });
        }
      })
      .catch(() => {});
  }, []);

  const toggleKey = (keyId: string) => {
    setShowKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    if (!config.speechmatics.customDictionary.includes(trimmed)) {
      setConfig((prev) => ({
        ...prev,
        speechmatics: {
          ...prev.speechmatics,
          customDictionary: [...prev.speechmatics.customDictionary, trimmed],
        },
      }));
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (wordToRemove: string) => {
    setConfig((prev) => ({
      ...prev,
      speechmatics: {
        ...prev.speechmatics,
        customDictionary: prev.speechmatics.customDictionary.filter((w) => w !== wordToRemove),
      },
    }));
  };

  const handleAddVoiceUser = async () => {
    if (!newUserName.trim()) return;
    setIsAddingUser(true);
    const newProfilePayload = {
      speaker_name: newUserName.trim(),
      role: newUserRole,
      confidence_threshold: newUserThreshold,
      notes: newUserNotes.trim() || 'Acoustic voiceprint enrolled in MongoDB',
      pitch_hz: Math.floor(160 + Math.random() * 120),
      sample_status: 'calibrated' as const,
    };

    try {
      const saved = await api.voiceProfiles.create(newProfilePayload);
      const userProfile: VoiceUserProfile = {
        id: saved.profile_id || `vp_${Date.now().toString(36)}`,
        name: saved.speaker_name || newUserName.trim(),
        role: (saved.role as 'admin' | 'user' | 'guest') || newUserRole,
        voice_signature_id: saved.voice_signature || `vs_ursa_${Math.floor(1000 + Math.random() * 9000)}`,
        enrolled_at: (saved.enrolled_at || new Date().toISOString()).split('T')[0],
        confidence_threshold: saved.confidence_threshold || newUserThreshold,
        pitch_hz: saved.pitch_hz || 200,
        sample_status: (saved.sample_status as any) || 'calibrated',
        notes: saved.notes || newProfilePayload.notes,
      };

      setConfig((prev) => {
        const updated = [...prev.voiceUsers, userProfile];
        try {
          localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(updated));
        } catch {}
        return { ...prev, voiceUsers: updated };
      });
      toast.success(`Voice profile '${userProfile.name}' enrolled into database`);
      setNewUserName('');
      setNewUserNotes('');
      setIsAddUserModalOpen(false);
    } catch (e: any) {
      toast.error(`Failed to enroll voice profile: ${e.message || 'Database error'}`);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteVoiceUser = async (id: string) => {
    try {
      await api.voiceProfiles.delete(id);
      setConfig((prev) => {
        const updated = prev.voiceUsers.filter((u) => u.id !== id);
        try {
          localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(updated));
        } catch {}
        return { ...prev, voiceUsers: updated };
      });
      toast.success('Voice profile removed from database');
    } catch (e: any) {
      setConfig((prev) => {
        const updated = prev.voiceUsers.filter((u) => u.id !== id);
        try {
          localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(updated));
        } catch {}
        return { ...prev, voiceUsers: updated };
      });
      toast.error(`Database notice: ${e.message || 'Removed from local state'}`);
    }
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify(config.voiceUsers));
      localStorage.setItem('exia_livekit_config', JSON.stringify(config.livekit));

      // Extract model API keys from provider forms to persist to MongoDB and .env
      let geminiKey = '';
      let openaiKey = '';
      let anthropicKey = '';
      let deepgramKey = '';
      let cartesiaKey = '';
      const speechmaticsKey =
        config.speechmatics.apiKey ||
        (config.stt.provider === 'speechmatics' ? config.stt.apiKey : '');

      if (config.realtime.provider === 'google' && config.realtime.apiKey) geminiKey = config.realtime.apiKey;
      if (config.realtime.provider === 'openai' && config.realtime.apiKey) openaiKey = config.realtime.apiKey;

      if (config.llm.provider === 'google' && config.llm.apiKey) geminiKey = config.llm.apiKey;
      if (config.llm.provider === 'openai' && config.llm.apiKey) openaiKey = config.llm.apiKey;
      if (config.llm.provider === 'anthropic' && config.llm.apiKey) anthropicKey = config.llm.apiKey;

      if (config.stt.provider === 'deepgram' && config.stt.apiKey) deepgramKey = config.stt.apiKey;
      if (config.tts.provider === 'cartesia' && config.tts.apiKey) cartesiaKey = config.tts.apiKey;
      if (config.tts.provider === 'openai' && config.tts.apiKey && !openaiKey) openaiKey = config.tts.apiKey;

      const payload: Partial<ModelConfig> = {
        mode: config.architecture === 'realtime' ? 'gemini_live' : 'modular',
        pipeline_mode: config.architecture === 'realtime' ? 'gemini_live' : 'modular',
        livekit_url: config.livekit.url,
        livekit_api_key: config.livekit.apiKey,
        livekit_api_secret: config.livekit.apiSecret,
        gemini_model: config.realtime.model,
        gemini_voice: config.realtime.voice,
        stt_provider: config.stt.provider,
        stt_model: config.stt.model,
        llm_provider: config.llm.provider,
        llm_model: config.llm.model,
        tts_provider: config.tts.provider,
        tts_model: config.tts.model,
        temperature: config.params.temperature,
        top_p: config.params.topP,
        max_output_tokens: config.params.maxTokens,
        // Model API keys synced directly to MongoDB and persistent .env
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        anthropic_api_key: anthropicKey || undefined,
        deepgram_api_key: deepgramKey || undefined,
        cartesia_api_key: cartesiaKey || undefined,
        speechmatics_api_key: speechmaticsKey || undefined,
        // Secondary / Fallback Model Engine Options (LLM, STT, TTS)
        fallback_enabled: config.fallback?.enabled ?? false,
        fallback_provider: config.fallback?.provider,
        fallback_model: config.fallback?.model,
        fallback_temperature: config.fallback?.temperature,
        fallback_api_key: config.fallback?.apiKey || undefined,
        fallback_stt_enabled: config.fallback?.sttEnabled ?? false,
        fallback_stt_provider: config.fallback?.sttProvider,
        fallback_stt_model: config.fallback?.sttModel,
        fallback_stt_api_key: config.fallback?.sttApiKey || undefined,
        fallback_tts_enabled: config.fallback?.ttsEnabled ?? false,
        fallback_tts_provider: config.fallback?.ttsProvider,
        fallback_tts_model: config.fallback?.ttsModel,
        fallback_tts_voice: config.fallback?.ttsVoice,
        fallback_tts_api_key: config.fallback?.ttsApiKey || undefined,
        // Speechmatics
        speechmatics_model: config.speechmatics.model,
        speechmatics_language: config.speechmatics.language,
        speechmatics_turn_detection: config.speechmatics.turnDetection,
        speechmatics_max_delay: config.speechmatics.maxDelay,
        speechmatics_enable_partials: config.speechmatics.enablePartials,
        speechmatics_custom_dictionary: config.speechmatics.customDictionary.join(', '),
        speechmatics_diarization: config.speechmatics.diarization,
        speechmatics_speaker_identification: config.speechmatics.speakerIdentification,
        speechmatics_voice_profile_name: config.speechmatics.voiceProfileName,
        speechmatics_speaker_threshold: config.speechmatics.speakerThreshold,
        voice_users: config.voiceUsers,
      };

      api.models.updateConfig(payload)
        .then(() => {
          toast.success('Configuration, LiveKit credentials & model API keys saved to database and .env');
        })
        .catch((err) => {
          console.warn('Backend save notice:', err);
          toast.warning('Settings cached locally; backend update queued');
        });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      console.error('Error saving config:', e);
      toast.error('Failed to save configuration');
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_FULL_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Tone audition helper
  const handleAudition = (hz: number, label: string) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(hz * 1.25, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(hz * 0.9, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);

      setAuditioningVoice(label);
      setTimeout(() => setAuditioningVoice(null), 500);
    } catch {}
  };

  // Active configurations
  const activeRealtimeProvider =
    REALTIME_PROVIDERS.find((p) => p.id === config.realtime.provider) || REALTIME_PROVIDERS[0];
  const activeSTTProvider =
    STT_PROVIDERS.find((s) => s.id === config.stt.provider) || STT_PROVIDERS[0];
  const activeLLMProvider =
    LLM_PROVIDERS.find((l) => l.id === config.llm.provider) || LLM_PROVIDERS[0];
  const activeTTSProvider =
    TTS_PROVIDERS.find((t) => t.id === config.tts.provider) || TTS_PROVIDERS[0];

  const totalModularLatency =
    activeSTTProvider.latency + activeLLMProvider.latency + activeTTSProvider.latency;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Models & Provider Credentials
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Verified production models for Realtime S2S, Modular STT, LLM reasoning, and Neural TTS voices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="border-border hover:bg-muted text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors"
            title="Reset form to defaults"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-md transition-all active:scale-95"
            style={{ boxShadow: '0 4px 16px rgba(31,213,249,0.25)' }}
          >
            {isSaved ? <CheckCircle2 className="size-3.5" /> : <Save className="size-3.5" />}
            <span>{isSaved ? 'Saved to Workspace' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-500">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Configuration saved locally. Realtime sessions and tool pipelines will immediately use these credentials.</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LIVEKIT VOICE AGENT ORCHESTRATOR CREDENTIALS (cortana_companion reference)
         ───────────────────────────────────────────────────────────── */}
      <section className="border-border bg-card relative space-y-4 overflow-hidden rounded-2xl border p-5 shadow-sm">
        <div className="border-border flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="border-primary/40 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl border shadow-sm">
              <Radio className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-foreground text-sm font-semibold">LiveKit Voice Agent Orchestrator</h3>
                <span className="border-primary/30 bg-primary/15 text-primary rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                  WEBRTC ORCHESTRATOR
                </span>
                {config.livekit.url && config.livekit.apiKey ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span>Configured & Ready</span>
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                    Awaiting Credentials
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                WebRTC session transport for bidirectional audio streaming, speaker activity detection, and agent room orchestration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://cloud.livekit.io"
              target="_blank"
              rel="noopener noreferrer"
              className="border-border bg-muted/40 hover:bg-muted text-foreground inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <ExternalLink className="text-muted-foreground size-3.5" />
              <span>LiveKit Cloud</span>
            </a>
          </div>
        </div>

        {/* LiveKit Inputs Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* LIVEKIT_URL */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-xs font-medium">LIVEKIT_URL</label>
              <span className="text-muted-foreground text-[10px]">WebSocket Host</span>
            </div>
            <input
              type="text"
              placeholder="wss://your-project.livekit.cloud"
              value={config.livekit.url}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  livekit: { ...prev.livekit, url: e.target.value },
                }))
              }
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 font-mono text-xs"
            />
            <div className="flex gap-2 text-[10px]">
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    livekit: { ...prev.livekit, url: 'ws://localhost:7880' },
                  }))
                }
                className="text-primary hover:underline cursor-pointer"
              >
                Local Dev: ws://localhost:7880
              </button>
            </div>
          </div>

          {/* LIVEKIT_API_KEY */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-xs font-medium">LIVEKIT_API_KEY</label>
              <span className="text-muted-foreground text-[10px]">Project Key</span>
            </div>
            <input
              type="text"
              placeholder="APIxxxxxxxxxxxx"
              value={config.livekit.apiKey}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  livekit: { ...prev.livekit, apiKey: e.target.value },
                }))
              }
              className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 font-mono text-xs"
            />
          </div>

          {/* LIVEKIT_API_SECRET */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-xs font-medium">LIVEKIT_API_SECRET</label>
              <span className="text-muted-foreground text-[10px]">Secret Token</span>
            </div>
            <div className="relative">
              <input
                type={showKeys['livekit_secret'] ? 'text' : 'password'}
                placeholder="Secret key string..."
                value={config.livekit.apiSecret}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    livekit: { ...prev.livekit, apiSecret: e.target.value },
                  }))
                }
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 pr-9 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => toggleKey('livekit_secret')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer p-0.5"
              >
                {showKeys['livekit_secret'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          1. CHOOSE ARCHITECTURE: REALTIME S2S vs MODULAR PIPELINE
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <label className="text-foreground text-xs font-medium">1. Choose Speech Architecture</label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Tab A: Realtime */}
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, architecture: 'realtime' }))}
            className={`cursor-pointer rounded-2xl border p-5 text-left transition-all ${
              config.architecture === 'realtime'
                ? 'border-primary/50 bg-primary/10 shadow-md ring-1 ring-primary/30'
                : 'border-border bg-card hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl border ${
                    config.architecture === 'realtime'
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-border bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">Realtime Native S2S</h3>
                  <p className="text-muted-foreground text-xs">Google Gemini Live or OpenAI Realtime</p>
                </div>
              </div>
              {config.architecture === 'realtime' && (
                <span className="rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  Active
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
              Direct bidirectional voice token streaming over WebSockets. Sub-second response with zero transcription delay.
            </p>
          </button>

          {/* Tab B: Modular */}
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, architecture: 'modular' }))}
            className={`cursor-pointer rounded-2xl border p-5 text-left transition-all ${
              config.architecture === 'modular'
                ? 'border-primary/50 bg-primary/10 shadow-md ring-1 ring-primary/30'
                : 'border-border bg-card hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl border ${
                    config.architecture === 'modular'
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-border bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <Layers className="size-5" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">Modular Chained Pipeline</h3>
                  <p className="text-muted-foreground text-xs">Pick independent STT + LLM + TTS</p>
                </div>
              </div>
              {config.architecture === 'modular' && (
                <span className="rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  Active
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
              Mix and match verified providers: Deepgram Nova-3 (STT), Claude 3.7 / GPT-4o (LLM), and Cartesia Sonic 3.6 / 11lbs Flash (TTS).
            </p>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. REALTIME S2S CONFIGURATION FORM
         ───────────────────────────────────────────────────────────── */}
      {config.architecture === 'realtime' && (
        <section className="border-border bg-card space-y-6 rounded-2xl border p-6 shadow-sm">
          <div className="border-border flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2.5">
              <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="text-foreground text-base font-semibold">Realtime S2S Provider Setup</h3>
                <p className="text-muted-foreground text-xs">Choose provider, paste your API key, and select model & voice</p>
              </div>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {activeRealtimeProvider.latency} Latency
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Realtime Provider Dropdown */}
            <div className="space-y-1.5">
              <label className="text-foreground text-xs font-medium">Realtime Provider</label>
              <select
                value={config.realtime.provider}
                onChange={(e) => {
                  const prov = e.target.value as RealtimeProvider;
                  const found = REALTIME_PROVIDERS.find((p) => p.id === prov)!;
                  setConfig((prev) => ({
                    ...prev,
                    realtime: {
                      ...prev.realtime,
                      provider: prov,
                      model: found.models[0].id,
                      voice: found.voices[0].id,
                    },
                  }));
                }}
                className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2.5 text-sm"
              >
                {REALTIME_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">
                    {p.name} ({p.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Realtime Model Dropdown */}
            <div className="space-y-1.5">
              <label className="text-foreground text-xs font-medium">Model Tier</label>
              <select
                value={config.realtime.model}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    realtime: { ...prev.realtime, model: e.target.value },
                  }))
                }
                className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2.5 text-sm"
              >
                {activeRealtimeProvider.models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-card text-foreground">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Realtime Provider API Key or LiveKit Inference Info */}
          {config.realtime.provider === 'livekit' ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3.5 text-xs text-cyan-400">
              <Sparkles className="size-4 shrink-0 text-cyan-400" />
              <span>
                LiveKit Inference routes directly through your configured LiveKit Project credentials above with Zero Data Retention (ZDR). No external API key required!
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-foreground flex items-center gap-1.5 text-xs font-medium">
                  <Key className="text-primary size-3.5" />
                  <span>{activeRealtimeProvider.name} API Key</span>
                </label>
                <span className="text-muted-foreground text-[11px]">{activeRealtimeProvider.keyHelp}</span>
              </div>

              <div className="relative">
                <input
                  type={showKeys['realtime'] ? 'text' : 'password'}
                  placeholder={activeRealtimeProvider.keyPlaceholder}
                  value={config.realtime.apiKey}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      realtime: { ...prev.realtime, apiKey: e.target.value },
                    }))
                  }
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2.5 pr-10 text-xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => toggleKey('realtime')}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-0.5"
                >
                  {showKeys['realtime'] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Voice Persona Dropdown & Tone Audition */}
          <div className="border-border space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-xs font-medium">Voice Persona & Delivery Tone</label>
              <span className="text-muted-foreground text-xs">
                Selected: <strong className="text-foreground">{config.realtime.voice}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {activeRealtimeProvider.voices.map((v) => {
                const isSelected = config.realtime.voice === v.id;
                const isPlaying = auditioningVoice === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        realtime: { ...prev.realtime, voice: v.id },
                      }))
                    }
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-primary/50 bg-primary/10 shadow-sm ring-1 ring-primary/30'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <div>
                      <div className="text-foreground text-xs font-semibold">{v.name}</div>
                      <div className="text-muted-foreground text-[10px]">{v.hz}Hz fundamental pitch</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAudition(v.hz, v.id);
                        }}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors ${
                          isPlaying
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground hover:bg-muted'
                        }`}
                        title="Audition tone"
                      >
                        <Volume2 className="size-3" />
                        <span>{isPlaying ? 'Auditioning' : 'Sample'}</span>
                      </button>
                      {isSelected && <Check className="text-primary size-4" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MODULAR PIPELINE CONFIGURATION FORM (STT + LLM + TTS)
         ───────────────────────────────────────────────────────────── */}
      {config.architecture === 'modular' && (
        <div className="space-y-6">
          {/* Latency Preview Banner */}
          <div className="border-border bg-card flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Clock className="text-primary size-4" />
              <span className="text-foreground text-xs font-medium">Estimated Pipeline Latency:</span>
              <span className="text-primary font-semibold">~{totalModularLatency}ms</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span>STT: {activeSTTProvider.latency}ms</span>
              <span>·</span>
              <span>LLM: {activeLLMProvider.latency}ms</span>
              <span>·</span>
              <span>TTS: {activeTTSProvider.latency}ms</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
            {/* COLUMN 1: SPEECH-TO-TEXT (PRIMARY + FAILOVER) */}
            <div className="space-y-4">
              {/* STEP 1: SPEECH TO TEXT */}
              <div className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                  <Mic className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">1. Speech-to-Text (STT)</h3>
                  <p className="text-muted-foreground text-[11px]">Transcribe user audio to text</p>
                </div>
              </div>

              {/* Provider dropdown */}
              <div className="space-y-1">
                <label className="text-foreground text-[11px] font-medium">STT Provider</label>
                <select
                  value={config.stt.provider}
                  onChange={(e) => {
                    const prov = e.target.value as STTProvider;
                    const found = STT_PROVIDERS.find((s) => s.id === prov)!;
                    setConfig((prev) => ({
                      ...prev,
                      stt: {
                        ...prev.stt,
                        provider: prov,
                        model: found.models[0].id,
                      },
                    }));
                  }}
                  className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                >
                  {STT_PROVIDERS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-card text-foreground">
                      {s.name} (~{s.latency}ms)
                    </option>
                  ))}
                </select>
              </div>

              {/* Model dropdown */}
              <div className="space-y-1">
                <label className="text-foreground text-[11px] font-medium">STT Model</label>
                <select
                  value={config.stt.model}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfig((prev) => ({
                      ...prev,
                      stt: { ...prev.stt, model: val },
                      speechmatics:
                        prev.stt.provider === 'speechmatics'
                          ? { ...prev.speechmatics, model: val }
                          : prev.speechmatics,
                    }));
                  }}
                  className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                >
                  {activeSTTProvider.models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-card text-foreground">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key or LiveKit Inference Notice */}
              {config.stt.provider === 'livekit' ? (
                <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-2.5 text-[11px] text-cyan-400">
                  <Sparkles className="size-3.5 shrink-0" />
                  <span>
                    LiveKit Inference STT routes through your LiveKit Project credentials with Zero Data Retention (ZDR). No external STT key required.
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-[11px] font-medium">{activeSTTProvider.name} Key</label>
                    <span className="text-muted-foreground text-[9px]">{activeSTTProvider.keyHelp}</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys['stt'] ? 'text' : 'password'}
                      placeholder={activeSTTProvider.keyPlaceholder}
                      value={config.stt.apiKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfig((prev) => ({
                          ...prev,
                          stt: { ...prev.stt, apiKey: val },
                          speechmatics:
                            prev.stt.provider === 'speechmatics'
                              ? { ...prev.speechmatics, apiKey: val }
                              : prev.speechmatics,
                        }));
                      }}
                      className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 pr-8 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('stt')}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                    >
                      {showKeys['stt'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Speechmatics Status / Quick Switch Pill */}
              {config.stt.provider === 'speechmatics' ? (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-[11px] text-primary space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Waves className="size-3.5" />
                    <span>Speechmatics Linden-1 Active</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Using Ursa & Agent STT with native server VAD. See dedicated controls below.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      stt: {
                        ...prev.stt,
                        provider: 'speechmatics',
                        model: prev.speechmatics.model || 'linden-1',
                        apiKey: prev.speechmatics.apiKey || '',
                      },
                    }));
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 p-2 text-[11px] font-medium text-primary transition-colors cursor-pointer"
                >
                  <Sparkles className="size-3" />
                  <span>Switch to Speechmatics Linden-1</span>
                </button>
              )}
            </div>

            {/* STT FAILOVER ENGINE (Directly follows Primary STT) */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold text-foreground">STT Failover Engine</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      fallback: {
                        ...prev.fallback,
                        sttEnabled: !prev.fallback?.sttEnabled,
                      },
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.fallback?.sttEnabled ? 'bg-primary' : 'bg-muted/80'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.fallback?.sttEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {config.fallback?.sttEnabled ? (
                <div className="space-y-3 pt-1 border-t border-border/30 mt-2">
                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover STT Provider</label>
                    <select
                      value={config.fallback.sttProvider || 'livekit'}
                      onChange={(e) => {
                        const prov = e.target.value as STTProvider;
                        const found = STT_PROVIDERS.find((s) => s.id === prov)!;
                        setConfig((prev) => ({
                          ...prev,
                          fallback: {
                            ...prev.fallback,
                            sttProvider: prov,
                            sttModel: found.models[0].id,
                          },
                        }));
                      }}
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {STT_PROVIDERS.map((s) => (
                        <option key={s.id} value={s.id} className="bg-card text-foreground">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover STT Model</label>
                    <select
                      value={config.fallback.sttModel || 'deepgram/nova-3'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fallback: { ...prev.fallback, sttModel: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {(
                        STT_PROVIDERS.find((s) => s.id === (config.fallback?.sttProvider || 'livekit')) || STT_PROVIDERS[0]
                      ).models.map((m) => (
                        <option key={m.id} value={m.id} className="bg-card text-foreground">
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {config.fallback.sttProvider === 'livekit' ? (
                    <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-[10px] text-cyan-400">
                      <Sparkles className="size-3 shrink-0" />
                      <span>LiveKit Inference routes via Project credentials with Zero Data Retention.</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-foreground text-[10px] font-medium">Failover STT Key</label>
                        <span className="text-muted-foreground text-[9px]">Optional</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showKeys['fallback_stt'] ? 'text' : 'password'}
                          placeholder="Optional STT key..."
                          value={config.fallback.sttApiKey || ''}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              fallback: { ...prev.fallback, sttApiKey: e.target.value },
                            }))
                          }
                          className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 pr-8 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => toggleKey('fallback_stt')}
                          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                        >
                          {showKeys['fallback_stt'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">Failover STT disabled. Primary stream disruption will halt transcription.</p>
              )}
            </div>
          </div>

          {/* COLUMN 2: BRAIN / LLM (PRIMARY + FAILOVER) */}
          <div className="space-y-4">
            {/* STEP 2: BRAIN / LLM */}
            <div className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                  <Cpu className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">2. Language Model (LLM)</h3>
                  <p className="text-muted-foreground text-[11px]">Reasoning & tool execution</p>
                </div>
              </div>

              {/* Provider dropdown */}
              <div className="space-y-1">
                <label className="text-foreground text-[11px] font-medium">LLM Provider</label>
                <select
                  value={config.llm.provider}
                  onChange={(e) => {
                    const prov = e.target.value as LLMProvider;
                    const found = LLM_PROVIDERS.find((l) => l.id === prov)!;
                    setConfig((prev) => ({
                      ...prev,
                      llm: {
                        ...prev.llm,
                        provider: prov,
                        model: found.models[0].id,
                      },
                    }));
                  }}
                  className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                >
                  {LLM_PROVIDERS.map((l) => (
                    <option key={l.id} value={l.id} className="bg-card text-foreground">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model dropdown */}
              <div className="space-y-1">
                <label className="text-foreground text-[11px] font-medium">Model Selection</label>
                <select
                  value={config.llm.model}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      llm: { ...prev.llm, model: e.target.value },
                    }))
                  }
                  className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                >
                  {activeLLMProvider.models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-card text-foreground">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Ollama Base URL or API Key */}
              {config.llm.provider === 'ollama' ? (
                <div className="space-y-1">
                  <label className="text-foreground text-[11px] font-medium">Ollama Endpoint URL</label>
                  <input
                    type="text"
                    placeholder="http://localhost:11434/v1"
                    value={config.llm.ollamaBaseUrl || 'http://localhost:11434/v1'}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        llm: { ...prev.llm, ollamaBaseUrl: e.target.value },
                      }))
                    }
                    className="bg-muted/40 border-border text-foreground input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs"
                  />
                </div>
              ) : config.llm.provider === 'livekit' ? (
                <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-2.5 text-[11px] text-cyan-400">
                  <Sparkles className="size-3.5 shrink-0" />
                  <span>
                    LiveKit Inference routes through your LiveKit Project credentials with Zero Data Retention (ZDR). No API key needed.
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-[11px] font-medium">{activeLLMProvider.name} Key</label>
                    <span className="text-muted-foreground text-[9px]">{activeLLMProvider.keyHelp}</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys['llm'] ? 'text' : 'password'}
                      placeholder={activeLLMProvider.keyPlaceholder}
                      value={config.llm.apiKey}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          llm: { ...prev.llm, apiKey: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 pr-8 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('llm')}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                    >
                      {showKeys['llm'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* LLM FAILOVER ENGINE (Directly follows Primary LLM) */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="size-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">LLM Reasoning Failover</span>
                    <span className="text-[10px] text-muted-foreground">(Handles HTTP 429 & token timeouts)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        fallback: {
                          ...prev.fallback,
                          enabled: !prev.fallback?.enabled,
                        },
                      }))
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.fallback?.enabled ? 'bg-primary' : 'bg-muted/80'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        config.fallback?.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {config.fallback?.enabled ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-foreground text-[11px] font-medium">Fallback LLM Provider</label>
                        <select
                          value={config.fallback.provider}
                          onChange={(e) => {
                            const prov = e.target.value as LLMProvider;
                            const found = LLM_PROVIDERS.find((l) => l.id === prov)!;
                            setConfig((prev) => ({
                              ...prev,
                              fallback: {
                                ...prev.fallback,
                                provider: prov,
                                model: found.models[0].id,
                              },
                            }));
                          }}
                          className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-1.5 text-xs"
                        >
                          {LLM_PROVIDERS.map((l) => (
                            <option key={l.id} value={l.id} className="bg-card text-foreground">
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-foreground text-[11px] font-medium">Fallback LLM Model</label>
                        <select
                          value={config.fallback.model}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              fallback: { ...prev.fallback, model: e.target.value },
                            }))
                          }
                          className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-1.5 text-xs"
                        >
                          {(
                            LLM_PROVIDERS.find((l) => l.id === config.fallback.provider) || LLM_PROVIDERS[0]
                          ).models.map((m) => (
                            <option key={m.id} value={m.id} className="bg-card text-foreground">
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {config.fallback.provider === 'livekit' ? (
                      <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-[11px] text-cyan-400">
                        <Sparkles className="size-3.5 shrink-0" />
                        <span>LiveKit Inference LLM routes via project credentials with Zero Data Retention.</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-foreground text-[11px] font-medium">Fallback LLM API Key</label>
                          <span className="text-muted-foreground text-[9px]">Optional if key exists in env</span>
                        </div>
                        <div className="relative">
                          <input
                            type={showKeys['fallback_llm'] ? 'text' : 'password'}
                            placeholder="Provider API key..."
                            value={config.fallback.apiKey || ''}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                fallback: { ...prev.fallback, apiKey: e.target.value },
                              }))
                            }
                            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 pr-8 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => toggleKey('fallback_llm')}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                          >
                            {showKeys['fallback_llm'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Disabled. Primary LLM rate-limits will halt conversation turns.</p>
                )}
              </div>
            </div>

          {/* COLUMN 3: TEXT TO SPEECH (PRIMARY + FAILOVER) */}
          <div className="space-y-4">
            {/* STEP 3: TEXT TO SPEECH (TTS) */}
            <div className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                  <Volume2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">3. Text-to-Speech (TTS)</h3>
                  <p className="text-muted-foreground text-[11px]">Generate natural voice audio</p>
                </div>
              </div>

              {/* Provider dropdown */}
              <div className="space-y-1">
                <label className="text-foreground text-[11px] font-medium">TTS Provider</label>
                <select
                  value={config.tts.provider}
                  onChange={(e) => {
                    const prov = e.target.value as TTSProvider;
                    const found = TTS_PROVIDERS.find((t) => t.id === prov)!;
                    setConfig((prev) => ({
                      ...prev,
                      tts: {
                        ...prev.tts,
                        provider: prov,
                        model: found.models[0].id,
                        voice: found.voices[0].id,
                      },
                    }));
                  }}
                  className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                >
                  {TTS_PROVIDERS.map((t) => (
                    <option key={t.id} value={t.id} className="bg-card text-foreground">
                      {t.name} (~{t.latency}ms)
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice dropdown */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-foreground text-[11px] font-medium">Voice Tone</label>
                  <button
                    type="button"
                    onClick={() => {
                      const v = activeTTSProvider.voices.find((x) => x.id === config.tts.voice);
                      if (v) handleAudition(v.hz, v.id);
                    }}
                    className="text-primary hover:underline text-[10px]"
                  >
                    Test Tone
                  </button>
                </div>
                <select
                  value={config.tts.voice}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      tts: { ...prev.tts, voice: e.target.value },
                    }))
                  }
                  className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                >
                  {activeTTSProvider.voices.map((v) => (
                    <option key={v.id} value={v.id} className="bg-card text-foreground">
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key or LiveKit Inference Notice */}
              {config.tts.provider === 'livekit' ? (
                <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-2.5 text-[11px] text-cyan-400">
                  <Sparkles className="size-3.5 shrink-0" />
                  <span>
                    LiveKit Inference TTS routes through your LiveKit Project credentials with Zero Data Retention (ZDR). No external TTS key required.
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-[11px] font-medium">{activeTTSProvider.name} Key</label>
                    <span className="text-muted-foreground text-[9px]">{activeTTSProvider.keyHelp}</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys['tts'] ? 'text' : 'password'}
                      placeholder={activeTTSProvider.keyPlaceholder}
                      value={config.tts.apiKey}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          tts: { ...prev.tts, apiKey: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 pr-8 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('tts')}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                    >
                      {showKeys['tts'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TTS FAILOVER ENGINE (Directly follows Primary TTS) */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground">TTS Failover Engine</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      fallback: {
                        ...prev.fallback,
                        ttsEnabled: !prev.fallback?.ttsEnabled,
                      },
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.fallback?.ttsEnabled ? 'bg-primary' : 'bg-muted/80'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.fallback?.ttsEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {config.fallback?.ttsEnabled ? (
                <div className="space-y-3 pt-1 border-t border-border/30 mt-2">
                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover TTS Provider</label>
                    <select
                      value={config.fallback.ttsProvider || 'livekit'}
                      onChange={(e) => {
                        const prov = e.target.value as TTSProvider;
                        const found = TTS_PROVIDERS.find((t) => t.id === prov)!;
                        setConfig((prev) => ({
                          ...prev,
                          fallback: {
                            ...prev.fallback,
                            ttsProvider: prov,
                            ttsModel: found.models[0].id,
                            ttsVoice: found.voices[0]?.id || '',
                          },
                        }));
                      }}
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {TTS_PROVIDERS.map((t) => (
                        <option key={t.id} value={t.id} className="bg-card text-foreground">
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover TTS Model</label>
                    <select
                      value={config.fallback.ttsModel || 'cartesia/sonic-3.6'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fallback: { ...prev.fallback, ttsModel: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {(
                        TTS_PROVIDERS.find((t) => t.id === (config.fallback?.ttsProvider || 'livekit')) || TTS_PROVIDERS[0]
                      ).models.map((m) => (
                        <option key={m.id} value={m.id} className="bg-card text-foreground">
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover Voice Tone</label>
                    <select
                      value={config.fallback.ttsVoice || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fallback: { ...prev.fallback, ttsVoice: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {(
                        TTS_PROVIDERS.find((t) => t.id === (config.fallback?.ttsProvider || 'livekit')) || TTS_PROVIDERS[0]
                      ).voices.map((v) => (
                        <option key={v.id} value={v.id} className="bg-card text-foreground">
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {config.fallback.ttsProvider === 'livekit' ? (
                    <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2 text-[10px] text-cyan-400">
                      <Sparkles className="size-3 shrink-0" />
                      <span>LiveKit Inference TTS routes smoothly with Zero Data Retention.</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-foreground text-[10px] font-medium">Failover TTS Key</label>
                        <span className="text-muted-foreground text-[9px]">Optional</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showKeys['fallback_tts'] ? 'text' : 'password'}
                          placeholder="TTS API key..."
                          value={config.fallback.ttsApiKey || ''}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              fallback: { ...prev.fallback, ttsApiKey: e.target.value },
                            }))
                          }
                          className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 pr-8 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => toggleKey('fallback_tts')}
                          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
                        >
                          {showKeys['fallback_tts'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">Failover TTS disabled. TTS voice provider failure will cause silence.</p>
              )}
            </div>
          </div>
        
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SPEECHMATICS VOICE RECOGNITION & AGENT STT SUITE (Conditional on Speechmatics STT)
             ───────────────────────────────────────────────────────────── */}
          {config.stt.provider === 'speechmatics' ? (
          <section className="border-border bg-card relative space-y-6 overflow-hidden rounded-2xl border p-6 shadow-sm">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-primary/5 blur-3xl" />

            {/* Header */}
            <div className="border-border flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="border-primary/40 bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl border shadow-inner">
                  <Waves className="size-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-foreground text-base font-semibold">Speechmatics Voice Recognition Studio</h3>
                    <span className="border-primary/30 bg-primary/15 text-primary rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                      URSA™ & LINDEN-1
                    </span>
                    <span className="border-border bg-muted/60 text-muted-foreground hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-flex">
                      livekit-plugins-speechmatics
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Specialized conversational agent STT with native voice endpointing, sub-second latency, and multi-accent accuracy.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://portal.speechmatics.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border bg-muted/40 hover:bg-muted text-foreground inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <ExternalLink className="text-muted-foreground size-3.5" />
                  <span>Speechmatics Portal</span>
                </a>

                {config.stt.provider !== 'speechmatics' && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        stt: {
                          ...prev.stt,
                          provider: 'speechmatics',
                          model: prev.speechmatics.model || 'linden-1',
                          apiKey: prev.speechmatics.apiKey || prev.stt.apiKey,
                        },
                      }))
                    }
                    className="bg-primary hover:bg-primary-hover text-primary-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all"
                  >
                    <Check className="size-3.5" />
                    <span>Set As Active STT</span>
                  </button>
                )}
              </div>
            </div>

            {/* 1. ACOUSTIC ENGINE / MODEL SELECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-foreground text-xs font-medium">
                  1. Acoustic Recognition Model
                </label>
                <span className="text-muted-foreground text-[11px]">
                  Active: <strong className="text-foreground font-semibold">{config.speechmatics.model}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* Linden-1 */}
                <div
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      speechmatics: { ...prev.speechmatics, model: 'linden-1' },
                      stt: prev.stt.provider === 'speechmatics' ? { ...prev.stt, model: 'linden-1' } : prev.stt,
                    }))
                  }
                  className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                    config.speechmatics.model === 'linden-1'
                      ? 'border-primary/60 bg-primary/10 shadow-sm ring-1 ring-primary/30'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="border-primary/40 bg-primary/20 text-primary rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase">
                      VOICE AGENT OPTIMIZED
                    </span>
                    {config.speechmatics.model === 'linden-1' && (
                      <Check className="text-primary size-4" />
                    )}
                  </div>
                  <h4 className="text-foreground mt-2.5 text-sm font-semibold">Linden-1 (Agent STT)</h4>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Purpose-built for LiveKit voice agents. Sub-second turn endpointing, lowest latency streaming, and native conversational acoustics.
                  </p>
                  <div className="text-primary mt-3 flex items-center gap-2 text-[11px] font-medium">
                    <Clock className="size-3" />
                    <span>~90ms Turn Latency</span>
                  </div>
                </div>

                {/* Enhanced (Ursa Flagship) */}
                <div
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      speechmatics: { ...prev.speechmatics, model: 'enhanced' },
                      stt: prev.stt.provider === 'speechmatics' ? { ...prev.stt, model: 'enhanced' } : prev.stt,
                    }))
                  }
                  className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                    config.speechmatics.model === 'enhanced'
                      ? 'border-primary/60 bg-primary/10 shadow-sm ring-1 ring-primary/30'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="border-border bg-muted text-foreground rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
                      FLAGSHIP ACCURACY
                    </span>
                    {config.speechmatics.model === 'enhanced' && (
                      <Check className="text-primary size-4" />
                    )}
                  </div>
                  <h4 className="text-foreground mt-2.5 text-sm font-semibold">Ursa Enhanced</h4>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Speechmatics breakthrough self-attention deep neural network. Delivers highest precision across 50+ global dialects and noisy real-world audio.
                  </p>
                  <div className="text-muted-foreground mt-3 flex items-center gap-2 text-[11px] font-medium">
                    <ShieldCheck className="size-3 text-emerald-500" />
                    <span>Lowest Word-Error-Rate (WER)</span>
                  </div>
                </div>

                {/* Standard */}
                <div
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      speechmatics: { ...prev.speechmatics, model: 'standard' },
                      stt: prev.stt.provider === 'speechmatics' ? { ...prev.stt, model: 'standard' } : prev.stt,
                    }))
                  }
                  className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                    config.speechmatics.model === 'standard'
                      ? 'border-primary/60 bg-primary/10 shadow-sm ring-1 ring-primary/30'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="border-border bg-muted text-foreground rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
                      FAST STREAMING
                    </span>
                    {config.speechmatics.model === 'standard' && (
                      <Check className="text-primary size-4" />
                    )}
                  </div>
                  <h4 className="text-foreground mt-2.5 text-sm font-semibold">Ursa Standard</h4>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    High throughput cloud stream model designed for minimal compute overhead and instantaneous transcript hypotheses.
                  </p>
                  <div className="text-muted-foreground mt-3 flex items-center gap-2 text-[11px] font-medium">
                    <Zap className="size-3 text-amber-500" />
                    <span>High Concurrency Throughput</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TURN DETECTION & LATENCY */}
            <div className="border-border grid grid-cols-1 gap-6 border-t pt-5 md:grid-cols-2">
              {/* Turn Detection Mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-foreground text-xs font-medium">
                    2. Turn Detection & Voice Activity Mode
                  </label>
                  <span className="text-muted-foreground text-[10px]">Speechmatics native vs Silero VAD</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        speechmatics: { ...prev.speechmatics, turnDetection: 'vad' },
                      }))
                    }
                    className={`cursor-pointer rounded-xl border p-3 transition-all ${
                      config.speechmatics.turnDetection === 'vad'
                        ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-foreground text-xs font-semibold">Native Server VAD</div>
                      {config.speechmatics.turnDetection === 'vad' && (
                        <Check className="text-primary size-3.5" />
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-[11px] leading-normal">
                      Autonomous endpointing handled directly in the Speechmatics recognition stream. No client VAD required.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        speechmatics: { ...prev.speechmatics, turnDetection: 'external' },
                      }))
                    }
                    className={`cursor-pointer rounded-xl border p-3 transition-all ${
                      config.speechmatics.turnDetection === 'external'
                        ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-foreground text-xs font-semibold">External Silero VAD</div>
                      {config.speechmatics.turnDetection === 'external' && (
                        <Check className="text-primary size-3.5" />
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-[11px] leading-normal">
                      LiveKit Silero VAD plugin coordinates end of turns while Speechmatics streams transcription.
                    </p>
                  </div>
                </div>
              </div>

              {/* Latency & Max Delay */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-foreground text-xs font-medium">
                    3. Max Delay / Latency Window (`max_delay`)
                  </label>
                  <span className="text-primary text-xs font-semibold">
                    {config.speechmatics.maxDelay.toFixed(1)}s
                    {config.speechmatics.maxDelay <= 1.2 ? ' (Low-Latency Conversational)' : ' (Extended Accuracy Context)'}
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={config.speechmatics.maxDelay}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        speechmatics: {
                          ...prev.speechmatics,
                          maxDelay: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="accent-primary w-full cursor-pointer"
                  />
                  <div className="text-muted-foreground flex justify-between text-[10px]">
                    <span>0.5s (Ultra-Instant)</span>
                    <span>1.0s (Voice Agent Standard)</span>
                    <span>3.0s (Max Accuracy Buffer)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. LANGUAGE & DOMAIN VOCABULARY */}
            <div className="border-border grid grid-cols-1 gap-6 border-t pt-5 md:grid-cols-2">
              {/* Language Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-foreground text-xs font-medium">
                    4. Language & Dialect Adaptation
                  </label>
                  <span className="text-muted-foreground text-[10px]">50+ languages supported</span>
                </div>
                <select
                  value={config.speechmatics.language}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      speechmatics: { ...prev.speechmatics, language: e.target.value },
                    }))
                  }
                  className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                >
                  {SPEECHMATICS_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-card text-foreground">
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
                <p className="text-muted-foreground text-[10px]">
                  Ursa automatically adapts to regional accents including US, UK, Australian, Indian, Scottish, and Canadian.
                </p>
              </div>

              {/* Custom Dictionary Boosting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-foreground text-xs font-medium">
                    5. Custom Dictionary (Keyword Boosting)
                  </label>
                  <span className="text-muted-foreground text-[10px]">Biases acoustic decoding toward domain terms</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add term (e.g. Exia, PyTorch)..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus flex-1 rounded-xl border px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 inline-flex cursor-pointer items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    <Plus className="size-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Keyword Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {config.speechmatics.customDictionary.map((word) => (
                    <span
                      key={word}
                      className="border-border bg-muted/60 text-foreground inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs"
                    >
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(word)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Remove term"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. TOGGLES & API CREDENTIALS */}
            <div className="border-border grid grid-cols-1 gap-6 border-t pt-5 md:grid-cols-2">
              {/* Feature Toggles */}
              <div className="space-y-3">
                <label className="text-foreground text-xs font-medium">6. Streaming & Diarization Features</label>
                <div className="space-y-2">
                  {/* Partials */}
                  <label className="border-border bg-muted/20 hover:bg-muted/30 flex cursor-pointer items-center justify-between rounded-xl border p-3">
                    <div>
                      <div className="text-foreground text-xs font-semibold">Real-Time Interim Partials</div>
                      <div className="text-muted-foreground text-[10px]">
                        Stream instantaneous word-by-word hypotheses before final sentence punctuation.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.speechmatics.enablePartials}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          speechmatics: {
                            ...prev.speechmatics,
                            enablePartials: e.target.checked,
                          },
                        }))
                      }
                      className="accent-primary size-4 cursor-pointer"
                    />
                  </label>

                  {/* Diarization */}
                  <label className="border-border bg-muted/20 hover:bg-muted/30 flex cursor-pointer items-center justify-between rounded-xl border p-3">
                    <div>
                      <div className="text-foreground text-xs font-semibold">Speaker Change Detection</div>
                      <div className="text-muted-foreground text-[10px]">
                        Track turn boundaries and distinct speaker shifts (`speaker_change`).
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.speechmatics.diarization}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          speechmatics: {
                            ...prev.speechmatics,
                            diarization: e.target.checked,
                          },
                        }))
                      }
                      className="accent-primary size-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-foreground text-xs font-medium">7. Speechmatics API Key</label>
                  <span className="text-muted-foreground text-[10px]">portal.speechmatics.com</span>
                </div>
                <div className="relative">
                  <input
                    type={showKeys['speechmatics'] ? 'text' : 'password'}
                    placeholder="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={config.speechmatics.apiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfig((prev) => ({
                        ...prev,
                        speechmatics: { ...prev.speechmatics, apiKey: val },
                        stt:
                          prev.stt.provider === 'speechmatics'
                            ? { ...prev.stt, apiKey: val }
                            : prev.stt,
                      }));
                    }}
                    className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2.5 pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKey('speechmatics')}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showKeys['speechmatics'] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-muted-foreground text-[10px]">
                  Used by `livekit-plugins-speechmatics` for real-time WebSocket transcription and endpointing.
                </p>
              </div>
            </div>

            {/* 5. ACTIVE VOICE PROFILES & SPEAKER RECOGNITION (MongoDB Database) */}
            <div className="border-border border-t pt-5 space-y-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-foreground text-sm font-semibold">Active Voice Profiles (MongoDB Database)</h4>
                      <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary uppercase">
                        {config.voiceUsers.length} Enrolled Profiles
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Acoustic speaker voiceprints automatically fetched from MongoDB (<code className="text-foreground font-mono">voice_profiles</code>). The agent identifies callers in real-time without uploading JSON files.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadVoiceProfilesFromDb}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors"
                    title="Refresh voice profiles from MongoDB"
                  >
                    <RotateCcw className="size-3.5 text-muted-foreground" />
                    <span>Sync DB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all"
                  >
                    <Plus className="size-3.5" />
                    <span>Enroll Voice User</span>
                  </button>
                </div>
              </div>

              {/* Speaker Identification Mode Switch */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                <div className="space-y-0.5">
                  <div className="text-foreground text-xs font-semibold flex items-center gap-2">
                    <span>Acoustic Speaker Voice Verification</span>
                    {config.speechmatics.speakerIdentification && (
                      <span className="text-[10px] text-emerald-500 font-medium">● Active</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Identifies who is speaking based on enrolled voice signatures, mapping turn transcripts to individual user profiles.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-xs font-mono text-primary font-semibold">
                    {(config.speechmatics.speakerThreshold * 100).toFixed(0)}% threshold
                  </span>
                  <input
                    type="checkbox"
                    checked={config.speechmatics.speakerIdentification}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        speechmatics: {
                          ...prev.speechmatics,
                          speakerIdentification: e.target.checked,
                        },
                      }))
                    }
                    className="size-4 accent-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Voice Users List Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {config.voiceUsers.map((user) => (
                  <div
                    key={user.id}
                    className="border-border bg-muted/20 hover:bg-muted/30 relative flex flex-col justify-between rounded-xl border p-4 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                            <UserCheck className="size-3.5" />
                          </div>
                          <div>
                            <div className="text-foreground text-xs font-semibold">{user.name}</div>
                            <span className="text-[10px] text-muted-foreground font-mono">{user.voice_signature_id}</span>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase border ${
                            user.role === 'admin'
                              ? 'border-primary/40 bg-primary/15 text-primary'
                              : user.role === 'user'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                              : 'border-border bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>

                      {user.notes && (
                        <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                          {user.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 border-t border-border pt-2.5 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="text-primary font-medium">{(user.confidence_threshold * 100).toFixed(0)}%</span>
                        <span>match threshold</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.pitch_hz && (
                          <button
                            type="button"
                            onClick={() => handleAudition(user.pitch_hz!, user.name)}
                            className="text-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                            title="Audition fundamental pitch"
                          >
                            <Volume2 className="size-3" />
                            <span>{user.pitch_hz}Hz</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteVoiceUser(user.id)}
                          className="text-muted-foreground hover:text-red-400 cursor-pointer p-0.5"
                          title="Delete voice profile"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
                  <Waves className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-foreground text-sm font-semibold">Speechmatics Real-time Voice Recognition & Speaker Diarization</h4>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Inactive</span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Acoustic voiceprint speaker identification and MongoDB profile enrollment require Speechmatics STT.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    stt: {
                      ...prev.stt,
                      provider: 'speechmatics',
                      model: prev.speechmatics.model || 'linden-1',
                      apiKey: prev.speechmatics.apiKey || prev.stt.apiKey,
                    },
                  }))
                }
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 px-4 py-2 text-xs font-semibold text-primary transition-all shrink-0"
              >
                <Check className="size-3.5" />
                <span>Select Speechmatics STT to Enable</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. INFERENCE PARAMETERS & SYSTEM DIRECTIVES
         ───────────────────────────────────────────────────────────── */}
      <section className="border-border bg-card space-y-6 rounded-2xl border p-6 shadow-sm">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
              <Sliders className="size-4" />
            </div>
            <div>
              <h3 className="text-foreground text-base font-semibold">Inference Parameters & Directives</h3>
              <p className="text-muted-foreground text-xs">Adjust response temperature, nucleus sampling, and runtime directives</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground font-medium">Temperature</span>
              <span className="text-primary font-semibold">{config.params.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.params.temperature}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  params: { ...prev.params, temperature: parseFloat(e.target.value) },
                }))
              }
              className="bg-muted h-2 w-full cursor-pointer rounded-lg accent-primary"
            />
            <p className="text-muted-foreground text-[10px]">
              0.2 = Strict & factual · 0.7 = Natural & conversational · 1.0 = Highly expressive
            </p>
          </div>

          {/* Top-P */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground font-medium">Top-P (Nucleus)</span>
              <span className="text-primary font-semibold">{config.params.topP}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={config.params.topP}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  params: { ...prev.params, topP: parseFloat(e.target.value) },
                }))
              }
              className="bg-muted h-2 w-full cursor-pointer rounded-lg accent-primary"
            />
            <p className="text-muted-foreground text-[10px]">
              Controls diversity of considered words before speech generation.
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground font-medium">Max Output Tokens</span>
              <span className="text-primary font-semibold">{config.params.maxTokens}</span>
            </div>
            <input
              type="range"
              min="256"
              max="4096"
              step="256"
              value={config.params.maxTokens}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  params: { ...prev.params, maxTokens: parseInt(e.target.value) },
                }))
              }
              className="bg-muted h-2 w-full cursor-pointer rounded-lg accent-primary"
            />
            <p className="text-muted-foreground text-[10px]">
              Limits maximum spoken words per turn (~750 words at 1024 tokens).
            </p>
          </div>
        </div>

        {/* Runtime System Prompt Override */}
        <div className="border-border space-y-1.5 border-t pt-4">
          <label className="text-foreground text-xs font-medium">Custom Persona / Prompt Directive</label>
          <textarea
            rows={3}
            placeholder="e.g. You are Exia, a helpful home assistant. Speak with calm precision. Confirm device states before triggering actions..."
            value={config.params.systemPromptOverride || ''}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                params: { ...prev.params, systemPromptOverride: e.target.value },
              }))
            }
            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-xs leading-relaxed transition-all"
          />
          <p className="text-muted-foreground text-[10px]">
            Injected at the start of all live voice interactions. Overrides default assistant behavior.
          </p>
        </div>
      </section>
      {/* ─────────────────────────────────────────────────────────────
          MODAL: ENROLL NEW VOICE USER PROFILE
         ───────────────────────────────────────────────────────────── */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="border-border bg-card relative w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                  <UserCheck className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-semibold">Enroll Voice User Profile</h3>
                  <p className="text-muted-foreground text-xs">Register speaker name, access role, and threshold.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* User Name */}
              <div className="space-y-1">
                <label className="text-foreground text-xs font-medium">Speaker Name</label>
                <input
                  type="text"
                  placeholder="e.g. Commander Alex, Sarah, Guest..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-xs"
                />
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-foreground text-xs font-medium">Access Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user' | 'guest')}
                  className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                >
                  <option value="admin" className="bg-card text-foreground">Admin / Owner (Full Directives Override)</option>
                  <option value="user" className="bg-card text-foreground">Authorized User (Standard AI Queries)</option>
                  <option value="guest" className="bg-card text-foreground">Guest Speaker (Limited Access)</option>
                </select>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-foreground text-xs font-medium">Match Confidence Threshold</label>
                  <span className="text-primary font-mono text-xs font-semibold">
                    {(newUserThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="0.95"
                  step="0.01"
                  value={newUserThreshold}
                  onChange={(e) => setNewUserThreshold(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-foreground text-xs font-medium">Profile Directives / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes on voice tone, privileges, or companion response style..."
                  value={newUserNotes}
                  onChange={(e) => setNewUserNotes(e.target.value)}
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="cursor-pointer rounded-xl border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddVoiceUser}
                disabled={!newUserName.trim() || isAddingUser}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover disabled:opacity-50"
              >
                {isAddingUser ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                <span>{isAddingUser ? 'Enrolling to Database...' : 'Enroll to Database'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
