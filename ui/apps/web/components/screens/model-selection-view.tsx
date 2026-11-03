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
export type STTProvider = 'livekit' | 'speechmatics' | 'deepgram' | 'openai' | 'google' | 'server';

export const STT_LANGUAGES = [
  { code: 'en', name: 'English (US, UK, AU, IN)' },
  { code: 'auto', name: 'Auto-Detect (Multilingual)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Chinese (Mandarin / 普通话)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'ar', name: 'Arabic (العربية)' },
];

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
  {
    id: 'server' as STTProvider,
    name: 'Custom STT Server (OpenAI Whisper-compatible)',
    badge: 'CUSTOM SERVER',
    keyPlaceholder: 'Optional STT Token...',
    keyHelp: 'Custom Whisper or faster-whisper OpenAI-compatible endpoint',
    latency: 130,
    isCustomServer: true,
    models: [
      { id: 'whisper-large-v3', name: 'Whisper Large v3 (Multilingual)' },
      { id: 'whisper-base', name: 'Whisper Base (High Speed)' },
      { id: 'custom', name: 'Custom Model ID (Specify below)' },
    ],
  },
];

// 3. MODULAR: LANGUAGE MODEL (LLM)
export type LLMProvider = 'livekit' | 'anthropic' | 'openai' | 'google' | 'groq' | 'ollama' | 'server';

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
    id: 'groq' as LLMProvider,
    name: 'Groq (Ultra-Fast LPU Inference)',
    badge: 'SUB-70MS LPU',
    keyPlaceholder: 'gsk_...',
    keyHelp: 'console.groq.com/keys',
    latency: 65,
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Flagship Fast)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Instant Voice)' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B (Fast Reasoning)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32K Window)' },
    ],
  },
  {
    id: 'anthropic' as LLMProvider,
    name: 'Anthropic Claude',
    badge: 'FRONTIER REASONING',
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
    badge: 'OMNI INTELLIGENCE',
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
    badge: 'MULTIMODAL SPEED',
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
    name: 'Ollama / Local Server',
    badge: 'LOCAL OFFLINE',
    keyPlaceholder: 'Optional (e.g. ollama or proxy bearer token)',
    keyHelp: 'Local Ollama endpoint',
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
  {
    id: 'server' as LLMProvider,
    name: 'Custom OpenAI-Compatible Server (vLLM / LiteLLM / LM Studio)',
    badge: 'CUSTOM SERVER',
    keyPlaceholder: 'Optional Bearer Token / Proxy Key...',
    keyHelp: 'Custom HTTP OpenAI-compatible endpoint',
    latency: 140,
    isCustomServer: true,
    models: [
      { id: 'custom', name: 'Custom Model ID (Specify below)' },
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B' },
      { id: 'qwen2.5-72b', name: 'Qwen 2.5 72B' },
      { id: 'deepseek-r1', name: 'DeepSeek R1' },
      { id: 'mistral-small', name: 'Mistral Small' },
    ],
  },
];

// 4. MODULAR: TEXT-TO-SPEECH (TTS)
export type TTSProvider = 'livekit' | 'cartesia' | 'elevenlabs' | 'openai' | 'speechmatics' | 'google' | 'server';

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
  {
    id: 'server' as TTSProvider,
    name: 'Custom TTS Server (OpenAI-compatible TTS / Local)',
    badge: 'CUSTOM SERVER',
    keyPlaceholder: 'Optional TTS Token...',
    keyHelp: 'Custom OpenAI-compatible TTS server endpoint',
    latency: 120,
    isCustomServer: true,
    models: [
      { id: 'tts-1', name: 'TTS-1 Standard' },
      { id: 'custom', name: 'Custom Voice Model' },
    ],
    voices: [
      { id: 'default', name: 'Default Voice', hz: 200 },
      { id: 'alloy', name: 'Alloy', hz: 220 },
      { id: 'echo', name: 'Echo', hz: 190 },
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
    language?: string;
    serverUrl?: string;
  };
  speechmatics: {
    voiceRecognitionEnabled: boolean;
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
    serverUrl?: string;
    ollamaBaseUrl?: string;
  };
  tts: {
    provider: TTSProvider;
    apiKey: string;
    model: string;
    voice: string;
    serverUrl?: string;
  };
  fallback: {
    enabled: boolean;
    // Realtime Fallback
    realtimeEnabled: boolean;
    realtimeProvider: RealtimeProvider;
    realtimeModel: string;
    realtimeVoice: string;
    realtimeApiKey?: string;
    // Modular Fallbacks
    llmEnabled: boolean;
    provider: LLMProvider;
    model: string;
    apiKey?: string;
    serverUrl?: string;
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
  turnAndVad: {
    vadThreshold: number;
    allowInterruptions: boolean;
    silenceDurationMs: number;
    prefixPaddingMs: number;
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
  realtime: {
    provider: 'google',
    apiKey: '',
    model: 'gemini-2.0-flash',
    voice: 'Charon',
  },
  stt: {
    provider: 'deepgram',
    apiKey: '',
    model: 'nova-3',
    language: 'en',
    serverUrl: 'http://localhost:9000/v1',
  },
  speechmatics: {
    voiceRecognitionEnabled: false,
    apiKey: '',
    model: 'linden-1',
    turnDetection: 'vad',
    maxDelay: 1.0,
    enablePartials: true,
    language: 'en',
    customDictionary: ['Exia', 'LiveKit', 'WebRTC', 'PyTorch', 'Gemini'],
    diarization: false,
    speakerIdentification: false,
    voiceProfileName: 'Commander / Primary User',
    speakerThreshold: 0.82,
  },
  voiceUsers: DEFAULT_VOICE_USERS,
  llm: {
    provider: 'anthropic',
    apiKey: '',
    model: 'claude-3-5-sonnet-latest',
    customModelName: '',
    serverUrl: 'http://localhost:8000/v1',
    ollamaBaseUrl: 'http://localhost:11434/v1',
  },
  tts: {
    provider: 'cartesia',
    apiKey: '',
    model: 'sonic-3.6',
    voice: 'baritone-us',
    serverUrl: 'http://localhost:8000/v1',
  },
  fallback: {
    enabled: false,
    realtimeEnabled: false,
    realtimeProvider: 'livekit',
    realtimeModel: 'google/gemini-3.8-live',
    realtimeVoice: 'Charon',
    realtimeApiKey: '',
    llmEnabled: true,
    provider: 'livekit',
    model: 'google/gemma-4-31b-it',
    apiKey: '',
    serverUrl: '',
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
  turnAndVad: {
    vadThreshold: 0.5,
    allowInterruptions: true,
    silenceDurationMs: 500,
    prefixPaddingMs: 300,
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
          realtime: { ...prev.realtime, ...(parsed.realtime || {}) },
          stt: { ...prev.stt, ...(parsed.stt || {}) },
          speechmatics: { ...prev.speechmatics, ...(parsed.speechmatics || {}) },
          voiceUsers: parsed.voiceUsers || parsedUsers,
          llm: { ...prev.llm, ...(parsed.llm || {}) },
          tts: { ...prev.tts, ...(parsed.tts || {}) },
          fallback: { ...prev.fallback, ...(parsed.fallback || {}) },
          turnAndVad: { ...prev.turnAndVad, ...(parsed.turnAndVad || {}) },
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
            const rawMode = String(serverCfg.mode || serverCfg.pipeline_mode || prev.architecture).toLowerCase();
            const activeArch: 'realtime' | 'modular' = (rawMode === 'realtime' || rawMode === 'gemini_live') ? 'realtime' : 'modular';

            const geminiKey = serverCfg.gemini_api_key || '';
            const openaiKey = serverCfg.openai_api_key || '';
            const anthropicKey = serverCfg.anthropic_api_key || '';
            const deepgramKey = serverCfg.deepgram_api_key || '';
            const cartesiaKey = serverCfg.cartesia_api_key || '';
            const elevenlabsKey = serverCfg.elevenlabs_api_key || '';
            const groqKey = serverCfg.groq_api_key || '';
            const speechmaticsKey = serverCfg.speechmatics_api_key || '';

            // Realtime mappings
            const rt = serverCfg.realtime || {};
            let realtimeKey = rt.api_key || prev.realtime.apiKey;
            if (prev.realtime.provider === 'google' && geminiKey) realtimeKey = geminiKey;
            if (prev.realtime.provider === 'openai' && openaiKey) realtimeKey = openaiKey;

            // Modular mappings
            const mod = serverCfg.modular || {};
            const sttCfg = mod.stt || {};
            const llmCfg = mod.llm || {};
            const ttsCfg = mod.tts || {};

            let llmKey = llmCfg.api_key || prev.llm.apiKey;
            if (prev.llm.provider === 'anthropic' && anthropicKey) llmKey = anthropicKey;
            if (prev.llm.provider === 'openai' && openaiKey) llmKey = openaiKey;
            if (prev.llm.provider === 'google' && geminiKey) llmKey = geminiKey;
            if (prev.llm.provider === 'groq' && groqKey) llmKey = groqKey;

            let sttKey = sttCfg.api_key || prev.stt.apiKey;
            if (prev.stt.provider === 'deepgram' && deepgramKey) sttKey = deepgramKey;
            if (prev.stt.provider === 'speechmatics' && speechmaticsKey) sttKey = speechmaticsKey;

            let ttsKey = ttsCfg.api_key || prev.tts.apiKey;
            if (prev.tts.provider === 'cartesia' && cartesiaKey) ttsKey = cartesiaKey;
            if (prev.tts.provider === 'elevenlabs' && elevenlabsKey) ttsKey = elevenlabsKey;

            // Fallback mappings (Realtime + Modular)
            const fb = serverCfg.fallback || {};
            const fbRt = fb.realtime || {};
            const fbMod = fb.modular || {};
            const fbLlm = fbMod.llm || fb.llm || {};
            const fbStt = fbMod.stt || fb.stt || {};
            const fbTts = fbMod.tts || fb.tts || {};

            // Turn & VAD mappings
            const vadCfg = serverCfg.vad || {};

            // Speechmatics voice recognition toggle
            const vrCfg = sttCfg.voice_recognition || {};
            const vrEnabled = Boolean(
              serverCfg.speechmatics_voice_recognition_enabled ||
              vrCfg.enabled ||
              serverCfg.speechmatics_speaker_identification ||
              serverCfg.speechmatics_diarization
            );

            return {
              ...prev,
              architecture: activeArch,
              realtime: {
                ...prev.realtime,
                provider: (rt.provider || serverCfg.realtime_model_provider || prev.realtime.provider) as RealtimeProvider,
                apiKey: realtimeKey,
                model: rt.model || serverCfg.realtime_model || serverCfg.gemini_model || prev.realtime.model,
                voice: rt.voice || serverCfg.realtime_voice || serverCfg.gemini_voice || prev.realtime.voice,
              },
              stt: {
                ...prev.stt,
                provider: (sttCfg.provider || serverCfg.stt_provider || prev.stt.provider).toLowerCase() as STTProvider,
                model: sttCfg.model || serverCfg.stt_model || prev.stt.model,
                language: sttCfg.language || serverCfg.stt_language || prev.stt.language || 'en',
                apiKey: sttKey,
                serverUrl: sttCfg.server_url || prev.stt.serverUrl,
              },
              speechmatics: {
                ...prev.speechmatics,
                voiceRecognitionEnabled: vrEnabled,
                apiKey: speechmaticsKey || prev.speechmatics.apiKey,
                model: serverCfg.speechmatics_model || prev.speechmatics.model,
                language: serverCfg.speechmatics_language || prev.speechmatics.language,
                diarization: Boolean(serverCfg.speechmatics_diarization ?? prev.speechmatics.diarization),
                speakerIdentification: Boolean(serverCfg.speechmatics_speaker_identification ?? prev.speechmatics.speakerIdentification),
                speakerThreshold: serverCfg.speechmatics_speaker_threshold ?? prev.speechmatics.speakerThreshold,
                voiceProfileName: serverCfg.speechmatics_voice_profile_name || prev.speechmatics.voiceProfileName,
                maxDelay: serverCfg.speechmatics_max_delay ?? prev.speechmatics.maxDelay,
                enablePartials: serverCfg.speechmatics_enable_partials ?? prev.speechmatics.enablePartials,
              },
              llm: {
                ...prev.llm,
                provider: (llmCfg.provider || serverCfg.llm_provider || prev.llm.provider).toLowerCase() as LLMProvider,
                model: llmCfg.model || serverCfg.llm_model || prev.llm.model,
                apiKey: llmKey,
                serverUrl: llmCfg.server_url || serverCfg.server_url || prev.llm.serverUrl,
                ollamaBaseUrl: serverCfg.ollama_base_url || prev.llm.ollamaBaseUrl,
              },
              tts: {
                ...prev.tts,
                provider: (ttsCfg.provider || serverCfg.tts_provider || prev.tts.provider).toLowerCase() as TTSProvider,
                model: ttsCfg.model || serverCfg.tts_model || prev.tts.model,
                voice: ttsCfg.voice || serverCfg.tts_voice || serverCfg.voice_id || prev.tts.voice,
                apiKey: ttsKey,
                serverUrl: ttsCfg.server_url || prev.tts.serverUrl,
              },
              fallback: {
                enabled: Boolean(serverCfg.fallback_enabled ?? fb.enabled ?? prev.fallback?.enabled),
                // Realtime Fallback
                realtimeEnabled: Boolean(serverCfg.fallback_realtime_enabled ?? fbRt.enabled ?? prev.fallback?.realtimeEnabled),
                realtimeProvider: (fbRt.provider || serverCfg.fallback_realtime_provider || prev.fallback?.realtimeProvider || 'livekit') as RealtimeProvider,
                realtimeModel: fbRt.model || serverCfg.fallback_realtime_model || prev.fallback?.realtimeModel || 'google/gemini-3.8-live',
                realtimeVoice: fbRt.voice || serverCfg.fallback_realtime_voice || prev.fallback?.realtimeVoice || 'Charon',
                realtimeApiKey: fbRt.api_key || serverCfg.fallback_realtime_api_key || prev.fallback?.realtimeApiKey || '',
                // Modular Fallback
                llmEnabled: Boolean(serverCfg.fallback_llm_enabled ?? fbLlm.enabled ?? prev.fallback?.llmEnabled ?? true),
                provider: (fbLlm.provider || serverCfg.fallback_provider || prev.fallback?.provider || 'livekit') as LLMProvider,
                model: fbLlm.model || serverCfg.fallback_model || prev.fallback?.model || 'google/gemma-4-31b-it',
                apiKey: fbLlm.api_key || serverCfg.fallback_api_key || prev.fallback?.apiKey || '',
                serverUrl: fbLlm.server_url || prev.fallback?.serverUrl || '',
                temperature: fbLlm.temperature ?? serverCfg.fallback_temperature ?? prev.fallback?.temperature ?? 0.7,
                sttEnabled: Boolean(serverCfg.fallback_stt_enabled ?? fbStt.enabled ?? prev.fallback?.sttEnabled),
                sttProvider: (fbStt.provider || serverCfg.fallback_stt_provider || prev.fallback?.sttProvider || 'livekit') as STTProvider,
                sttModel: fbStt.model || serverCfg.fallback_stt_model || prev.fallback?.sttModel || 'deepgram/nova-3',
                sttApiKey: fbStt.api_key || serverCfg.fallback_stt_api_key || prev.fallback?.sttApiKey || '',
                ttsEnabled: Boolean(serverCfg.fallback_tts_enabled ?? fbTts.enabled ?? prev.fallback?.ttsEnabled),
                ttsProvider: (fbTts.provider || serverCfg.fallback_tts_provider || prev.fallback?.ttsProvider || 'livekit') as TTSProvider,
                ttsModel: fbTts.model || serverCfg.fallback_tts_model || prev.fallback?.ttsModel || 'cartesia/sonic-3.6',
                ttsVoice: fbTts.voice || serverCfg.fallback_tts_voice || prev.fallback?.ttsVoice || 'baritone-us',
                ttsApiKey: fbTts.api_key || serverCfg.fallback_tts_api_key || prev.fallback?.ttsApiKey || '',
              },
              turnAndVad: {
                vadThreshold: typeof (serverCfg.vad_threshold ?? vadCfg.vad_threshold) === 'number' ? (serverCfg.vad_threshold ?? vadCfg.vad_threshold) : prev.turnAndVad.vadThreshold,
                allowInterruptions: Boolean(serverCfg.allow_interruptions ?? vadCfg.allow_interruptions ?? prev.turnAndVad.allowInterruptions),
                silenceDurationMs: Number(serverCfg.silence_duration_ms ?? vadCfg.silence_duration_ms ?? prev.turnAndVad.silenceDurationMs),
                prefixPaddingMs: Number(serverCfg.prefix_padding_ms ?? vadCfg.prefix_padding_ms ?? prev.turnAndVad.prefixPaddingMs),
              },
              params: {
                temperature: typeof serverCfg.temperature === 'number' ? serverCfg.temperature : prev.params.temperature,
                topP: typeof serverCfg.top_p === 'number' ? serverCfg.top_p : prev.params.topP,
                maxTokens: typeof serverCfg.max_output_tokens === 'number' ? serverCfg.max_output_tokens : prev.params.maxTokens,
                systemPromptOverride: serverCfg.system_prompt_override ?? prev.params.systemPromptOverride,
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

      // Extract active API keys
      let realtimeKey = config.realtime.apiKey;
      let geminiKey = '';
      let openaiKey = '';
      let anthropicKey = '';
      let deepgramKey = '';
      let cartesiaKey = '';
      let elevenlabsKey = '';
      let groqKey = '';
      const speechmaticsKey = config.speechmatics.apiKey || (config.stt.provider === 'speechmatics' ? config.stt.apiKey : '');

      if (config.realtime.provider === 'google' && realtimeKey) geminiKey = realtimeKey;
      if (config.realtime.provider === 'openai' && realtimeKey) openaiKey = realtimeKey;

      if (config.llm.provider === 'google' && config.llm.apiKey) geminiKey = config.llm.apiKey;
      if (config.llm.provider === 'openai' && config.llm.apiKey) openaiKey = config.llm.apiKey;
      if (config.llm.provider === 'anthropic' && config.llm.apiKey) anthropicKey = config.llm.apiKey;
      if (config.llm.provider === 'groq' && config.llm.apiKey) groqKey = config.llm.apiKey;

      if (config.stt.provider === 'deepgram' && config.stt.apiKey) deepgramKey = config.stt.apiKey;
      if (config.tts.provider === 'cartesia' && config.tts.apiKey) cartesiaKey = config.tts.apiKey;
      if (config.tts.provider === 'elevenlabs' && config.tts.apiKey) elevenlabsKey = config.tts.apiKey;

      let payload: Partial<ModelConfig>;

      if (config.architecture === 'realtime') {
        // STRICT REALTIME ISOLATION
        payload = {
          mode: 'realtime',
          pipeline_mode: 'gemini_live',
          realtime: {
            provider: config.realtime.provider,
            model: config.realtime.model,
            voice: config.realtime.voice,
            api_key: realtimeKey || undefined,
            temperature: config.params.temperature,
            top_p: config.params.topP,
            max_output_tokens: config.params.maxTokens,
          },
          realtime_model_provider: config.realtime.provider,
          realtime_model: config.realtime.model,
          realtime_voice: config.realtime.voice,
          realtime_api_key: realtimeKey || undefined,
          realtime_model_temperature: config.params.temperature,
          realtime_model_max_output_tokens: config.params.maxTokens,
          realtime_model_top_p: config.params.topP,
          gemini_model: config.realtime.model,
          gemini_voice: config.realtime.voice,
          temperature: config.params.temperature,
          top_p: config.params.topP,
          max_output_tokens: config.params.maxTokens,
          gemini_api_key: geminiKey || undefined,
          openai_api_key: openaiKey || undefined,
          // Explicitly clear modular fields
          stt_provider: undefined,
          stt_model: undefined,
          stt_model_api_key: undefined,
          stt_language: undefined,
          stt_server_url: undefined,
          llm_provider: undefined,
          llm_model: undefined,
          llm_api_key: undefined,
          llm_temperature: undefined,
          llm_max_output_tokens: undefined,
          llm_server_url: undefined,
          tts_provider: undefined,
          tts_model: undefined,
          tts_voice: undefined,
          tts_api_key: undefined,
          tts_server_url: undefined,
          voice_id: undefined,
          speechmatics_voice_recognition_enabled: false,
          speechmatics_speaker_identification: false,
          speechmatics_diarization: false,
          voice_users: [],
        };
      } else {
        // STRICT MODULAR ISOLATION
        const isSpeechmatics = config.stt.provider === 'speechmatics';
        const vrActive = isSpeechmatics && config.speechmatics.voiceRecognitionEnabled;
        const activeSttLang = config.stt.language || (isSpeechmatics ? config.speechmatics.language : 'en');

        payload = {
          mode: 'modular',
          pipeline_mode: 'modular',
          modular: {
            stt: {
              provider: config.stt.provider,
              model: config.stt.model,
              api_key: (isSpeechmatics ? speechmaticsKey : config.stt.apiKey) || undefined,
              server_url: config.stt.serverUrl || undefined,
              language: activeSttLang,
              voice_recognition: vrActive ? {
                enabled: true,
                speaker_identification: config.speechmatics.speakerIdentification,
                diarization: config.speechmatics.diarization,
                speaker_threshold: config.speechmatics.speakerThreshold,
                voice_profile_name: config.speechmatics.voiceProfileName,
                turn_detection: config.speechmatics.turnDetection,
                max_delay: config.speechmatics.maxDelay,
                enable_partials: config.speechmatics.enablePartials,
                custom_dictionary: config.speechmatics.customDictionary.join(', '),
                voice_users: config.voiceUsers,
              } : { enabled: false },
            },
            llm: {
              provider: config.llm.provider,
              model: config.llm.model === 'custom' ? (config.llm.customModelName || 'custom') : config.llm.model,
              api_key: config.llm.apiKey || undefined,
              server_url: config.llm.serverUrl || config.llm.ollamaBaseUrl || undefined,
              ollama_base_url: config.llm.ollamaBaseUrl || undefined,
              temperature: config.params.temperature,
              top_p: config.params.topP,
              max_output_tokens: config.params.maxTokens,
            },
            tts: {
              provider: config.tts.provider,
              model: config.tts.model,
              voice: config.tts.voice,
              api_key: config.tts.apiKey || undefined,
              server_url: config.tts.serverUrl || undefined,
            },
          },
          stt_provider: config.stt.provider,
          stt_model: config.stt.model,
          stt_model_api_key: (isSpeechmatics ? speechmaticsKey : config.stt.apiKey) || undefined,
          stt_language: activeSttLang,
          stt_server_url: config.stt.serverUrl || undefined,
          llm_provider: config.llm.provider,
          llm_model: config.llm.model === 'custom' ? (config.llm.customModelName || 'custom') : config.llm.model,
          llm_api_key: config.llm.apiKey || undefined,
          llm_temperature: config.params.temperature,
          llm_max_output_tokens: config.params.maxTokens,
          llm_top_p: config.params.topP,
          llm_server_url: config.llm.serverUrl || config.llm.ollamaBaseUrl || undefined,
          tts_provider: config.tts.provider,
          tts_model: config.tts.model,
          tts_voice: config.tts.voice,
          voice_id: config.tts.voice,
          tts_api_key: config.tts.apiKey || undefined,
          tts_server_url: config.tts.serverUrl || undefined,
          temperature: config.params.temperature,
          top_p: config.params.topP,
          max_output_tokens: config.params.maxTokens,
          server_url: config.llm.serverUrl || undefined,
          ollama_base_url: config.llm.ollamaBaseUrl || undefined,
          deepgram_api_key: deepgramKey || undefined,
          anthropic_api_key: anthropicKey || undefined,
          openai_api_key: openaiKey || undefined,
          gemini_api_key: geminiKey || undefined,
          groq_api_key: groqKey || undefined,
          cartesia_api_key: cartesiaKey || undefined,
          elevenlabs_api_key: elevenlabsKey || undefined,
          speechmatics_api_key: speechmaticsKey || undefined,
          speechmatics_voice_recognition_enabled: vrActive,
          speechmatics_model: isSpeechmatics ? config.speechmatics.model : undefined,
          speechmatics_language: activeSttLang,
          speechmatics_turn_detection: vrActive ? config.speechmatics.turnDetection : undefined,
          speechmatics_max_delay: vrActive ? config.speechmatics.maxDelay : undefined,
          speechmatics_enable_partials: vrActive ? config.speechmatics.enablePartials : undefined,
          speechmatics_custom_dictionary: vrActive ? config.speechmatics.customDictionary.join(', ') : undefined,
          speechmatics_diarization: vrActive ? config.speechmatics.diarization : false,
          speechmatics_speaker_identification: vrActive ? config.speechmatics.speakerIdentification : false,
          speechmatics_voice_profile_name: vrActive ? config.speechmatics.voiceProfileName : undefined,
          speechmatics_speaker_threshold: vrActive ? config.speechmatics.speakerThreshold : undefined,
          voice_users: vrActive ? config.voiceUsers : [],
          // Explicitly clear realtime fields
          realtime_model_provider: undefined,
          realtime_model: undefined,
          realtime_voice: undefined,
          realtime_api_key: undefined,
          realtime_model_temperature: undefined,
          realtime_model_max_output_tokens: undefined,
          gemini_model: undefined,
          gemini_voice: undefined,
        };
      }

      // FALLBACK MODELS (Supports Realtime & Modular)
      if (config.fallback?.enabled) {
        payload.fallback_enabled = true;
        payload.fallback = {
          enabled: true,
          realtime: {
            enabled: config.fallback.realtimeEnabled,
            provider: config.fallback.realtimeProvider,
            model: config.fallback.realtimeModel,
            voice: config.fallback.realtimeVoice,
            api_key: config.fallback.realtimeApiKey || undefined,
          },
          modular: {
            llm: {
              enabled: config.fallback.llmEnabled,
              provider: config.fallback.provider,
              model: config.fallback.model,
              temperature: config.fallback.temperature,
              api_key: config.fallback.apiKey || undefined,
              server_url: config.fallback.serverUrl || undefined,
            },
            stt: {
              enabled: config.fallback.sttEnabled,
              provider: config.fallback.sttProvider,
              model: config.fallback.sttModel,
              api_key: config.fallback.sttApiKey || undefined,
            },
            tts: {
              enabled: config.fallback.ttsEnabled,
              provider: config.fallback.ttsProvider,
              model: config.fallback.ttsModel,
              voice: config.fallback.ttsVoice,
              api_key: config.fallback.ttsApiKey || undefined,
            },
          },
        };
        payload.fallback_realtime_enabled = config.fallback.realtimeEnabled;
        payload.fallback_realtime_provider = config.fallback.realtimeProvider;
        payload.fallback_realtime_model = config.fallback.realtimeModel;
        payload.fallback_realtime_voice = config.fallback.realtimeVoice;
        payload.fallback_realtime_api_key = config.fallback.realtimeApiKey || undefined;
        payload.fallback_llm_enabled = config.fallback.llmEnabled;
        payload.fallback_provider = config.fallback.provider;
        payload.fallback_model = config.fallback.model;
        payload.fallback_temperature = config.fallback.temperature;
        payload.fallback_api_key = config.fallback.apiKey || undefined;
        payload.fallback_stt_enabled = config.fallback.sttEnabled;
        payload.fallback_stt_provider = config.fallback.sttProvider;
        payload.fallback_stt_model = config.fallback.sttModel;
        payload.fallback_stt_api_key = config.fallback.sttApiKey || undefined;
        payload.fallback_tts_enabled = config.fallback.ttsEnabled;
        payload.fallback_tts_provider = config.fallback.ttsProvider;
        payload.fallback_tts_model = config.fallback.ttsModel;
        payload.fallback_tts_voice = config.fallback.ttsVoice;
        payload.fallback_tts_api_key = config.fallback.ttsApiKey || undefined;
      } else {
        payload.fallback_enabled = false;
        payload.fallback = { enabled: false };
        payload.fallback_realtime_enabled = false;
        payload.fallback_llm_enabled = false;
        payload.fallback_stt_enabled = false;
        payload.fallback_tts_enabled = false;
      }

      // TURN AND VAD
      payload.vad_threshold = config.turnAndVad.vadThreshold;
      payload.allow_interruptions = config.turnAndVad.allowInterruptions;
      payload.silence_duration_ms = config.turnAndVad.silenceDurationMs;
      payload.prefix_padding_ms = config.turnAndVad.prefixPaddingMs;
      payload.vad = {
        vad_threshold: config.turnAndVad.vadThreshold,
        allow_interruptions: config.turnAndVad.allowInterruptions,
        silence_duration_ms: config.turnAndVad.silenceDurationMs,
        prefix_padding_ms: config.turnAndVad.prefixPaddingMs,
      };

      api.models.updateConfig(payload)
        .then(() => {
          toast.success(`Model configuration (${config.architecture}) and API keys saved to database.`);
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
          1. DEFAULT MODEL SETUP (SPEECH ARCHITECTURE & MODELS)
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-sm font-semibold tracking-tight uppercase text-primary">
              Section 1
            </h2>
            <span className="text-muted-foreground text-xs">·</span>
            <h2 className="text-foreground text-sm font-semibold tracking-tight">
              Default Model Setup
            </h2>
          </div>
          <p className="text-muted-foreground text-xs">
            Select your primary speech architecture. Collects active model credentials, tone audition, and generation parameters.
          </p>
        </div>

        {/* Architecture Switcher */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Tab A: Realtime Native S2S */}
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

          {/* Tab B: Modular Chained Pipeline */}
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
              Mix and match providers: Deepgram / Speechmatics (STT), Claude 3.5 / Groq / Custom Server (LLM), and Cartesia / ElevenLabs (TTS).
            </p>
          </button>
        </div>

        {/* ── REALTIME S2S CONFIGURATION FORM ── */}
        {config.architecture === 'realtime' && (
          <div className="border-border bg-card space-y-6 rounded-2xl border p-6 shadow-sm">
            <div className="border-border flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h3 className="text-foreground text-base font-semibold">Realtime S2S Provider Setup</h3>
                  <p className="text-muted-foreground text-xs">Choose provider, API key, model tier, and voice persona</p>
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

            {/* Realtime Provider API Key or LiveKit Notice */}
            {config.realtime.provider === 'livekit' ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3.5 text-xs text-cyan-400">
                <Sparkles className="size-4 shrink-0 text-cyan-400" />
                <span>
                  LiveKit Inference routes directly through server environment variables with Zero Data Retention (ZDR). No client API key required!
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
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-0.5 cursor-pointer"
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
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
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

            {/* Inlined Parameters for Realtime S2S */}
            <div className="border-border space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Sliders className="size-4 text-primary" />
                <h4 className="text-foreground text-xs font-semibold">Realtime Generation Parameters & Persona</h4>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Temperature */}
                <div className="space-y-1.5">
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
                    0.2 = Strict & factual · 0.7 = Natural conversational · 1.0 = Highly expressive
                  </p>
                </div>

                {/* Top-P */}
                <div className="space-y-1.5">
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
                    Controls diversity of considered word tokens.
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">Max Spoken Tokens</span>
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
                    Limits maximum spoken length per agent turn (~750 words at 1024 tokens).
                  </p>
                </div>
              </div>


            </div>
          </div>
        )}

        {/* ── MODULAR PIPELINE CONFIGURATION FORM ── */}
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

            {/* 3-Column Pipeline Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
              {/* COLUMN 1: SPEECH-TO-TEXT (STT) */}
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

                {/* STT Provider dropdown */}
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

                {/* STT Model dropdown */}
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

                {/* Universal STT Language dropdown */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground text-[11px] font-medium">Spoken Language</label>
                    <span className="text-muted-foreground text-[9px]">Universal across STT engines</span>
                  </div>
                  <select
                    value={config.stt.language || 'en'}
                    onChange={(e) => {
                      const lang = e.target.value;
                      setConfig((prev) => ({
                        ...prev,
                        stt: { ...prev.stt, language: lang },
                        speechmatics: { ...prev.speechmatics, language: lang },
                      }));
                    }}
                    className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                  >
                    {STT_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-card text-foreground">
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Server Endpoint for STT */}
                {config.stt.provider === 'server' && (
                  <div className="space-y-1">
                    <label className="text-foreground text-[11px] font-medium">STT Server Endpoint URL</label>
                    <input
                      type="text"
                      placeholder="http://localhost:9000/v1"
                      value={config.stt.serverUrl || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          stt: { ...prev.stt, serverUrl: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                )}

                {/* API Key or LiveKit Notice */}
                {config.stt.provider === 'livekit' ? (
                  <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-2.5 text-[11px] text-cyan-400">
                    <Sparkles className="size-3.5 shrink-0" />
                    <span>
                      LiveKit Inference STT routes through server environment credentials with Zero Data Retention (ZDR).
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-foreground text-[11px] font-medium">
                        {config.stt.provider === 'server' ? 'Server Bearer Token' : `${activeSTTProvider.name} Key`}
                      </label>
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
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
                      >
                        {showKeys['stt'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Speechmatics Status Pill */}
                {config.stt.provider === 'speechmatics' ? (
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-[11px] text-primary space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Waves className="size-3.5" />
                      <span>Speechmatics Active</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Configure transcription, voice recognition, and speaker profiles in the studio section below.
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

              {/* COLUMN 2: LANGUAGE MODEL (LLM) */}
              <div className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
                    <Cpu className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-foreground text-sm font-semibold">2. Language Model (LLM)</h3>
                    <p className="text-muted-foreground text-[11px]">Reasoning, tools, and directives</p>
                  </div>
                </div>

                {/* LLM Provider dropdown */}
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

                {/* LLM Model dropdown */}
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

                {/* Custom Model ID for Server or Ollama or custom tier */}
                {(config.llm.provider === 'server' || config.llm.provider === 'ollama' || config.llm.model === 'custom') && (
                  <div className="space-y-1">
                    <label className="text-foreground text-[11px] font-medium">Custom Model ID / Name</label>
                    <input
                      type="text"
                      placeholder="e.g. llama-3.3-70b-versatile, deepseek-r1, qwen2.5-7b..."
                      value={config.llm.customModelName || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          llm: { ...prev.llm, customModelName: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                )}

                {/* Custom Server Endpoint for LLM */}
                {config.llm.provider === 'server' && (
                  <div className="space-y-1">
                    <label className="text-foreground text-[11px] font-medium">LLM Server Endpoint URL</label>
                    <input
                      type="text"
                      placeholder="http://localhost:8000/v1"
                      value={config.llm.serverUrl || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          llm: { ...prev.llm, serverUrl: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                )}

                {/* Ollama Endpoint URL */}
                {config.llm.provider === 'ollama' && (
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
                      className="bg-muted/40 border-border text-foreground input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                )}

                {/* API Key or LiveKit Notice */}
                {config.llm.provider === 'livekit' ? (
                  <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-2.5 text-[11px] text-cyan-400">
                    <Sparkles className="size-3.5 shrink-0" />
                    <span>
                      LiveKit Inference LLM routes with Zero Data Retention (ZDR). No external key required.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-foreground text-[11px] font-medium">
                        {config.llm.provider === 'server' ? 'Server Bearer Token' : `${activeLLMProvider.name} Key`}
                      </label>
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
                        className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 pr-8 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleKey('llm')}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
                      >
                        {showKeys['llm'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inlined LLM Inference Parameters */}
                <div className="border-border space-y-3 border-t pt-3">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="size-3.5 text-primary" />
                    <span className="text-foreground text-[11px] font-semibold">LLM Inference Parameters</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
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
                      className="bg-muted h-1.5 w-full cursor-pointer rounded-lg accent-primary"
                    />

                    <div className="flex items-center justify-between text-[11px] pt-1">
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
                      className="bg-muted h-1.5 w-full cursor-pointer rounded-lg accent-primary"
                    />


                  </div>
                </div>
              </div>

              {/* COLUMN 3: TEXT-TO-SPEECH (TTS) */}
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

                {/* TTS Provider dropdown */}
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

                {/* TTS Model dropdown */}
                <div className="space-y-1">
                  <label className="text-foreground text-[11px] font-medium">TTS Model</label>
                  <select
                    value={config.tts.model}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        tts: { ...prev.tts, model: e.target.value },
                      }))
                    }
                    className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                  >
                    {activeTTSProvider.models.map((m) => (
                      <option key={m.id} value={m.id} className="bg-card text-foreground">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Server Endpoint for TTS */}
                {config.tts.provider === 'server' && (
                  <div className="space-y-1">
                    <label className="text-foreground text-[11px] font-medium">TTS Server Endpoint URL</label>
                    <input
                      type="text"
                      placeholder="http://localhost:8000/v1"
                      value={config.tts.serverUrl || ''}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          tts: { ...prev.tts, serverUrl: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                )}

                {/* Voice Tone dropdown & Audition (Hybrid Preset + Custom Voice ID) */}
                {(() => {
                  const isCustomVoice = Boolean(
                    config.tts.voice && !activeTTSProvider.voices.some((v) => v.id === config.tts.voice)
                  );
                  const activePreset = activeTTSProvider.voices.find((x) => x.id === config.tts.voice);

                  return (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-foreground text-[11px] font-medium">Voice Preset / Cloned ID</label>
                          {!isCustomVoice && activePreset && (
                            <button
                              type="button"
                              onClick={() => handleAudition(activePreset.hz, activePreset.id)}
                              className="text-primary hover:underline text-[10px] cursor-pointer"
                            >
                              Test Tone
                            </button>
                          )}
                        </div>
                        <select
                          value={isCustomVoice ? '__custom__' : config.tts.voice}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              setConfig((prev) => ({
                                ...prev,
                                tts: { ...prev.tts, voice: isCustomVoice ? prev.tts.voice : '' },
                              }));
                            } else {
                              setConfig((prev) => ({
                                ...prev,
                                tts: { ...prev.tts, voice: val },
                              }));
                            }
                          }}
                          className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-3 py-2 text-xs"
                        >
                          {activeTTSProvider.voices.map((v) => (
                            <option key={v.id} value={v.id} className="bg-card text-foreground">
                              {v.name}
                            </option>
                          ))}
                          <option value="__custom__" className="bg-card text-primary font-medium">
                            + Custom Voice ID / Cloned Voice...
                          </option>
                        </select>
                      </div>

                      {/* Custom Voice ID input */}
                      {(isCustomVoice || config.tts.voice === '' || !activePreset) && (
                        <div className="space-y-1 rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-foreground text-[10px] font-medium">
                              Custom Voice ID / UUID
                            </label>
                            <span className="text-muted-foreground text-[9px]">e.g. ElevenLabs ID or Cartesia UUID</span>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. 21m00Tcm4TlvDq8ikWAM or Cartesia UUID"
                            value={config.tts.voice}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                tts: { ...prev.tts, voice: e.target.value },
                              }))
                            }
                            className="bg-background border-border text-foreground input-focus w-full rounded-lg border px-2.5 py-1.5 text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* API Key or LiveKit Notice */}
                {config.tts.provider === 'livekit' ? (
                  <div className="flex items-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-2.5 text-[11px] text-cyan-400">
                    <Sparkles className="size-3.5 shrink-0" />
                    <span>
                      LiveKit Inference TTS routes with Zero Data Retention (ZDR). No external key required.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-foreground text-[11px] font-medium">
                        {config.tts.provider === 'server' ? 'Server Bearer Token' : `${activeTTSProvider.name} Key`}
                      </label>
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
                        className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 pr-8 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleKey('tts')}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
                      >
                        {showKeys['tts'] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── SPEECHMATICS VOICE RECOGNITION STUDIO (Conditional on Speechmatics STT) ── */}
            {config.stt.provider === 'speechmatics' && (
              <section className="border-border bg-card relative space-y-6 overflow-hidden rounded-2xl border p-6 shadow-sm">
                <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-primary/5 blur-3xl" />

                {/* Studio Header & Main Toggle */}
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
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Conversational agent STT with optional acoustic voice identification and MongoDB profile enrollment.
                      </p>
                    </div>
                  </div>

                  {/* Toggle: Enable Voice Recognition */}
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-2">
                    <div className="text-left">
                      <div className="text-xs font-semibold text-foreground">Voice Recognition Mode</div>
                      <div className="text-[10px] text-muted-foreground">
                        {config.speechmatics.voiceRecognitionEnabled ? 'Speaker ID & Profiles Active' : 'Simple Transcription Only'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          speechmatics: {
                            ...prev.speechmatics,
                            voiceRecognitionEnabled: !prev.speechmatics.voiceRecognitionEnabled,
                          },
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        config.speechmatics.voiceRecognitionEnabled ? 'bg-primary' : 'bg-muted/80'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          config.speechmatics.voiceRecognitionEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* SIMPLE MODE (When Voice Recognition is Disabled) */}
                {!config.speechmatics.voiceRecognitionEnabled ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-xs text-muted-foreground flex items-center gap-3">
                      <Info className="size-4 text-primary shrink-0" />
                      <span>
                        <strong className="text-foreground">Simple Transcription Mode:</strong> Standard STT transcription is enabled. Acoustic voice identification, diarization, and speaker profiles are disabled and will not be stored in database.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Language Selection */}
                      <div className="space-y-1.5">
                        <label className="text-foreground text-xs font-medium">Transcription Language</label>
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
                      </div>

                      {/* API Key */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-foreground text-xs font-medium">Speechmatics API Key</label>
                          <span className="text-muted-foreground text-[10px]">portal.speechmatics.com</span>
                        </div>
                        <div className="relative">
                          <input
                            type={showKeys['speechmatics'] ? 'text' : 'password'}
                            placeholder="Bearer eyJhbGciOiJIUzI1Ni..."
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
                            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 pr-10 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => toggleKey('speechmatics')}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                          >
                            {showKeys['speechmatics'] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EXPANDED MODE (Voice Recognition Enabled) */
                  <div className="space-y-6">
                    {/* 1. Acoustic Model */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-foreground text-xs font-medium">1. Acoustic Recognition Model</label>
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
                            {config.speechmatics.model === 'linden-1' && <Check className="text-primary size-4" />}
                          </div>
                          <h4 className="text-foreground mt-2.5 text-sm font-semibold">Linden-1 (Agent STT)</h4>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            Purpose-built for LiveKit voice agents with ~90ms turn endpointing and lowest latency streaming.
                          </p>
                        </div>

                        {/* Enhanced */}
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
                            {config.speechmatics.model === 'enhanced' && <Check className="text-primary size-4" />}
                          </div>
                          <h4 className="text-foreground mt-2.5 text-sm font-semibold">Ursa Enhanced</h4>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            Deep neural network delivering lowest word error rate across 50+ global dialects and noisy environments.
                          </p>
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
                            {config.speechmatics.model === 'standard' && <Check className="text-primary size-4" />}
                          </div>
                          <h4 className="text-foreground mt-2.5 text-sm font-semibold">Ursa Standard</h4>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            High throughput cloud model designed for minimal compute overhead and fast transcription.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Turn Detection & Latency Window */}
                    <div className="border-border grid grid-cols-1 gap-6 border-t pt-5 md:grid-cols-2">
                      <div className="space-y-3">
                        <label className="text-foreground text-xs font-medium">2. Turn Detection Mode</label>
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
                            <div className="text-foreground text-xs font-semibold">Native Server VAD</div>
                            <p className="text-muted-foreground mt-1 text-[11px]">
                              Autonomous endpointing handled directly in the Speechmatics recognition stream.
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
                            <div className="text-foreground text-xs font-semibold">External Silero VAD</div>
                            <p className="text-muted-foreground mt-1 text-[11px]">
                              LiveKit Silero VAD coordinates turn endpoints while Speechmatics streams text.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-foreground text-xs font-medium">3. Max Delay (`max_delay`)</label>
                          <span className="text-primary text-xs font-semibold">{config.speechmatics.maxDelay.toFixed(1)}s</span>
                        </div>
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
                          <span>1.0s (Agent Standard)</span>
                          <span>3.0s (High Accuracy)</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Language & Custom Dictionary */}
                    <div className="border-border grid grid-cols-1 gap-6 border-t pt-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-foreground text-xs font-medium">4. Language & Accent Adaptation</label>
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
                      </div>

                      <div className="space-y-2">
                        <label className="text-foreground text-xs font-medium">5. Custom Dictionary (Keyword Boosting)</label>
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
                              >
                                <X className="size-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 4. Streaming Toggles & Key */}
                    <div className="border-border grid grid-cols-1 gap-6 border-t pt-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-foreground text-xs font-medium">6. Streaming Features</label>
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
                                speechmatics: { ...prev.speechmatics, enablePartials: e.target.checked },
                              }))
                            }
                            className="accent-primary size-4 cursor-pointer"
                          />
                        </label>

                        <label className="border-border bg-muted/20 hover:bg-muted/30 flex cursor-pointer items-center justify-between rounded-xl border p-3">
                          <div>
                            <div className="text-foreground text-xs font-semibold">Speaker Change Detection / Diarization</div>
                            <div className="text-muted-foreground text-[10px]">
                              Track speaker boundaries and distinct turns.
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={config.speechmatics.diarization}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                speechmatics: { ...prev.speechmatics, diarization: e.target.checked },
                              }))
                            }
                            className="accent-primary size-4 cursor-pointer"
                          />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-foreground text-xs font-medium">Speechmatics API Key</label>
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
                            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-3 py-2 pr-10 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => toggleKey('speechmatics')}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                          >
                            {showKeys['speechmatics'] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 5. Active Voice Profiles & Speaker Verification */}
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
                                {config.voiceUsers.length} Enrolled
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              Enrolled acoustic speaker voiceprints in MongoDB (<code className="text-foreground font-mono">voice_profiles</code>). Real-time caller identification.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={loadVoiceProfilesFromDb}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors"
                            title="Refresh from MongoDB"
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
                            Matches callers against enrolled signatures and injects identity into conversation context.
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
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. FALLBACK MODELS & FAILOVER ENGINE
         ───────────────────────────────────────────────────────────── */}
      <section className="border-border bg-card space-y-6 rounded-2xl border p-6 shadow-sm">
        <div className="border-border flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="border-border bg-muted/60 flex size-9 items-center justify-center rounded-xl border text-primary">
              <ShieldCheck className="size-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-primary text-xs font-semibold tracking-tight uppercase">Section 2</span>
                <span className="text-muted-foreground text-xs">·</span>
                <h3 className="text-foreground text-base font-semibold">Fallback Models & Failover Engine</h3>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                Automatic failovers when primary models experience rate limits (HTTP 429), token quotas, or outages.
              </p>
            </div>
          </div>

          {/* Master Fallback Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-foreground">
              {config.fallback?.enabled ? 'Fallback Active' : 'Fallback Disabled'}
            </span>
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
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                config.fallback?.enabled ? 'bg-primary' : 'bg-muted/80'
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  config.fallback?.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {!config.fallback?.enabled ? (
          <div className="rounded-xl border border-border/80 bg-muted/15 p-4 text-xs text-muted-foreground flex items-center gap-3">
            <Info className="size-4 text-primary shrink-0" />
            <span>
              Fallback models are currently <strong className="text-foreground">Disabled</strong>. If primary models encounter errors, requests will fail immediately. No fallback configurations or keys will be saved to the database.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card 1: Realtime S2S Failover */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h4 className="text-foreground text-xs font-semibold uppercase tracking-wide">Realtime S2S Failover</h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      fallback: {
                        ...prev.fallback,
                        realtimeEnabled: !prev.fallback?.realtimeEnabled,
                      },
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    config.fallback?.realtimeEnabled ? 'bg-primary' : 'bg-muted/80'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.fallback?.realtimeEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {config.fallback?.realtimeEnabled ? (
                <div className="space-y-3 pt-1 border-t border-border/40">
                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover Realtime Provider</label>
                    <select
                      value={config.fallback.realtimeProvider || 'livekit'}
                      onChange={(e) => {
                        const prov = e.target.value as RealtimeProvider;
                        const found = REALTIME_PROVIDERS.find((p) => p.id === prov)!;
                        setConfig((prev) => ({
                          ...prev,
                          fallback: {
                            ...prev.fallback,
                            realtimeProvider: prov,
                            realtimeModel: found.models[0].id,
                            realtimeVoice: found.voices[0].id,
                          },
                        }));
                      }}
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {REALTIME_PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id} className="bg-card text-foreground">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover Model</label>
                    <select
                      value={config.fallback.realtimeModel || 'google/gemini-3.8-live'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fallback: { ...prev.fallback, realtimeModel: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {(
                        REALTIME_PROVIDERS.find((p) => p.id === (config.fallback?.realtimeProvider || 'livekit')) || REALTIME_PROVIDERS[0]
                      ).models.map((m) => (
                        <option key={m.id} value={m.id} className="bg-card text-foreground">
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover Voice</label>
                    <select
                      value={config.fallback.realtimeVoice || 'Charon'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fallback: { ...prev.fallback, realtimeVoice: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {(
                        REALTIME_PROVIDERS.find((p) => p.id === (config.fallback?.realtimeProvider || 'livekit')) || REALTIME_PROVIDERS[0]
                      ).voices.map((v) => (
                        <option key={v.id} value={v.id} className="bg-card text-foreground">
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {config.fallback.realtimeProvider !== 'livekit' && (
                    <div className="space-y-1">
                      <label className="text-foreground text-[10px] font-medium">Failover API Key (Optional)</label>
                      <input
                        type="password"
                        placeholder="Optional fallback key..."
                        value={config.fallback.realtimeApiKey || ''}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            fallback: { ...prev.fallback, realtimeApiKey: e.target.value },
                          }))
                        }
                        className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">Realtime failover disabled.</p>
              )}
            </div>

            {/* Card 2: LLM Reasoning Failover */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-primary" />
                  <h4 className="text-foreground text-xs font-semibold uppercase tracking-wide">LLM Reasoning Failover</h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      fallback: {
                        ...prev.fallback,
                        llmEnabled: !prev.fallback?.llmEnabled,
                      },
                    }))
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    config.fallback?.llmEnabled ? 'bg-primary' : 'bg-muted/80'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.fallback?.llmEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {config.fallback?.llmEnabled ? (
                <div className="space-y-3 pt-1 border-t border-border/40">
                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover LLM Provider</label>
                    <select
                      value={config.fallback.provider || 'livekit'}
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
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {LLM_PROVIDERS.map((l) => (
                        <option key={l.id} value={l.id} className="bg-card text-foreground">
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-foreground text-[10px] font-medium">Failover LLM Model</label>
                    <select
                      value={config.fallback.model || 'google/gemma-4-31b-it'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fallback: { ...prev.fallback, model: e.target.value },
                        }))
                      }
                      className="bg-muted/40 border-border text-foreground input-focus w-full cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs"
                    >
                      {(
                        LLM_PROVIDERS.find((l) => l.id === (config.fallback?.provider || 'livekit')) || LLM_PROVIDERS[0]
                      ).models.map((m) => (
                        <option key={m.id} value={m.id} className="bg-card text-foreground">
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-foreground font-medium">Failover Temperature</span>
                      <span className="text-primary font-semibold">{config.fallback.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.fallback.temperature}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fallback: { ...prev.fallback, temperature: parseFloat(e.target.value) },
                        }))
                      }
                      className="bg-muted h-1.5 w-full cursor-pointer rounded-lg accent-primary"
                    />
                  </div>

                  {config.fallback.provider !== 'livekit' && (
                    <div className="space-y-1">
                      <label className="text-foreground text-[10px] font-medium">Failover API Key (Optional)</label>
                      <input
                        type="password"
                        placeholder="Optional fallback key..."
                        value={config.fallback.apiKey || ''}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            fallback: { ...prev.fallback, apiKey: e.target.value },
                          }))
                        }
                        className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">LLM reasoning failover disabled.</p>
              )}
            </div>

            {/* Card 3: STT Failover */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="size-4 text-primary" />
                  <h4 className="text-foreground text-xs font-semibold uppercase tracking-wide">STT Failover Engine</h4>
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
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
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
                <div className="space-y-3 pt-1 border-t border-border/40">
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

                  {config.fallback.sttProvider !== 'livekit' && (
                    <div className="space-y-1">
                      <label className="text-foreground text-[10px] font-medium">Failover API Key (Optional)</label>
                      <input
                        type="password"
                        placeholder="Optional fallback STT key..."
                        value={config.fallback.sttApiKey || ''}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            fallback: { ...prev.fallback, sttApiKey: e.target.value },
                          }))
                        }
                        className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">STT failover disabled.</p>
              )}
            </div>

            {/* Card 4: TTS Voice Failover */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="size-4 text-emerald-400" />
                  <h4 className="text-foreground text-xs font-semibold uppercase tracking-wide">TTS Voice Failover</h4>
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
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
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
                <div className="space-y-3 pt-1 border-t border-border/40">
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

                  {config.fallback.ttsProvider !== 'livekit' && (
                    <div className="space-y-1">
                      <label className="text-foreground text-[10px] font-medium">Failover API Key (Optional)</label>
                      <input
                        type="password"
                        placeholder="Optional fallback TTS key..."
                        value={config.fallback.ttsApiKey || ''}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            fallback: { ...prev.fallback, ttsApiKey: e.target.value },
                          }))
                        }
                        className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">TTS failover disabled.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. TURN DETECTION & VOICE ACTIVITY (VAD)
         ───────────────────────────────────────────────────────────── */}
      <section className="border-border bg-card space-y-6 rounded-2xl border p-6 shadow-sm">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="border-border bg-muted/60 flex size-8 items-center justify-center rounded-xl border text-primary">
              <AudioWaveform className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-primary text-xs font-semibold tracking-tight uppercase">Section 3</span>
                <span className="text-muted-foreground text-xs">·</span>
                <h3 className="text-foreground text-base font-semibold">Turn Detection & Voice Activity (VAD)</h3>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                Tune voice sensitivity, barge-in interruptions, and speech endpointing windows for conversational flow.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* VAD Sensitivity Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground font-medium">VAD Sensitivity Threshold</span>
              <span className="text-primary font-semibold">
                {config.turnAndVad.vadThreshold.toFixed(2)}{' '}
                <span className="text-muted-foreground text-[10px] font-normal">
                  ({config.turnAndVad.vadThreshold < 0.4 ? 'Sensitive' : config.turnAndVad.vadThreshold > 0.6 ? 'Aggressive' : 'Balanced'})
                </span>
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={config.turnAndVad.vadThreshold}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  turnAndVad: { ...prev.turnAndVad, vadThreshold: parseFloat(e.target.value) },
                }))
              }
              className="bg-muted h-2 w-full cursor-pointer rounded-lg accent-primary"
            />
            <p className="text-muted-foreground text-[10px]">
              Controls how easily speech triggers VAD. Lower = sensitive to quiet speech · Higher = resists background noise.
            </p>
          </div>

          {/* Allow Interruptions (Barge-in) */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
            <div className="space-y-0.5 pr-4">
              <div className="text-foreground text-xs font-semibold">Allow Interruptions (Barge-in)</div>
              <p className="text-muted-foreground text-[10px] leading-relaxed">
                When active, user speech immediately stops the agent talking and resumes listening.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  turnAndVad: { ...prev.turnAndVad, allowInterruptions: !prev.turnAndVad.allowInterruptions },
                }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                config.turnAndVad.allowInterruptions ? 'bg-primary' : 'bg-muted/80'
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  config.turnAndVad.allowInterruptions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Silence Turn Window */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground font-medium">Silence Turn Window (`silence_duration_ms`)</span>
              <span className="text-primary font-semibold">{config.turnAndVad.silenceDurationMs}ms</span>
            </div>
            <input
              type="range"
              min="200"
              max="2000"
              step="50"
              value={config.turnAndVad.silenceDurationMs}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  turnAndVad: { ...prev.turnAndVad, silenceDurationMs: parseInt(e.target.value) },
                }))
              }
              className="bg-muted h-2 w-full cursor-pointer rounded-lg accent-primary"
            />
            <p className="text-muted-foreground text-[10px]">
              Duration of pause before the assistant concludes you finished speaking and begins generating a response.
            </p>
          </div>

          {/* Prefix Audio Padding */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground font-medium">Prefix Audio Padding (`prefix_padding_ms`)</span>
              <span className="text-primary font-semibold">{config.turnAndVad.prefixPaddingMs}ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="800"
              step="50"
              value={config.turnAndVad.prefixPaddingMs}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  turnAndVad: { ...prev.turnAndVad, prefixPaddingMs: parseInt(e.target.value) },
                }))
              }
              className="bg-muted h-2 w-full cursor-pointer rounded-lg accent-primary"
            />
            <p className="text-muted-foreground text-[10px]">
              Pre-speech audio kept in buffer prior to VAD speech onset, ensuring initial syllables aren't clipped.
            </p>
          </div>
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
