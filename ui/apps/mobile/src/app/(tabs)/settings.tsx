import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { API_BASE_URL, api, tokenStorage } from '@/lib/api';
import { AUTH_TOKEN_KEY } from '@/lib/auth';
import { ExiaInput, Field, Loading, ScreenHeader, Segmented } from '@/components/ui';

interface SettingsForm {
  mode: 'gemini_live' | 'modular';
  geminiModel: string;
  geminiVoice: string;
  sttProvider: string;
  sttModel: string;
  llmProvider: string;
  llmModel: string;
  ttsProvider: string;
  ttsModel: string;
  temperature: string;
  maxOutputTokens: string;
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
}

type LoadedModelConfig = Awaited<ReturnType<typeof api.models.getConfig>>;

function formFromConfig(config: LoadedModelConfig): SettingsForm {
  const lk = config.livekit ?? {};
  return {
    mode: config.mode,
    geminiModel: config.gemini_model,
    geminiVoice: config.gemini_voice,
    sttProvider: config.stt_provider,
    sttModel: config.stt_model,
    llmProvider: config.llm_provider,
    llmModel: config.llm_model,
    ttsProvider: config.tts_provider,
    ttsModel: config.tts_model,
    temperature: String(config.temperature ?? ''),
    maxOutputTokens: String(config.max_output_tokens ?? ''),
    livekitUrl: lk.url || config.livekit_url || '',
    livekitApiKey: lk.apiKey || config.livekit_api_key || '',
    livekitApiSecret: lk.apiSecret || config.livekit_api_secret || '',
  };
}

/**
 * Settings tab — voice pipeline/model configuration, LiveKit credentials,
 * and sign-out. Ported from the legacy settings + model-selection views.
 * Form state derives from the loaded config plus a local edit draft —
 * no state-syncing effects (react-hooks/set-state-in-effect).
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

  const save = useMutation({
    mutationFn: () => {
      const c = config.data;
      if (!c) throw new Error('Config not loaded');
      const form = { ...formFromConfig(c), ...draft };
      return api.models.updateConfig({
        ...c,
        mode: form.mode,
        gemini_model: form.geminiModel,
        gemini_voice: form.geminiVoice,
        stt_provider: form.sttProvider,
        stt_model: form.sttModel,
        llm_provider: form.llmProvider,
        llm_model: form.llmModel,
        tts_provider: form.ttsProvider,
        tts_model: form.ttsModel,
        temperature: Number(form.temperature) || 0,
        max_output_tokens: Number(form.maxOutputTokens) || undefined,
        livekit_url: form.livekitUrl || undefined,
        livekit_api_key: form.livekitApiKey || undefined,
        livekit_api_secret: form.livekitApiSecret || undefined,
        livekit: {
          url: form.livekitUrl || undefined,
          apiKey: form.livekitApiKey || undefined,
          apiSecret: form.livekitApiSecret || undefined,
        },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models-config'] }),
  });

  async function handleSignOut() {
    await tokenStorage.setToken(null);
    queryClient.clear();
    queryClient.setQueryData(AUTH_TOKEN_KEY, null);
    router.replace('/login');
  }

  const form = config.data ? { ...formFromConfig(config.data), ...draft } : null;

  return (
    <ExiaScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Settings" subtitle="Voice pipeline & account" />

        {!form ? (
          <Loading label="Loading configuration…" />
        ) : (
          <>
            <ExiaCard style={styles.section}>
              <ExiaText style={styles.sectionTitle}>Pipeline</ExiaText>
              <Segmented
                accessibilityLabel="Pipeline mode"
                options={['gemini_live', 'modular'] as const}
                value={form.mode}
                onChange={(mode) => set({ mode })}
              />
              <Field label="Gemini model">
                <ExiaInput
                  autoCapitalize="none"
                  value={form.geminiModel}
                  onChangeText={(geminiModel) => set({ geminiModel })}
                />
              </Field>
              <Field label="Gemini voice">
                <ExiaInput
                  value={form.geminiVoice}
                  onChangeText={(geminiVoice) => set({ geminiVoice })}
                />
              </Field>
            </ExiaCard>

            <ExiaCard style={styles.section}>
              <ExiaText style={styles.sectionTitle}>Modular stack</ExiaText>
              <Field label="STT provider">
                <ExiaInput value={form.sttProvider} onChangeText={(sttProvider) => set({ sttProvider })} />
              </Field>
              <Field label="STT model">
                <ExiaInput value={form.sttModel} onChangeText={(sttModel) => set({ sttModel })} />
              </Field>
              <Field label="LLM provider">
                <ExiaInput value={form.llmProvider} onChangeText={(llmProvider) => set({ llmProvider })} />
              </Field>
              <Field label="LLM model">
                <ExiaInput value={form.llmModel} onChangeText={(llmModel) => set({ llmModel })} />
              </Field>
              <Field label="TTS provider">
                <ExiaInput value={form.ttsProvider} onChangeText={(ttsProvider) => set({ ttsProvider })} />
              </Field>
              <Field label="TTS model">
                <ExiaInput value={form.ttsModel} onChangeText={(ttsModel) => set({ ttsModel })} />
              </Field>
              <Field label="Temperature">
                <ExiaInput
                  keyboardType="decimal-pad"
                  value={form.temperature}
                  onChangeText={(temperature) => set({ temperature })}
                />
              </Field>
              <Field label="Max output tokens">
                <ExiaInput
                  keyboardType="number-pad"
                  value={form.maxOutputTokens}
                  onChangeText={(maxOutputTokens) => set({ maxOutputTokens })}
                />
              </Field>
            </ExiaCard>

            <ExiaCard style={styles.section}>
              <ExiaText style={styles.sectionTitle}>LiveKit credentials</ExiaText>
              <Field label="LiveKit URL">
                <ExiaInput
                  autoCapitalize="none"
                  keyboardType="url"
                  value={form.livekitUrl}
                  onChangeText={(livekitUrl) => set({ livekitUrl })}
                />
              </Field>
              <Field label="API key">
                <ExiaInput
                  autoCapitalize="none"
                  value={form.livekitApiKey}
                  onChangeText={(livekitApiKey) => set({ livekitApiKey })}
                />
              </Field>
              <Field label="API secret">
                <ExiaInput
                  autoCapitalize="none"
                  secureTextEntry
                  value={form.livekitApiSecret}
                  onChangeText={(livekitApiSecret) => set({ livekitApiSecret })}
                />
              </Field>
            </ExiaCard>

            {save.isError ? (
              <ExiaText accessibilityRole="alert" style={[styles.error, { color: t.destructive }]}>
                {save.error instanceof Error ? save.error.message : 'Failed to save configuration'}
              </ExiaText>
            ) : null}

            <ExiaButton
              disabled={save.isPending}
              label={save.isPending ? 'Saving…' : 'Save configuration'}
              onPress={() => save.mutate()}
            />

            <ExiaCard style={styles.section}>
              <ExiaText style={styles.sectionTitle}>Connection</ExiaText>
              <ExiaText variant="mono">{API_BASE_URL}</ExiaText>
              <ExiaText variant="caption">
                Override with EXPO_PUBLIC_API_URL at bundle time.
              </ExiaText>
            </ExiaCard>

            <ExiaButton label="Sign out" variant="destructive" onPress={handleSignOut} />
          </>
        )}
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  section: { gap: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontWeight: '600' },
  error: { marginBottom: spacing.md },
});
