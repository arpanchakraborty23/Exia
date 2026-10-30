import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { AgentSkill } from '@exia/shared-types';

import { api } from '@/lib/api';
import { Badge, DeleteButton, ExiaInput, Loading, ScreenHeader, Segmented } from '@/components/ui';

// ---------------------------------------------------------------------------
// Constants — ported 1:1 from the legacy prompts-view.tsx (lines 46-180)
// ---------------------------------------------------------------------------

const VARIABLE_PILLS = [
  '{user_name}',
  '{current_time}',
  '{active_room}',
  '{home_temp}',
  '{security_status}',
  '{last_command}',
  '{speaker_identity}',
];

const BASE_PROMPT_PRESETS = [
  {
    title: 'Exia Standard Persona',
    badge: 'DEFAULT',
    text: `You are Exia, an intelligent multimodal home assistant and AI companion.
Speak with calm, articulate precision. Keep conversational voice answers under 2-3 sentences unless an in-depth breakdown is explicitly requested.
Always confirm device actions clearly. When executing tools or MCP operations, prioritize safety and verify state changes.`,
  },
  {
    title: 'Technical Coding Copilot',
    badge: 'ENGINEERING',
    text: `You are an expert technical coding copilot and software architect.
Provide direct code solutions with minimal conversational fluff. Highlight edge cases, potential memory or concurrency pitfalls, and follow modern language idioms.`,
  },
  {
    title: 'Ultra-Fast Voice Operator',
    badge: 'LOW LATENCY',
    text: `You are an ultra-fast voice automation agent.
Respond in a single brief sentence whenever possible. Confirm commands with immediate brevity (e.g., "Living room lights set to 40%"). Avoid conversational filler.`,
  },
  {
    title: 'Tactical Sentinel',
    badge: 'SECURITY',
    text: `You are Exia Tactical Sentinel.
Monitor perimeter security, device statuses, and system telemetry. Report anomalies immediately with military brevity and explicit sensor states.`,
  },
];

/** Suggested starter prompts shown when the library is empty (legacy
 * CURATED_DIRECTIVES). "Use" prefills the editor via route params. */
const CURATED_DIRECTIVES = [
  {
    title: 'Exia Standard Persona',
    type: 'system' as const,
    badge: 'DEFAULT',
    prompt_text:
      'You are Exia, an intelligent multimodal assistant. Speak with calm, natural precision. Keep voice responses crisp and under 2-3 sentences unless asked for an in-depth breakdown. Prioritize helpfulness, smart device actions, and immediate clarity.',
  },
  {
    title: 'Concise Voice Assistant',
    type: 'system' as const,
    badge: 'FAST',
    prompt_text:
      'You are a high-speed home automation interface. Respond in 1 brief sentence whenever possible. Confirm commands concisely (e.g. "Living room lights set to 40%"). Avoid conversational filler.',
  },
  {
    title: 'Home Diagnostic Macro',
    type: 'quick' as const,
    badge: 'DIAGNOSTICS',
    prompt_text:
      'Inspect home telemetry across all registered MCP servers. Report disconnected endpoints, battery alerts, and offline smart sensors immediately.',
  },
  {
    title: 'Technical Coding Companion',
    type: 'system' as const,
    badge: 'EXPERT',
    prompt_text:
      'You are a software engineering peer assistant. Provide code snippets directly, highlight potential bugs or edge cases, and keep architectural explanations clear and structured.',
  },
];

const DEFAULT_SKILLS: AgentSkill[] = [
  {
    id: 'skill_automation',
    name: 'Home Automation & Smart Devices (MCP)',
    description:
      'Controls smart lights, switches, thermostats, and IoT devices through registered MCP servers.',
    category: 'automation',
    enabled: true,
    triggers: ['turn on', 'dim lights', 'set temperature', 'lock door', 'run scene'],
    instruction_prompt:
      'When the user requests home control actions, immediately invoke the corresponding MCP tool. Confirm state changes concisely without unnecessary filler.',
  },
  {
    id: 'skill_search',
    name: 'Live Web Search & Grounding',
    description:
      'Performs real-time searches for news, weather forecasts, live sports scores, and technical documentation.',
    category: 'search',
    enabled: true,
    triggers: ['search', 'weather', 'latest news', 'who won', 'lookup online'],
    instruction_prompt:
      'For queries requiring real-time facts or external information, execute web search queries and synthesize up-to-date facts concisely with citations.',
  },
  {
    id: 'skill_code',
    name: 'Code Execution & Terminal Sandboxing',
    description:
      'Executes commands, inspects local files, parses JSON/YAML configurations, and helps with engineering tasks.',
    category: 'code',
    enabled: true,
    triggers: ['run command', 'debug code', 'git status', 'check syntax', 'inspect file'],
    instruction_prompt:
      'Provide production-quality code. When running commands or scripts, ensure operations are sandboxed and explain any potential side effects.',
  },
  {
    id: 'skill_memory',
    name: 'Long-Term Memory & Context Recall',
    description:
      'Retains past conversation context, user habits, and custom preferences across multiple sessions.',
    category: 'memory',
    enabled: true,
    triggers: ['remember this', 'what did I say', 'my preference', 'recall note'],
    instruction_prompt:
      'Persist important user preferences and recurring context in memory. Reference previous conversation facts naturally when relevant.',
  },
  {
    id: 'skill_voice',
    name: 'Speaker Voice Identification',
    description:
      'Verifies speaker identity against enrolled voice signatures and enforces role permissions.',
    category: 'voice',
    enabled: true,
    triggers: ['identify speaker', 'who is speaking', 'voice check', 'authenticate me'],
    instruction_prompt:
      'Check speaker voice signature against enrolled profiles. Require admin confirmation for destructive or privileged operations.',
  },
  {
    id: 'skill_calendar',
    name: 'Calendar & Scheduling Automation',
    description: 'Manages daily agenda, schedules reminders, timers, and delivers morning briefings.',
    category: 'automation',
    enabled: false,
    triggers: ['schedule meeting', 'remind me', 'what is on my calendar', 'morning briefing'],
    instruction_prompt:
      'Organize schedule items chronologically. Alert the user to upcoming conflicts and deliver daily agenda summaries with exact start times.',
  },
];

type StudioTab = 'base' | 'library' | 'skills';
type LibraryFilter = 'all' | 'system' | 'quick';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

/**
 * Prompts tab — "Prompt Studio", the port of the legacy prompts-view:
 * Base system prompt (presets + variables), prompt library (CRUD), and the
 * agent skills registry. Base prompt and skills persist through the
 * backend's /models/config document (full-merge PUT).
 */
export default function Prompts() {
  const t = useTheme();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<StudioTab>('base');

  const config = useQuery({
    queryKey: ['models-config'],
    queryFn: () => api.models.getConfig(),
  });

  // Drafts — null means "no edits yet", so the UI derives from the loaded
  // config (draft-merged-over-query-data; no state-syncing effects).
  const [baseDraft, setBaseDraft] = useState<string | null>(null);
  const [skillsDraft, setSkillsDraft] = useState<AgentSkill[] | null>(null);

  const basePrompt = baseDraft ?? config.data?.base_system_prompt ?? BASE_PROMPT_PRESETS[0].text;
  const skills = skillsDraft ?? (config.data?.skills?.length ? config.data.skills : DEFAULT_SKILLS);

  const saveConfig = useMutation({
    mutationFn: (patch: { base_system_prompt?: string; skills?: AgentSkill[] }) => {
      const c = config.data;
      if (!c) throw new Error('Config not loaded');
      return api.models.updateConfig({ ...c, ...patch });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models-config'] });
      setBaseDraft(null);
      setSkillsDraft(null);
    },
  });

  return (
    <ExiaScreen>
      <ScreenHeader title="Prompt Studio" subtitle="Directives, library & skills" />

      <Segmented
        accessibilityLabel="Prompt studio section"
        options={['base', 'library', 'skills'] as const}
        value={tab}
        onChange={setTab}
      />

      {config.isLoading || !config.data ? (
        <Loading label="Loading prompt configuration…" />
      ) : tab === 'base' ? (
        <BaseTab
          basePrompt={basePrompt}
          dirty={baseDraft !== null}
          saving={saveConfig.isPending}
          error={saveConfig.error}
          onChange={setBaseDraft}
          onApplyPreset={setBaseDraft}
          onSave={() => saveConfig.mutate({ base_system_prompt: basePrompt })}
        />
      ) : tab === 'library' ? (
        <LibraryTab />
      ) : (
        <SkillsTab
          skills={skills}
          dirty={skillsDraft !== null}
          saving={saveConfig.isPending}
          error={saveConfig.error}
          onToggle={(id) =>
            setSkillsDraft(skills.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
          }
          onSave={() => saveConfig.mutate({ skills })}
        />
      )}
    </ExiaScreen>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Base system prompt
// ---------------------------------------------------------------------------

function BaseTab({
  basePrompt,
  dirty,
  saving,
  error,
  onChange,
  onApplyPreset,
  onSave,
}: {
  basePrompt: string;
  dirty: boolean;
  saving: boolean;
  error: unknown;
  onChange: (text: string) => void;
  onApplyPreset: (text: string) => void;
  onSave: () => void;
}) {
  const t = useTheme();

  const insertVariable = (pill: string) => {
    // Append with a separating space (mobile keyboards lack caret control).
    onChange(basePrompt.length > 0 && !basePrompt.endsWith(' ') ? `${basePrompt} ${pill}` : basePrompt + pill);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Base prompt presets */}
      <ExiaText style={styles.tabSectionTitle}>Base prompt presets</ExiaText>
      {BASE_PROMPT_PRESETS.map((preset) => {
        const active = basePrompt === preset.text;
        return (
          <Pressable
            key={preset.title}
            accessibilityLabel={`Apply preset ${preset.title}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onApplyPreset(preset.text)}
            style={({ pressed }) => [
              styles.presetCard,
              {
                borderColor: active ? t.primary : t.border,
                backgroundColor: active ? t.input : t.card,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.presetHeader}>
              <ExiaText style={styles.presetTitle}>{preset.title}</ExiaText>
              <Badge label={preset.badge} tone={active ? 'info' : 'muted'} />
            </View>
            <ExiaText variant="caption" numberOfLines={3}>
              {preset.text}
            </ExiaText>
          </Pressable>
        );
      })}

      {/* Variable pills */}
      <ExiaText style={styles.tabSectionTitle}>Runtime variables</ExiaText>
      <ExiaText variant="caption">
        Tap to append a variable the backend resolves at request time.
      </ExiaText>
      <View style={styles.pillRow}>
        {VARIABLE_PILLS.map((pill) => (
          <Pressable
            key={pill}
            accessibilityLabel={`Insert variable ${pill}`}
            accessibilityRole="button"
            onPress={() => insertVariable(pill)}
            style={({ pressed }) => [
              styles.variablePill,
              { backgroundColor: t.input, borderColor: t.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ExiaText variant="mono" style={styles.variableText}>
              {pill}
            </ExiaText>
          </Pressable>
        ))}
      </View>

      {/* Editable base prompt */}
      <ExiaText style={styles.tabSectionTitle}>Base system prompt</ExiaText>
      <ExiaInput
        multiline
        style={styles.basePromptInput}
        value={basePrompt}
        onChangeText={onChange}
      />

      {error ? (
        <ExiaText accessibilityRole="alert" style={[styles.error, { color: t.destructive }]}>
          {error instanceof Error ? error.message : 'Failed to save base prompt'}
        </ExiaText>
      ) : null}
      <ExiaButton
        disabled={saving || !dirty}
        label={saving ? 'Saving…' : 'Save base prompt'}
        onPress={onSave}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Prompt library (backend CRUD)
// ---------------------------------------------------------------------------

function LibraryTab() {
  const t = useTheme();

  const prompts = useQuery({
    queryKey: ['prompts'],
    queryFn: () => api.prompts.list(),
  });

  const [filter, setFilter] = useState<LibraryFilter>('all');

  const items = (prompts.data ?? []).filter((p) => filter === 'all' || p.type === filter);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.libraryToolbar}>
        <View style={styles.filterRow}>
          {(['all', 'system', 'quick'] as const).map((f) => (
            <Pressable
              key={f}
              accessibilityLabel={`Filter ${f}`}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f }}
              onPress={() => setFilter(f)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: filter === f ? t.primary : t.input,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <ExiaText
                style={{ color: filter === f ? t.primaryForeground : t.foreground, fontSize: 12 }}
              >
                {f}
              </ExiaText>
            </Pressable>
          ))}
        </View>
        <ExiaButton
          label="New prompt"
          variant="secondary"
          onPress={() => router.push('/prompt-editor')}
          style={styles.newButton}
        />
      </View>

      {prompts.isLoading ? <Loading label="Loading prompts…" /> : null}
      {prompts.isError && !prompts.data ? (
        <ExiaText variant="caption" style={{ color: t.destructive }}>
          Failed to load prompts.
        </ExiaText>
      ) : null}

      {items.map((p) => (
        <ExiaCard key={p.id} style={styles.libraryCard}>
          <View style={styles.presetHeader}>
            <ExiaText style={styles.presetTitle} numberOfLines={1}>
              {p.title}
            </ExiaText>
            <Badge label={p.type} tone={p.type === 'system' ? 'info' : 'muted'} />
          </View>
          <ExiaText variant="caption" numberOfLines={4}>
            {p.prompt_text}
          </ExiaText>
          <View style={styles.libraryActions}>
            <Pressable
              accessibilityLabel={`Share prompt ${p.title}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                void Share.share({ message: p.prompt_text });
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="copy-outline" size={18} color={t.mutedForeground} />
            </Pressable>
            <Pressable
              accessibilityLabel={`Edit prompt ${p.title}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push({ pathname: '/prompt-editor', params: { id: p.id } })}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="create-outline" size={18} color={t.primary} />
            </Pressable>
            <DeleteButton label="Delete" onPress={() => api.prompts.delete(p.id)} />
          </View>
        </ExiaCard>
      ))}

      {/* Curated starter directives when the library is empty */}
      {items.length === 0 && !prompts.isLoading ? (
        <>
          <ExiaText style={styles.tabSectionTitle}>Curated directives</ExiaText>
          <ExiaText variant="caption">
            Start from a curated directive — tap to prefill the editor.
          </ExiaText>
          {CURATED_DIRECTIVES.map((d) => (
            <ExiaCard key={d.title} style={styles.libraryCard}>
              <View style={styles.presetHeader}>
                <ExiaText style={styles.presetTitle}>{d.title}</ExiaText>
                <Badge label={d.badge} tone="muted" />
              </View>
              <ExiaText variant="caption" numberOfLines={3}>
                {d.prompt_text}
              </ExiaText>
              <ExiaButton
                label="Use directive"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/prompt-editor',
                    params: { title: d.title, prompt_text: d.prompt_text, type: d.type },
                  })
                }
                style={styles.useButton}
              />
            </ExiaCard>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Agent skills registry
// ---------------------------------------------------------------------------

function SkillsTab({
  skills,
  dirty,
  saving,
  error,
  onToggle,
  onSave,
}: {
  skills: AgentSkill[];
  dirty: boolean;
  saving: boolean;
  error: unknown;
  onToggle: (id: string) => void;
  onSave: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <ExiaText variant="caption">
        Modular capabilities the agent can invoke. Toggles apply after saving.
      </ExiaText>

      {skills.map((skill) => (
        <ExiaCard key={skill.id} style={styles.skillCard}>
          <View style={styles.skillHeader}>
            <ExiaText style={styles.presetTitle} numberOfLines={2}>
              {skill.name}
            </ExiaText>
            <Badge label={skill.category} tone={skill.enabled ? 'ok' : 'muted'} />
          </View>
          <ExiaText variant="caption">{skill.description}</ExiaText>
          <View style={styles.triggerRow}>
            {skill.triggers.slice(0, 4).map((trigger) => (
              <View key={trigger} style={styles.triggerChip}>
                <ExiaText variant="mono" style={styles.triggerText}>
                  {trigger}
                </ExiaText>
              </View>
            ))}
          </View>
          <ExiaButton
            accessibilityLabel={`${skill.enabled ? 'Disable' : 'Enable'} skill ${skill.name}`}
            label={skill.enabled ? 'Enabled' : 'Disabled'}
            variant={skill.enabled ? 'primary' : 'secondary'}
            onPress={() => onToggle(skill.id)}
            style={styles.skillToggle}
          />
        </ExiaCard>
      ))}

      {error ? (
        <ExiaText accessibilityRole="alert" style={[styles.error, { color: t.destructive }]}>
          {error instanceof Error ? error.message : 'Failed to save skills'}
        </ExiaText>
      ) : null}
      <ExiaButton
        disabled={saving || !dirty}
        label={saving ? 'Saving…' : 'Save skills'}
        onPress={onSave}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.sm, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  tabSectionTitle: { fontWeight: '600', marginTop: spacing.sm },
  presetCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.md,
  },
  presetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  presetTitle: { flexShrink: 1, fontWeight: '600' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  variablePill: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  variableText: { fontSize: 12 },
  basePromptInput: { minHeight: 140, textAlignVertical: 'top' },
  error: { marginBottom: spacing.sm },
  libraryToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterChip: {
    borderRadius: radius.full,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  newButton: { minHeight: 36, paddingVertical: spacing.xs },
  libraryCard: { gap: spacing.sm },
  libraryActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'flex-end',
  },
  useButton: { minHeight: 36, paddingVertical: spacing.xs },
  skillCard: { gap: spacing.sm },
  skillHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  triggerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  triggerChip: {
    backgroundColor: 'rgba(31, 213, 249, 0.10)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  triggerText: { fontSize: 11 },
  skillToggle: { minHeight: 36, paddingVertical: spacing.xs },
});
