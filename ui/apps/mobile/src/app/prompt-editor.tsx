import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { PromptItem } from '@exia/shared-types';

import { api } from '@/lib/api';
import { ExiaInput, Field, ScreenHeader, Segmented } from '@/components/ui';

interface PromptForm {
  title: string;
  type: 'system' | 'quick';
  promptText: string;
  tags: string;
}

/**
 * Add/edit a prompt (system prompt or quick command). Pass ?id=<prompt id>
 * to edit an existing entry (prefilled from the ['prompts'] query cache).
 * Form values derive from the cached prompt plus a local edit draft —
 * no state-syncing effects.
 * Route: /prompt-editor (modal)
 */
export default function PromptEditor() {
  const t = useTheme();
  const queryClient = useQueryClient();
  const { id, title: prefillTitle, prompt_text: prefillText, type: prefillTypeParam } =
    useLocalSearchParams<{ id?: string; title?: string; prompt_text?: string; type?: string }>();

  const existing = useQuery({
    queryKey: ['prompts'],
    queryFn: () => api.prompts.list(),
    enabled: Boolean(id),
    select: (prompts: PromptItem[]) => prompts.find((p) => p.id === id),
  });

  const [draft, setDraft] = useState<Partial<PromptForm>>({});
  const set = (patch: Partial<PromptForm>) => setDraft((d) => ({ ...d, ...patch }));

  const p = existing.data;
  const prefillType = prefillTypeParam === 'quick' ? 'quick' : 'system';
  const form: PromptForm = {
    title: draft.title ?? p?.title ?? (id ? '' : (prefillTitle ?? '')),
    type: draft.type ?? p?.type ?? (id ? 'system' : prefillType),
    promptText: draft.promptText ?? p?.prompt_text ?? (id ? '' : (prefillText ?? '')),
    tags: draft.tags ?? p?.tags?.join(', ') ?? '',
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title.trim(),
        prompt_text: form.promptText,
        type: form.type,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      if (id && p) {
        return api.prompts.update(id, payload);
      }
      return api.prompts.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      router.back();
    },
    onError: (err) => setSaveError(err instanceof Error ? err.message : 'Failed to save prompt'),
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const canSave = form.title.trim().length > 0 && form.promptText.trim().length > 0 && !save.isPending;

  return (
    <ExiaScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={id ? 'Edit prompt' : 'New prompt'}
          subtitle="System prompt or quick command"
          onBack={() => router.back()}
        />

        <Field label="Title">
          <ExiaInput
            placeholder="e.g. Exia Standard Persona"
            value={form.title}
            onChangeText={(title) => set({ title })}
          />
        </Field>

        <Field label="Type">
          <Segmented
            accessibilityLabel="Prompt type"
            options={['system', 'quick'] as const}
            value={form.type}
            onChange={(type) => set({ type })}
          />
        </Field>

        <Field label="Prompt text">
          <ExiaInput
            multiline
            style={styles.multiline}
            placeholder={
              form.type === 'system'
                ? 'You are Exia, an intelligent multimodal home assistant…'
                : 'A short command the agent should execute, e.g. "Set the living room lights to 40%".'
            }
            value={form.promptText}
            onChangeText={(promptText) => set({ promptText })}
          />
        </Field>

        <Field label="Tags (comma-separated)">
          <ExiaInput
            autoCapitalize="none"
            placeholder="voice, home, default"
            value={form.tags}
            onChangeText={(tags) => set({ tags })}
          />
        </Field>

        {saveError ? (
          <ExiaText accessibilityRole="alert" style={[styles.error, { color: t.destructive }]}>
            {saveError}
          </ExiaText>
        ) : null}

        <ExiaButton
          disabled={!canSave}
          label={save.isPending ? 'Saving…' : id ? 'Save changes' : 'Create prompt'}
          onPress={() => save.mutate()}
        />
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  error: { marginBottom: spacing.md },
});
