import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '@exia/design-tokens';
import { DEFAULT_MODEL_CONFIG } from '@exia/api-client';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { ModelConfig } from '@exia/shared-types';

import { API_BASE_URL, api, tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY } from '@/lib/auth';
import {
  LLM_PROVIDERS,
  REALTIME_PROVIDERS,
  SPEECHMATICS_LANGUAGES,
  STT_PROVIDERS,
  TTS_PROVIDERS,
  findProvider,
  type CatalogProvider,
} from '@/lib/model-catalog';
import { ExiaInput, ErrorState, Field, Loading, ScreenHeader, Segmented } from '@/components/ui';
import {
  BadgePill,
  SectionCard,
  SelectField,
  StepperRow,
  ToggleRow,
  type SelectOption,
} from '@/components/models/controls';

// ---------------------------------------------------------------------------
// Form model — draft merged over the loaded backend config (no
// state-syncing effects). Field names mirror the legacy FullModelConfig.
// ---------------------------------------------------------------------------

interface SettingsForm {
  architecture: 'realtime' | 'modular';
  // LiveKit orchestrator
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  // Realtime S2S
  realtimeProvider: string;
  realtimeApiKey: string;
  realtimeModel: string;
  realtimeVoice: string;
  // Modular STT
  sttProvider: string;
  sttApiKey: string;
  sttModel: string;
  // Modular LLM
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
  ollamaBaseUrl: string;
  // Modular TTS
  ttsProvider: string;
  ttsApiKey: string;
  ttsModel: string;
  // Fallback engines
  fallbackEnabled: boolean;
  fallbackProvider: string;
  fallbackModel: string;
  fallbackTemperature: number;
  fallbackApiKey: string;
  fallbackSttEnabled: boolean;
  fallbackSttProvider: string;
  fallbackSttModel: string;
  fallbackSttApiKey: string;
  fallbackTtsEnabled: boolean;
  fallbackTtsProvider: string;
  fallbackTtsModel: string;
  fallbackTtsVoice: string;
  fallbackTtsApiKey: string;
  // Speechmatics advanced
  speechmaticsApiKey: string;
  speechmaticsModel: string;
  speechmaticsLanguage: string;
  speechmaticsTurnDetection: 'vad' | 'external';
  speechmaticsMaxDelay: number;
  speechmaticsEnablePartials: boolean;
  speechmaticsDictionary: string;
  speechmaticsDiarization: boolean;
  speechmaticsSpeakerIdentification: boolean;
  speechmaticsVoiceProfileName: string;
  speechmaticsSpeakerThreshold: number;
  // Inference tuning
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPromptOverride: string;
}

type LoadedModelConfig = Awaited<ReturnType<typeof api.models.getConfig>>;

/** Backend config → form (port of the legacy load mapping, lines 680-767). */
function formFromConfig(c: LoadedModelConfig): SettingsForm {
  const lk = c.livekit ?? {};
  const geminiKey = c.gemini_api_key ?? '';
  const openaiKey = c.openai_api_key ?? '';
  const anthropicKey = c.anthropic_api_key ?? '';
  const deepgramKey = c.deepgram_api_key ?? '';
  const cartesiaKey = c.cartesia_api_key ?? '';
  const speechmaticsKey = c.speechmatics_api_key ?? '';

  // The wire stores only gemini_model/gemini_voice for the S2S engine —
  // derive the provider from the model id shape (legacy kept it in
  // localStorage; mobile has none, so infer like the save routing implies).
  const model = c.gemini_model || DEFAULT_MODEL_CONFIG.gemini_model;
  const realtimeProvider = model.includes('/')
    ? 'livekit'
    : model.startsWith('gpt')
      ? 'openai'
      : 'google';

  const sttProvider = (c.stt_provider || DEFAULT_MODEL_CONFIG.stt_provider).toLowerCase();
  const llmProvider = (c.llm_provider || DEFAULT_MODEL_CONFIG.llm_provider).toLowerCase();
  const ttsProvider = (c.tts_provider || DEFAULT_MODEL_CONFIG.tts_provider).toLowerCase();

  return {
    architecture: (c.pipeline_mode ?? c.mode) === 'modular' ? 'modular' : 'realtime',
    livekitUrl: lk.url || c.livekit_url || '',
    livekitApiKey: lk.apiKey || c.livekit_api_key || '',
    livekitApiSecret: lk.apiSecret || c.livekit_api_secret || '',
    realtimeProvider,
    realtimeApiKey:
      realtimeProvider === 'google' ? geminiKey : realtimeProvider === 'openai' ? openaiKey : '',
    realtimeModel: model,
    realtimeVoice: c.gemini_voice || 'Charon',
    sttProvider,
    sttApiKey:
      sttProvider === 'deepgram'
        ? deepgramKey
        : sttProvider === 'speechmatics'
          ? speechmaticsKey
          : '',
    sttModel: c.stt_model || DEFAULT_MODEL_CONFIG.stt_model,
    llmProvider,
    llmApiKey:
      llmProvider === 'google'
        ? geminiKey
        : llmProvider === 'openai'
          ? openaiKey
          : llmProvider === 'anthropic'
            ? anthropicKey
            : '',
    llmModel: c.llm_model || DEFAULT_MODEL_CONFIG.llm_model,
    ollamaBaseUrl: c.ollama_base_url ?? '',
    ttsProvider,
    ttsApiKey: ttsProvider === 'cartesia' ? cartesiaKey : ttsProvider === 'openai' ? openaiKey : '',
    ttsModel: c.tts_model || DEFAULT_MODEL_CONFIG.tts_model,
    fallbackEnabled: c.fallback_enabled ?? false,
    fallbackProvider: (c.fallback_provider || 'livekit').toLowerCase(),
    fallbackModel: c.fallback_model || 'google/gemma-4-31b-it',
    fallbackTemperature: c.fallback_temperature ?? 0.7,
    fallbackApiKey: c.fallback_api_key ?? '',
    fallbackSttEnabled: c.fallback_stt_enabled ?? false,
    fallbackSttProvider: (c.fallback_stt_provider || 'livekit').toLowerCase(),
    fallbackSttModel: c.fallback_stt_model || 'deepgram/nova-3',
    fallbackSttApiKey: c.fallback_stt_api_key ?? '',
    fallbackTtsEnabled: c.fallback_tts_enabled ?? false,
    fallbackTtsProvider: (c.fallback_tts_provider || 'livekit').toLowerCase(),
    fallbackTtsModel: c.fallback_tts_model || 'cartesia/sonic-3.6',
    fallbackTtsVoice: c.fallback_tts_voice || 'baritone-us',
    fallbackTtsApiKey: c.fallback_tts_api_key ?? '',
    speechmaticsApiKey: speechmaticsKey,
    speechmaticsModel: c.speechmatics_model ?? 'linden-1',
    speechmaticsLanguage: c.speechmatics_language ?? 'en',
    speechmaticsTurnDetection: c.speechmatics_turn_detection ?? 'vad',
    speechmaticsMaxDelay: c.speechmatics_max_delay ?? 1.0,
    speechmaticsEnablePartials: c.speechmatics_enable_partials ?? true,
    speechmaticsDictionary: c.speechmatics_custom_dictionary ?? '',
    speechmaticsDiarization: c.speechmatics_diarization ?? false,
    speechmaticsSpeakerIdentification: c.speechmatics_speaker_identification ?? false,
    speechmaticsVoiceProfileName: c.speechmatics_voice_profile_name ?? '',
    speechmaticsSpeakerThreshold: c.speechmatics_speaker_threshold ?? 0.82,
    temperature: c.temperature ?? 0.7,
    topP: c.top_p ?? 0.95,
    maxTokens: c.max_output_tokens ?? 1024,
    systemPromptOverride: c.system_prompt_override ?? '',
  };
}

// ---------------------------------------------------------------------------
// Option builders
// ---------------------------------------------------------------------------

function providerOptions(catalog: CatalogProvider[]): SelectOption[] {
  return catalog.map((p) => ({
    value: p.id,
    label: p.name,
    hint: [p.badge, p.latency != null ? `~${p.latency}ms` : null].filter(Boolean).join(' · '),
  }));
}

function modelOptions(p: CatalogProvider | undefined, stored: string): SelectOption[] {
  const options: SelectOption[] = (p?.models ?? []).map((m) => ({ value: m.id, label: m.name }));
  // Keep a stored/custom model visible even if it is not in the catalog.
  if (stored && !options.some((o) => o.value === stored)) {
    options.unshift({ value: stored, label: `${stored} (stored)` });
  }
  return options;
}

function voiceOptions(p: CatalogProvider | undefined, stored: string): SelectOption[] {
  const options: SelectOption[] = (p?.voices ?? []).map((v) => ({
    value: v.id,
    label: v.name,
    hint: `${v.hz} Hz`,
  }));
  if (stored && !options.some((o) => o.value === stored)) {
    options.unshift({ value: stored, label: `${stored} (stored)` });
  }
  return options;
}

/** Picks provider + snaps model/voice to the new provider's catalogs. */
function providerPatch(
  catalog: CatalogProvider[],
  id: string,
  current: { model: string; voice?: string },
): { model: string; voice?: string } {
  const p = findProvider(catalog, id);
  const models = p?.models ?? [];
  const voices = p?.voices ?? [];
  const model = models.some((m) => m.id === current.model)
    ? current.model
    : (models[0]?.id ?? current.model);
  const voice =
    current.voice == null
      ? undefined
      : voices.some((v) => v.id === current.voice)
        ? current.voice
        : (voices[0]?.id ?? current.voice);
  return voice === undefined ? { model } : { model, voice };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

/**
 * Settings tab — "Models & Provider Credentials", the full port of the
 * legacy model-selection-view: LiveKit orchestrator, realtime S2S vs
 * modular pipeline (STT/LLM/TTS with latency estimate + failover),
 * Speechmatics advanced recognition, voice profiles, and inference tuning.
 */
export default function Settings() {
  const t = useTheme();
  const queryClient = useQueryClient();

  const config = useQuery({
    queryKey: ['models-config'],
    queryFn: () => api.models.getConfig(),
  });

  const [draft, setDraft] = useState<Partial<SettingsForm>>({});
  const set = (patch: Partial<SettingsForm>) => setDraft((d) => ({ ...d, ...patch }));

  const form = config.data ? { ...formFromConfig(config.data), ...draft } : null;

  // Derived catalogs for the current selections
  const realtimeP = form ? findProvider(REALTIME_PROVIDERS, form.realtimeProvider) : undefined;
  const sttP = form ? findProvider(STT_PROVIDERS, form.sttProvider) : undefined;
  const llmP = form ? findProvider(LLM_PROVIDERS, form.llmProvider) : undefined;
  const ttsP = form ? findProvider(TTS_PROVIDERS, form.ttsProvider) : undefined;
  const pipelineLatency = form
    ? (sttP?.latency ?? 0) + (llmP?.latency ?? 0) + (ttsP?.latency ?? 0)
    : 0;

  const save = useMutation({
    mutationFn: () => {
      const c = config.data;
      if (!c) throw new Error('Config not loaded');
      const f = { ...formFromConfig(c), ...draft };

      // API-key routing — port of legacy lines 871-890: each section's key
      // is persisted into the provider's canonical config field.
      let geminiKey = '';
      let openaiKey = '';
      let anthropicKey = '';
      let deepgramKey = '';
      let cartesiaKey = '';
      const speechmaticsKey =
        f.speechmaticsApiKey || (f.sttProvider === 'speechmatics' ? f.sttApiKey : '');

      if (f.realtimeProvider === 'google' && f.realtimeApiKey) geminiKey = f.realtimeApiKey;
      if (f.realtimeProvider === 'openai' && f.realtimeApiKey) openaiKey = f.realtimeApiKey;

      if (f.llmProvider === 'google' && f.llmApiKey) geminiKey = f.llmApiKey;
      if (f.llmProvider === 'openai' && f.llmApiKey) openaiKey = f.llmApiKey;
      if (f.llmProvider === 'anthropic' && f.llmApiKey) anthropicKey = f.llmApiKey;

      if (f.sttProvider === 'deepgram' && f.sttApiKey) deepgramKey = f.sttApiKey;
      if (f.ttsProvider === 'cartesia' && f.ttsApiKey) cartesiaKey = f.ttsApiKey;
      if (f.ttsProvider === 'openai' && f.ttsApiKey && !openaiKey) openaiKey = f.ttsApiKey;

      const payload: Partial<ModelConfig> = {
        mode: f.architecture === 'realtime' ? 'gemini_live' : 'modular',
        pipeline_mode: f.architecture === 'realtime' ? 'gemini_live' : 'modular',
        livekit_url: f.livekitUrl || undefined,
        livekit_api_key: f.livekitApiKey || undefined,
        livekit_api_secret: f.livekitApiSecret || undefined,
        gemini_model: f.realtimeModel,
        gemini_voice: f.realtimeVoice,
        stt_provider: f.sttProvider,
        stt_model: f.sttModel,
        llm_provider: f.llmProvider,
        llm_model: f.llmModel,
        tts_provider: f.ttsProvider,
        tts_model: f.ttsModel,
        temperature: f.temperature,
        top_p: f.topP,
        max_output_tokens: f.maxTokens,
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        anthropic_api_key: anthropicKey || undefined,
        deepgram_api_key: deepgramKey || undefined,
        cartesia_api_key: cartesiaKey || undefined,
        speechmatics_api_key: speechmaticsKey || undefined,
        fallback_enabled: f.fallbackEnabled,
        fallback_provider: f.fallbackProvider,
        fallback_model: f.fallbackModel,
        fallback_temperature: f.fallbackTemperature,
        fallback_api_key: f.fallbackApiKey || undefined,
        fallback_stt_enabled: f.fallbackSttEnabled,
        fallback_stt_provider: f.fallbackSttProvider,
        fallback_stt_model: f.fallbackSttModel,
        fallback_stt_api_key: f.fallbackSttApiKey || undefined,
        fallback_tts_enabled: f.fallbackTtsEnabled,
        fallback_tts_provider: f.fallbackTtsProvider,
        fallback_tts_model: f.fallbackTtsModel,
        fallback_tts_voice: f.fallbackTtsVoice,
        fallback_tts_api_key: f.fallbackTtsApiKey || undefined,
        speechmatics_model: f.speechmaticsModel,
        speechmatics_language: f.speechmaticsLanguage,
        speechmatics_turn_detection: f.speechmaticsTurnDetection,
        speechmatics_max_delay: f.speechmaticsMaxDelay,
        speechmatics_enable_partials: f.speechmaticsEnablePartials,
        speechmatics_custom_dictionary: f.speechmaticsDictionary,
        speechmatics_diarization: f.speechmaticsDiarization,
        speechmatics_speaker_identification: f.speechmaticsSpeakerIdentification,
        speechmatics_voice_profile_name: f.speechmaticsVoiceProfileName || undefined,
        speechmatics_speaker_threshold: f.speechmaticsSpeakerThreshold,
        system_prompt_override: f.systemPromptOverride || undefined,
      };

      // Full merged payload — the backend PUT replaces the stored doc.
      return api.models.updateConfig({ ...c, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models-config'] });
      setDraft({});
    },
  });

  async function handleSignOut() {
    await tokenStorage.setToken(null);
    queryClient.clear();
    queryClient.setQueryData(AUTH_TOKEN_KEY, null);
    router.replace('/login');
  }

  if (config.isLoading || !form) {
    return (
      <ExiaScreen>
        <ScreenHeader title="Model Settings" subtitle="Models & provider credentials" />
        <Loading label="Loading configuration…" />
      </ExiaScreen>
    );
  }

  if (config.isError && !config.data) {
    return (
      <ExiaScreen>
        <ScreenHeader title="Model Settings" subtitle="Models & provider credentials" />
        <ErrorState
          message={config.error instanceof Error ? config.error.message : 'Failed to load config'}
          onRetry={() => config.refetch()}
        />
      </ExiaScreen>
    );
  }

  return (
    <ExiaScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Model Settings" subtitle="Models & provider credentials" />

        {/* Architecture switch — legacy's two top-level cards */}
        <SectionCard title="Speech Architecture" badge="ENGINE">
          <Segmented
            accessibilityLabel="Speech architecture"
            options={['realtime', 'modular'] as const}
            value={form.architecture}
            onChange={(architecture) => set({ architecture })}
          />
          <ExiaText variant="caption">
            {form.architecture === 'realtime'
              ? 'Realtime S2S — speech-to-speech model handles listening, reasoning and speaking in one pass (lowest latency).'
              : 'Modular pipeline — separate STT → LLM → TTS stages with per-stage provider choice and failover.'}
          </ExiaText>
        </SectionCard>

        {/* LiveKit orchestrator credentials */}
        <SectionCard title="LiveKit Orchestrator" badge="SFU GATEWAY">
          <Field label="Server URL">
            <ExiaInput
              autoCapitalize="none"
              keyboardType="url"
              placeholder="wss://your-project.livekit.cloud"
              value={form.livekitUrl}
              onChangeText={(livekitUrl) => set({ livekitUrl })}
            />
          </Field>
          <Field label="API key">
            <ExiaInput
              autoCapitalize="none"
              placeholder="API key (dev keys start with 'devkey')"
              value={form.livekitApiKey}
              onChangeText={(livekitApiKey) => set({ livekitApiKey })}
            />
          </Field>
          <Field label="API secret">
            <ExiaInput
              autoCapitalize="none"
              secureTextEntry
              placeholder="API secret"
              value={form.livekitApiSecret}
              onChangeText={(livekitApiSecret) => set({ livekitApiSecret })}
            />
          </Field>
        </SectionCard>

        {form.architecture === 'realtime' ? (
          // ---------------------------------------------------------------
          // Realtime S2S
          // ---------------------------------------------------------------
          <SectionCard
            title="Realtime Speech-to-Speech"
            badge={realtimeP?.badge}
          >
            <SelectField
              label="Provider"
              value={form.realtimeProvider}
              options={providerOptions(REALTIME_PROVIDERS)}
              onChange={(id) => {
                const snap = providerPatch(REALTIME_PROVIDERS, id, {
                  model: form.realtimeModel,
                  voice: form.realtimeVoice,
                });
                set({
                  realtimeProvider: id,
                  realtimeModel: snap.model,
                  realtimeVoice: snap.voice ?? form.realtimeVoice,
                });
              }}
            />
            {realtimeP?.isLiveKitInference ? (
              <ExiaText variant="caption">
                Managed by LiveKit Project credentials — no API key needed
                {realtimeP.keyHelp ? ` (${realtimeP.keyHelp})` : ''}.
              </ExiaText>
            ) : (
              <Field label="API key">
                <ExiaInput
                  autoCapitalize="none"
                  secureTextEntry
                  placeholder={realtimeP?.keyPlaceholder ?? 'API key'}
                  value={form.realtimeApiKey}
                  onChangeText={(realtimeApiKey) => set({ realtimeApiKey })}
                />
              </Field>
            )}
            <SelectField
              label="Model"
              value={form.realtimeModel}
              options={modelOptions(realtimeP, form.realtimeModel)}
              onChange={(realtimeModel) => set({ realtimeModel })}
            />
            {realtimeP?.latency != null ? (
              <ExiaText variant="caption">
                Provider latency: ~{realtimeP.latency}ms round-trip.
              </ExiaText>
            ) : null}

            {/* Voice persona grid — legacy "Voice Persona & Delivery Tone" */}
            <ExiaText variant="caption">Voice persona & delivery tone</ExiaText>
            <View style={styles.personaGrid}>
              {(realtimeP?.voices ?? []).map((v) => {
                const active = v.id === form.realtimeVoice;
                return (
                  <Pressable
                    key={v.id}
                    accessibilityLabel={`Select persona ${v.name}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => set({ realtimeVoice: v.id })}
                    style={({ pressed }) => [
                      styles.personaPill,
                      {
                        borderColor: active ? t.primary : t.border,
                        backgroundColor: active ? t.input : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <ExiaText numberOfLines={1} style={styles.personaName}>
                      {v.name}
                    </ExiaText>
                    <ExiaText variant="caption">{v.hz} Hz</ExiaText>
                  </Pressable>
                );
              })}
            </View>
            {(realtimeP?.voices?.length ?? 0) === 0 ? (
              <ExiaText variant="caption">Stored voice: {form.realtimeVoice}</ExiaText>
            ) : null}
          </SectionCard>
        ) : (
          // ---------------------------------------------------------------
          // Modular pipeline
          // ---------------------------------------------------------------
          <>
            <ExiaCard style={styles.latencyBanner}>
              <ExiaText variant="caption">Estimated pipeline latency</ExiaText>
              <ExiaText variant="title">~{pipelineLatency}ms</ExiaText>
              <ExiaText variant="caption">
                STT {sttP?.latency ?? '—'}ms + LLM {llmP?.latency ?? '—'}ms + TTS{' '}
                {ttsP?.latency ?? '—'}ms — sum of per-stage provider latencies.
              </ExiaText>
            </ExiaCard>

            {/* STT */}
            <SectionCard title="Speech-to-Text" badge={sttP?.badge}>
              <SelectField
                label="STT provider"
                value={form.sttProvider}
                options={providerOptions(STT_PROVIDERS)}
                onChange={(id) => {
                  const snap = providerPatch(STT_PROVIDERS, id, { model: form.sttModel });
                  set({ sttProvider: id, sttModel: snap.model });
                }}
              />
              {sttP?.isLiveKitInference ? (
                <ExiaText variant="caption">
                  Managed by LiveKit Project credentials — no API key needed.
                </ExiaText>
              ) : (
                <Field label="API key">
                  <ExiaInput
                    autoCapitalize="none"
                    secureTextEntry
                    placeholder={sttP?.keyPlaceholder ?? 'API key'}
                    value={form.sttApiKey}
                    onChangeText={(sttApiKey) => set({ sttApiKey })}
                  />
                </Field>
              )}
              <SelectField
                label="STT model"
                value={form.sttModel}
                options={modelOptions(sttP, form.sttModel)}
                onChange={(sttModel) => set({ sttModel })}
              />
            </SectionCard>

            {/* LLM */}
            <SectionCard title="Language Model" badge={llmP?.badge}>
              <SelectField
                label="LLM provider"
                value={form.llmProvider}
                options={providerOptions(LLM_PROVIDERS)}
                onChange={(id) => {
                  const snap = providerPatch(LLM_PROVIDERS, id, { model: form.llmModel });
                  set({ llmProvider: id, llmModel: snap.model });
                }}
              />
              {llmP?.isLiveKitInference ? (
                <ExiaText variant="caption">
                  Managed by LiveKit Project credentials — no API key needed.
                </ExiaText>
              ) : (
                <Field label="API key">
                  <ExiaInput
                    autoCapitalize="none"
                    secureTextEntry
                    placeholder={llmP?.keyPlaceholder ?? 'API key'}
                    value={form.llmApiKey}
                    onChangeText={(llmApiKey) => set({ llmApiKey })}
                  />
                </Field>
              )}
              <SelectField
                label="LLM model"
                value={form.llmModel}
                options={modelOptions(llmP, form.llmModel)}
                onChange={(llmModel) => set({ llmModel })}
              />
              {form.llmProvider === 'ollama' ? (
                <Field label="Ollama base URL">
                  <ExiaInput
                    autoCapitalize="none"
                    keyboardType="url"
                    placeholder="http://localhost:11434"
                    value={form.ollamaBaseUrl}
                    onChangeText={(ollamaBaseUrl) => set({ ollamaBaseUrl })}
                  />
                </Field>
              ) : null}
            </SectionCard>

            {/* TTS */}
            <SectionCard title="Text-to-Speech" badge={ttsP?.badge}>
              <SelectField
                label="TTS provider"
                value={form.ttsProvider}
                options={providerOptions(TTS_PROVIDERS)}
                onChange={(id) => {
                  const snap = providerPatch(TTS_PROVIDERS, id, { model: form.ttsModel });
                  set({ ttsProvider: id, ttsModel: snap.model });
                }}
              />
              {ttsP?.isLiveKitInference ? (
                <ExiaText variant="caption">
                  Managed by LiveKit Project credentials — no API key needed.
                </ExiaText>
              ) : (
                <Field label="API key">
                  <ExiaInput
                    autoCapitalize="none"
                    secureTextEntry
                    placeholder={ttsP?.keyPlaceholder ?? 'API key'}
                    value={form.ttsApiKey}
                    onChangeText={(ttsApiKey) => set({ ttsApiKey })}
                  />
                </Field>
              )}
              <SelectField
                label="TTS model"
                value={form.ttsModel}
                options={modelOptions(ttsP, form.ttsModel)}
                onChange={(ttsModel) => set({ ttsModel })}
              />
            </SectionCard>

            {/* Failover engines */}
            <SectionCard title="Failover Engines" badge="RESILIENCE">
              <ToggleRow
                label="Fallback LLM"
                description="Route to a secondary model when the primary fails."
                value={form.fallbackEnabled}
                onValueChange={(fallbackEnabled) => set({ fallbackEnabled })}
              />
              {form.fallbackEnabled ? (
                <>
                  <SelectField
                    label="Fallback provider"
                    value={form.fallbackProvider}
                    options={providerOptions(LLM_PROVIDERS)}
                    onChange={(id) => {
                      const snap = providerPatch(LLM_PROVIDERS, id, { model: form.fallbackModel });
                      set({ fallbackProvider: id, fallbackModel: snap.model });
                    }}
                  />
                  <SelectField
                    label="Fallback model"
                    value={form.fallbackModel}
                    options={modelOptions(findProvider(LLM_PROVIDERS, form.fallbackProvider), form.fallbackModel)}
                    onChange={(fallbackModel) => set({ fallbackModel })}
                  />
                  <StepperRow
                    label="Fallback temperature"
                    value={form.fallbackTemperature}
                    min={0}
                    max={2}
                    step={0.1}
                    format={(v) => v.toFixed(1)}
                    onChange={(fallbackTemperature) => set({ fallbackTemperature })}
                  />
                  <Field label="Fallback API key (optional)">
                    <ExiaInput
                      autoCapitalize="none"
                      secureTextEntry
                      value={form.fallbackApiKey}
                      onChangeText={(fallbackApiKey) => set({ fallbackApiKey })}
                    />
                  </Field>
                </>
              ) : null}

              <ToggleRow
                label="Fallback STT"
                description="Secondary transcription engine."
                value={form.fallbackSttEnabled}
                onValueChange={(fallbackSttEnabled) => set({ fallbackSttEnabled })}
              />
              {form.fallbackSttEnabled ? (
                <>
                  <SelectField
                    label="Fallback STT provider"
                    value={form.fallbackSttProvider}
                    options={providerOptions(STT_PROVIDERS)}
                    onChange={(id) => {
                      const snap = providerPatch(STT_PROVIDERS, id, { model: form.fallbackSttModel });
                      set({ fallbackSttProvider: id, fallbackSttModel: snap.model });
                    }}
                  />
                  <SelectField
                    label="Fallback STT model"
                    value={form.fallbackSttModel}
                    options={modelOptions(findProvider(STT_PROVIDERS, form.fallbackSttProvider), form.fallbackSttModel)}
                    onChange={(fallbackSttModel) => set({ fallbackSttModel })}
                  />
                </>
              ) : null}

              <ToggleRow
                label="Fallback TTS"
                description="Secondary speech synthesis engine."
                value={form.fallbackTtsEnabled}
                onValueChange={(fallbackTtsEnabled) => set({ fallbackTtsEnabled })}
              />
              {form.fallbackTtsEnabled ? (
                <>
                  <SelectField
                    label="Fallback TTS provider"
                    value={form.fallbackTtsProvider}
                    options={providerOptions(TTS_PROVIDERS)}
                    onChange={(id) => {
                      const snap = providerPatch(TTS_PROVIDERS, id, { model: form.fallbackTtsModel });
                      set({ fallbackTtsProvider: id, fallbackTtsModel: snap.model });
                    }}
                  />
                  <SelectField
                    label="Fallback TTS model"
                    value={form.fallbackTtsModel}
                    options={modelOptions(findProvider(TTS_PROVIDERS, form.fallbackTtsProvider), form.fallbackTtsModel)}
                    onChange={(fallbackTtsModel) => set({ fallbackTtsModel })}
                  />
                  <SelectField
                    label="Fallback TTS voice"
                    value={form.fallbackTtsVoice}
                    options={voiceOptions(findProvider(TTS_PROVIDERS, form.fallbackTtsProvider), form.fallbackTtsVoice)}
                    onChange={(fallbackTtsVoice) => set({ fallbackTtsVoice })}
                  />
                </>
              ) : null}
            </SectionCard>
          </>
        )}

        {/* Speechmatics advanced recognition */}
        <SectionCard title="Speechmatics Advanced" badge="RECOGNITION">
          <Field label="Speechmatics API key">
            <ExiaInput
              autoCapitalize="none"
              secureTextEntry
              placeholder="Bearer key… (portal.speechmatics.com)"
              value={form.speechmaticsApiKey}
              onChangeText={(speechmaticsApiKey) => set({ speechmaticsApiKey })}
            />
          </Field>
          <SelectField
            label="Recognition model"
            value={form.speechmaticsModel}
            options={[
              { value: 'linden-1', label: 'Linden-1 (LiveKit Agent STT — turn detection & sub-second latency)' },
              { value: 'enhanced', label: 'Ursa Enhanced (flagship neural accuracy)' },
              { value: 'standard', label: 'Ursa Standard (low-latency real-time)' },
            ]}
            onChange={(speechmaticsModel) => set({ speechmaticsModel })}
          />
          <View style={styles.field}>
            <ExiaText variant="caption">Turn detection</ExiaText>
            <Segmented
              accessibilityLabel="Turn detection"
              options={['vad', 'external'] as const}
              value={form.speechmaticsTurnDetection}
              onChange={(speechmaticsTurnDetection) => set({ speechmaticsTurnDetection })}
            />
            <ExiaText variant="caption">
              {form.speechmaticsTurnDetection === 'vad'
                ? 'VAD — built-in voice activity detection manages turn taking.'
                : 'External — the orchestrator (LiveKit) drives end-of-turn events.'}
            </ExiaText>
          </View>
          <StepperRow
            label="Max delay"
            value={form.speechmaticsMaxDelay}
            min={0.5}
            max={3}
            step={0.1}
            format={(v) => `${v.toFixed(1)}s`}
            hint={
              form.speechmaticsMaxDelay <= 1.2
                ? 'Low-latency conversational'
                : 'Extended accuracy context'
            }
            onChange={(speechmaticsMaxDelay) => set({ speechmaticsMaxDelay })}
          />
          <SelectField
            label="Language"
            value={form.speechmaticsLanguage}
            options={SPEECHMATICS_LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
            onChange={(speechmaticsLanguage) => set({ speechmaticsLanguage })}
          />
          <Field label="Custom dictionary (comma-separated)">
            <ExiaInput
              autoCapitalize="none"
              multiline
              placeholder="e.g. Home Assistant, Zigbee, Shelly"
              value={form.speechmaticsDictionary}
              onChangeText={(speechmaticsDictionary) => set({ speechmaticsDictionary })}
            />
          </Field>
          <ToggleRow
            label="Partial transcriptions"
            description="Stream interim words as they are recognized."
            value={form.speechmaticsEnablePartials}
            onValueChange={(speechmaticsEnablePartials) => set({ speechmaticsEnablePartials })}
          />
          <ToggleRow
            label="Diarization"
            description="Separate and label distinct speakers."
            value={form.speechmaticsDiarization}
            onValueChange={(speechmaticsDiarization) => set({ speechmaticsDiarization })}
          />
          <ToggleRow
            label="Speaker identification"
            description="Match voices against enrolled profiles."
            value={form.speechmaticsSpeakerIdentification}
            onValueChange={(speechmaticsSpeakerIdentification) =>
              set({ speechmaticsSpeakerIdentification })
            }
          />
          {form.speechmaticsSpeakerIdentification ? (
            <>
              <StepperRow
                label="Speaker match threshold"
                value={form.speechmaticsSpeakerThreshold}
                min={0.5}
                max={0.95}
                step={0.01}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(speechmaticsSpeakerThreshold) =>
                  set({ speechmaticsSpeakerThreshold })
                }
              />
              <Field label="Active voice profile name">
                <ExiaInput
                  autoCapitalize="none"
                  placeholder="e.g. Primary Commander"
                  value={form.speechmaticsVoiceProfileName}
                  onChangeText={(speechmaticsVoiceProfileName) =>
                    set({ speechmaticsVoiceProfileName })
                  }
                />
              </Field>
            </>
          ) : null}
        </SectionCard>

        {/* Voice profiles — live backend CRUD */}
        <VoiceProfilesCard />

        {/* Inference tuning */}
        <SectionCard title="Inference Tuning" badge="PARAMS">
          <StepperRow
            label="Temperature"
            value={form.temperature}
            min={0}
            max={2}
            step={0.1}
            format={(v) => v.toFixed(1)}
            hint="Higher = more creative, lower = more deterministic."
            onChange={(temperature) => set({ temperature })}
          />
          <StepperRow
            label="Top-P (nucleus)"
            value={form.topP}
            min={0.1}
            max={1}
            step={0.05}
            format={(v) => v.toFixed(2)}
            hint="Controls diversity of considered words before speech generation."
            onChange={(topP) => set({ topP })}
          />
          <StepperRow
            label="Max output tokens"
            value={form.maxTokens}
            min={256}
            max={4096}
            step={256}
            hint="Limits maximum spoken words per turn (~750 words at 1024 tokens)."
            onChange={(maxTokens) => set({ maxTokens })}
          />
          <Field label="Custom persona / prompt directive">
            <ExiaInput
              multiline
              placeholder="e.g. You are Exia, a helpful home assistant. Speak with calm precision. Confirm device states before triggering actions…"
              value={form.systemPromptOverride}
              onChangeText={(systemPromptOverride) => set({ systemPromptOverride })}
            />
          </Field>
        </SectionCard>

        {/* Save / discard */}
        {save.isError ? (
          <ExiaText accessibilityRole="alert" style={[styles.error, { color: t.destructive }]}>
            {save.error instanceof Error ? save.error.message : 'Failed to save configuration'}
          </ExiaText>
        ) : null}
        <View style={styles.actions}>
          <ExiaButton
            label="Discard edits"
            variant="secondary"
            disabled={save.isPending || Object.keys(draft).length === 0}
            onPress={() => setDraft({})}
          />
          <ExiaButton
            disabled={save.isPending}
            label={save.isPending ? 'Saving…' : 'Save configuration'}
            onPress={() => save.mutate()}
          />
        </View>

        {/* Account */}
        <ExiaCard style={styles.section}>
          <ExiaText style={styles.sectionTitle}>Connection</ExiaText>
          <ExiaText variant="mono">{API_BASE_URL}</ExiaText>
          <ExiaText variant="caption">
            Override with EXPO_PUBLIC_API_URL at bundle time.
          </ExiaText>
        </ExiaCard>
        <ExiaButton label="Sign out" variant="destructive" onPress={handleSignOut} />
      </ScrollView>
    </ExiaScreen>
  );
}

// ---------------------------------------------------------------------------
// Voice profiles — enrolled speaker signatures (backend CRUD)
// ---------------------------------------------------------------------------

function VoiceProfilesCard() {
  const t = useTheme();
  const queryClient = useQueryClient();

  const profiles = useQuery({
    queryKey: ['voice-profiles'],
    queryFn: () => api.voiceProfiles.list(),
  });

  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'user' | 'guest'>('user');

  const create = useMutation({
    mutationFn: () =>
      api.voiceProfiles.create({
        speaker_name: name.trim(),
        role,
        confidence_threshold: 0.82,
        sample_status: 'enrolled',
      }),
    onSuccess: () => {
      setName('');
      queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.voiceProfiles.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['voice-profiles'] }),
  });

  const rows = profiles.data?.profiles ?? [];

  return (
    <SectionCard title="Voice Profiles" badge="SPEAKER ID">
      <ExiaText variant="caption">
        Enrolled speaker signatures used by Speechmatics speaker identification
        and the voice skill's role permissions.
      </ExiaText>

      {profiles.isLoading ? <Loading label="Loading profiles…" /> : null}
      {profiles.isError && !profiles.data ? (
        <ExiaText variant="caption" style={{ color: t.destructive }}>
          Failed to load profiles.
        </ExiaText>
      ) : null}

      {rows.map((p) => (
        <View key={p.profile_id} style={[styles.profileRow, { borderColor: t.border }]}>
          <View style={styles.profileText}>
            <View style={styles.profileTitle}>
              <ExiaText numberOfLines={1} style={styles.profileName}>
                {p.speaker_name}
              </ExiaText>
              <BadgePill
                label={(p.role ?? 'user').toUpperCase()}
                tone={p.role === 'admin' ? 'info' : 'muted'}
              />
            </View>
            <ExiaText variant="caption" numberOfLines={1}>
              {p.voice_signature ? `${p.voice_signature} · ` : ''}
              {(p.sample_status ?? 'enrolled') + (p.pitch_hz ? ` · ${p.pitch_hz} Hz` : '')}
            </ExiaText>
          </View>
          <Pressable
            accessibilityLabel={`Delete profile ${p.speaker_name}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => remove.mutate(p.profile_id)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="trash-outline" size={18} color={t.destructive} />
          </Pressable>
        </View>
      ))}

      {rows.length === 0 && !profiles.isLoading && !profiles.isError ? (
        <ExiaText variant="caption">
          No profiles enrolled yet — add the primary speaker below.
        </ExiaText>
      ) : null}

      <Field label="Enroll new speaker">
        <ExiaInput
          placeholder="Speaker name"
          value={name}
          onChangeText={setName}
        />
      </Field>
      <Segmented
        accessibilityLabel="Speaker role"
        options={['admin', 'user', 'guest'] as const}
        value={role}
        onChange={setRole}
      />
      {create.isError ? (
        <ExiaText variant="caption" style={{ color: t.destructive }}>
          {create.error instanceof Error ? create.error.message : 'Failed to enroll speaker'}
        </ExiaText>
      ) : null}
      <ExiaButton
        label={create.isPending ? 'Enrolling…' : 'Enroll speaker'}
        variant="secondary"
        disabled={create.isPending || name.trim().length === 0}
        onPress={() => create.mutate()}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  section: { gap: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontWeight: '600' },
  latencyBanner: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  personaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  personaPill: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '100%',
  },
  personaName: { fontSize: 13, fontWeight: '500' },
  field: { gap: spacing.xs },
  actions: { gap: spacing.sm, marginBottom: spacing.md },
  error: { marginBottom: spacing.md },
  profileRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  profileText: { flex: 1, gap: 2 },
  profileTitle: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  profileName: { flexShrink: 1, fontWeight: '500' },
});
