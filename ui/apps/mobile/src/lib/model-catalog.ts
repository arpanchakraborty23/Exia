/**
 * Model & provider catalogs — ported 1:1 from the legacy web
 * `model-selection-view.tsx` (the "Models & Provider Credentials" page).
 * These feed the mobile settings screen's selects, persona grids, and the
 * estimated-pipeline-latency banner. Do not rename ids: they are persisted
 * into the backend's `/models/config` document.
 */

export interface CatalogModel {
  id: string;
  name: string;
}

export interface CatalogVoice {
  id: string;
  name: string;
  hz: number;
}

interface CatalogProvider {
  id: string;
  name: string;
  badge?: string;
  /** Rough added latency in ms (drives the modular pipeline banner). */
  latency?: number;
  keyPlaceholder: string;
  keyHelp?: string;
  /** LiveKit Inference routes use project credentials — no user key. */
  isLiveKitInference?: boolean;
  isLocal?: boolean;
  models: CatalogModel[];
  voices?: CatalogVoice[];
}

export type { CatalogProvider };

// 1. REALTIME S2S PROVIDERS ---------------------------------------------------

export const REALTIME_PROVIDERS: CatalogProvider[] = [
  {
    id: 'livekit',
    name: 'LiveKit Inference (Realtime Voice S2S)',
    badge: 'ZERO RETENTION S2S',
    latency: 130,
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
    id: 'google',
    name: 'Google Gemini Live',
    badge: 'SUB-SECOND S2S',
    latency: 180,
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
    id: 'openai',
    name: 'OpenAI Realtime API',
    badge: 'WEBRTC / WEBSOCKET',
    latency: 240,
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

// 2. MODULAR: SPEECH-TO-TEXT --------------------------------------------------

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

export const STT_PROVIDERS: CatalogProvider[] = [
  {
    id: 'livekit',
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
    id: 'speechmatics',
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
    id: 'deepgram',
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
    id: 'openai',
    name: 'OpenAI Whisper',
    badge: 'MULTILINGUAL',
    keyPlaceholder: 'sk-proj-...',
    keyHelp: 'platform.openai.com/api-keys',
    latency: 160,
    models: [{ id: 'whisper-1', name: 'Whisper-1 (Universal Multilingual STT)' }],
  },
  {
    id: 'google',
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

// 3. MODULAR: LANGUAGE MODEL --------------------------------------------------

export const LLM_PROVIDERS: CatalogProvider[] = [
  {
    id: 'livekit',
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
    id: 'anthropic',
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
    id: 'openai',
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
    id: 'google',
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
    id: 'ollama',
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

// 4. MODULAR: TEXT-TO-SPEECH --------------------------------------------------

export const TTS_PROVIDERS: CatalogProvider[] = [
  {
    id: 'livekit',
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
    id: 'cartesia',
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
    id: 'elevenlabs',
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
    id: 'openai',
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
    id: 'speechmatics',
    name: 'Speechmatics Flow TTS (Preview)',
    keyPlaceholder: 'Bearer key...',
    keyHelp: 'portal.speechmatics.com',
    latency: 120,
    models: [{ id: 'speechmatics-flow-v1', name: 'Speechmatics Flow Neural Voice Engine' }],
    voices: [
      { id: 'sarah', name: 'Sarah (Natural & Articulate)', hz: 260 },
      { id: 'theo', name: 'Theo (Warm & Grounded)', hz: 180 },
      { id: 'megan', name: 'Megan (Clear & Dynamic)', hz: 300 },
    ],
  },
  {
    id: 'google',
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

/** Find a provider entry by id within a catalog. */
export function findProvider(catalog: CatalogProvider[], id: string): CatalogProvider | undefined {
  return catalog.find((p) => p.id === id);
}
