import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '@exia/design-tokens';
import { DEFAULT_MODEL_CONFIG } from '@exia/api-client';
import { ExiaButton, ExiaCard, ExiaText, useTheme } from '@exia/shared-ui';
import type { ModelConfig } from '@exia/shared-types';

import { api } from '@/lib/api';
import {
  LLM_PROVIDERS,
  REALTIME_PROVIDERS,
  SPEECHMATICS_LANGUAGES,
  STT_PROVIDERS,
  TTS_PROVIDERS,
  findProvider,
  type CatalogProvider,
} from '@/lib/model-catalog';
import { ErrorState, ExiaInput, Field, Loading, Segmented } from '@/components/ui';
import {
  BadgePill,
  SectionCard,
  SelectField,
  StepperRow,
  ToggleRow,
  type SelectOption,
} from '@/components/models/controls';

interface SettingsForm {
  architecture: 'realtime' | 'modular';
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  realtimeProvider: string;
  realtimeApiKey: string;
  realtimeModel: string;
  realtimeVoice: string;
  sttProvider: string;
  sttApiKey: string;
  sttModel: string;
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
  ollamaBaseUrl: string;
  ttsProvider: string;
  ttsApiKey: string;
  ttsModel: string;
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
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPromptOverride: string;
}

type LoadedModelConfig = Awaited<ReturnType<typeof api.models.getConfig>>;

function formFromConfig(c: LoadedModelConfig): SettingsForm {
  const lk = c.livekit ?? {};
  const geminiKey = c.gemini_api_key ?? '';
  const openaiKey = c.openai_api_key ?? '';
  const anthropicKey = c.anthropic_api_key ?? '';
  const deepgramKey = c.deepgram_api_key ?? '';
  const cartesiaKey = c.cartesia_api_key ?? '';
  const speechmaticsKey = c.speechmatics_api_key ?? '';

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

function providerOptions(catalog: CatalogProvider[]): SelectOption[] {
  return catalog.map((p) => ({
    value: p.id,
    label: p.name,
    hint: [p.badge, p.latency != null ? `~${p.latency}ms` : null].filter(Boolean).join(' · '),
  }));
}

function modelOptions(p: CatalogProvider | undefined, stored: string): SelectOption[] {
  const options: SelectOption[] = (p?.models ?? []).map((m) => ({ value: m.id, label: m.name }));
  if (stored && !options.some((o) => o.value === stored)) {
    options.unshift({ value: stored, label: `${stored} (stored)` });
  }
  return options;
}

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

export function ModelSettings() {
  const t = useTheme();
  const queryClient = useQueryClient();

  const config = useQuery({
    queryKey: ['models-config'],
    queryFn: () => api.models.getConfig(),
  });

  const [draft, setDraft] = useState<Partial<SettingsForm>>({});
  const set = (patch: Partial<SettingsForm>) => setDraft((d) => ({ ...d, ...patch }));

  const form = config.data ? { ...formFromConfig(config.data), ...draft } : null;

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

      return api.models.updateConfig({ ...c, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models-config'] });
      setDraft({});
    },
  });

  const profiles = useQuery({
    queryKey: ['voice-profiles'],
    queryFn: () => api.voiceProfiles.list(),
  });

  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState<'admin' | 'user' | 'guest'>('user');

  const createProfile = useMutation({
    mutationFn: () =>
      api.voiceProfiles.create({
        speaker_name: profileName.trim(),
        role: profileRole,
        confidence_threshold: 0.82,
        sample_status: 'enrolled',
      }),
    onSuccess: () => {
      setProfileName('');
      queryClient.invalidateQueries({ queryKey: ['voice-profiles'] });
    },
  });

  const removeProfile = useMutation({
    mutationFn: (id: string) => api.voiceProfiles.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['voice-profiles'] }),
  });

  if (config.isLoading || !form) {
    return <Loading label="Loading model configuration…" />;
  }

  if (config.isError && !config.data) {
    return (
      <ErrorState
        message={config.error instanceof Error ? config.error.message : 'Failed to load config'}
        onRetry={() => config.refetch()}
      />
    );
  }

  const profileRows = profiles.data?.profiles ?? [];

  return (
    <View style={styles.container}>
      {/* Speech Architecture */}
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

      {/* LiveKit Orchestrator */}
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
        <SectionCard title="Realtime Speech-to-Speech" badge={realtimeP?.badge}>
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
            <ExiaText variant="caption">Provider latency: ~{realtimeP.latency}ms round-trip.</ExiaText>
          ) : null}

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
        </SectionCard>
      ) : (
        <>
          <ExiaCard style={styles.latencyBanner}>
            <ExiaText variant="caption">Estimated pipeline latency</ExiaText>
            <ExiaText variant="title">~{pipelineLatency}ms</ExiaText>
            <ExiaText variant="caption">
              STT {sttP?.latency ?? '—'}ms + LLM {llmP?.latency ?? '—'}ms + TTS{' '}
              {ttsP?.latency ?? '—'}ms
            </ExiaText>
          </ExiaCard>

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
              <ExiaText variant="caption">Managed by LiveKit Project credentials.</ExiaText>
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
              <ExiaText variant="caption">Managed by LiveKit Project credentials.</ExiaText>
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
          </SectionCard>

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
              <ExiaText variant="caption">Managed by LiveKit Project credentials.</ExiaText>
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
        </>
      )}

      {/* Fallback Engine */}
      <SectionCard title="Multi-Engine Fallback" badge="RESILIENCE">
        <ToggleRow
          label="Enable automatic LLM fallback"
          value={form.fallbackEnabled}
          onValueChange={(val: boolean) => set({ fallbackEnabled: val })}
        />
        {form.fallbackEnabled ? (
          <>
            <Field label="Fallback model ID">
              <ExiaInput
                autoCapitalize="none"
                placeholder="google/gemma-4-31b-it"
                value={form.fallbackModel}
                onChangeText={(fallbackModel) => set({ fallbackModel })}
              />
            </Field>
            <StepperRow
              label="Fallback temperature"
              min={0}
              max={2}
              step={0.1}
              value={form.fallbackTemperature}
              onChange={(fallbackTemperature) => set({ fallbackTemperature })}
            />
          </>
        ) : null}
      </SectionCard>

      {/* Speechmatics Advanced */}
      <SectionCard title="Speechmatics Advanced Recognition" badge="URSA / LINDEN">
        <Field label="Speechmatics API key">
          <ExiaInput
            autoCapitalize="none"
            secureTextEntry
            placeholder="sm_..."
            value={form.speechmaticsApiKey}
            onChangeText={(speechmaticsApiKey) => set({ speechmaticsApiKey })}
          />
        </Field>
        <SelectField
          label="Spoken language"
          value={form.speechmaticsLanguage}
          options={SPEECHMATICS_LANGUAGES.map((l) => ({ value: l.code, label: l.name }))}
          onChange={(speechmaticsLanguage) => set({ speechmaticsLanguage })}
        />
        <ToggleRow
          label="Speaker diarization"
          value={form.speechmaticsDiarization}
          onValueChange={(val: boolean) => set({ speechmaticsDiarization: val })}
        />
        <ToggleRow
          label="Speaker identification"
          value={form.speechmaticsSpeakerIdentification}
          onValueChange={(val: boolean) => set({ speechmaticsSpeakerIdentification: val })}
        />
      </SectionCard>

      {/* Inference Tuning */}
      <SectionCard title="Inference Tuning" badge="PARAMETERS">
        <StepperRow
          label="Temperature"
          min={0}
          max={2}
          step={0.05}
          value={form.temperature}
          onChange={(temperature) => set({ temperature })}
        />
        <StepperRow
          label="Top P"
          min={0.1}
          max={1}
          step={0.05}
          value={form.topP}
          onChange={(topP) => set({ topP })}
        />
        <StepperRow
          label="Max output tokens"
          min={128}
          max={8192}
          step={128}
          value={form.maxTokens}
          onChange={(maxTokens) => set({ maxTokens })}
        />
        <Field label="System prompt override">
          <ExiaInput
            multiline
            placeholder="Leave blank to use prompt directives from Prompts tab"
            value={form.systemPromptOverride}
            onChangeText={(systemPromptOverride) => set({ systemPromptOverride })}
            style={{ minHeight: 70 }}
          />
        </Field>
      </SectionCard>

      {/* Voice Profiles */}
      <SectionCard title="Voice Profiles" badge="SPEAKER ID">
        <ExiaText variant="caption">
          Enrolled speaker signatures used by Speechmatics speaker identification and for voice-skill permissions.
        </ExiaText>

        {profiles.isLoading ? <Loading label="Loading profiles…" /> : null}

        {profileRows.map((p) => (
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
              onPress={() => removeProfile.mutate(p.profile_id)}
            >
              <Ionicons name="trash-outline" size={18} color={t.destructive} />
            </Pressable>
          </View>
        ))}

        <Field label="Enroll new speaker">
          <ExiaInput placeholder="Speaker name" value={profileName} onChangeText={setProfileName} />
        </Field>
        <Segmented
          accessibilityLabel="Speaker role"
          options={['admin', 'user', 'guest'] as const}
          value={profileRole}
          onChange={setProfileRole}
        />
        <ExiaButton
          label={createProfile.isPending ? 'Enrolling…' : 'Enroll speaker'}
          variant="secondary"
          disabled={createProfile.isPending || profileName.trim().length === 0}
          onPress={() => createProfile.mutate()}
        />
      </SectionCard>

      {/* Save Action */}
      <View style={styles.actions}>
        <ExiaButton
          label={save.isPending ? 'Saving configuration…' : 'Save model configuration'}
          variant="primary"
          disabled={save.isPending}
          onPress={() => save.mutate()}
        />
        {save.isSuccess ? (
          <ExiaText variant="caption" style={{ color: t.liveEmerald, textAlign: 'center' }}>
            Configuration saved successfully.
          </ExiaText>
        ) : null}
        {save.isError ? (
          <ExiaText variant="caption" style={{ color: t.destructive, textAlign: 'center' }}>
            {save.error instanceof Error ? save.error.message : 'Failed to save configuration'}
          </ExiaText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, paddingBottom: spacing.xxl },
  latencyBanner: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    paddingVertical: spacing.lg,
  },
  personaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  personaPill: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '100%',
  },
  personaName: { fontSize: 13, fontWeight: '500' },
  actions: { gap: spacing.sm, marginVertical: spacing.md },
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
