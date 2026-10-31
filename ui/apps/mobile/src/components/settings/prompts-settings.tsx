import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaText, useTheme } from '@exia/shared-ui';
import type { AgentSkill, PromptItem } from '@exia/shared-types';

import { api } from '@/lib/api';
import {
  Badge,
  DeleteButton,
  ExiaInput,
  Loading,
  Segmented,
  SkeletonCard,
} from '@/components/ui';

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
    description: 'Controls smart lights, switches, thermostats, and IoT devices through registered MCP servers.',
    category: 'automation',
    enabled: true,
    triggers: ['turn on', 'dim lights', 'set temperature', 'lock door', 'run scene'],
    instruction_prompt:
      'When the user requests home control actions, immediately invoke the corresponding MCP tool. Confirm state changes concisely without unnecessary filler.',
  },
  {
    id: 'skill_search',
    name: 'Live Web Search & Grounding',
    description: 'Performs real-time searches for news, weather forecasts, live sports scores, and technical documentation.',
    category: 'search',
    enabled: true,
    triggers: ['search', 'weather', 'latest news', 'who won', 'lookup online'],
    instruction_prompt:
      'For queries requiring real-time facts or external information, execute web search queries and synthesize up-to-date facts concisely with citations.',
  },
  {
    id: 'skill_code',
    name: 'Code Execution & Terminal Sandboxing',
    description: 'Executes commands, inspects local files, parses JSON/YAML configurations, and helps with engineering tasks.',
    category: 'code',
    enabled: true,
    triggers: ['run command', 'debug code', 'git status', 'check syntax', 'inspect file'],
    instruction_prompt:
      'Provide production-quality code. When running commands or scripts, ensure operations are sandboxed and explain any potential side effects.',
  },
  {
    id: 'skill_memory',
    name: 'Long-Term Memory & Context Recall',
    description: 'Retains past conversation context, user habits, and custom preferences across multiple sessions.',
    category: 'memory',
    enabled: true,
    triggers: ['remember this', 'what did I say', 'my preference', 'recall note'],
    instruction_prompt:
      'Persist important user preferences and recurring context in memory. Reference previous conversation facts naturally when relevant.',
  },
  {
    id: 'skill_voice',
    name: 'Speaker Voice Identification',
    description: 'Verifies speaker identity against enrolled voice signatures and enforces role permissions.',
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

export function PromptsSettings() {
  const t = useTheme();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<StudioTab>('base');

  const config = useQuery({
    queryKey: ['models-config'],
    queryFn: () => api.models.getConfig(),
  });

  const library = useQuery({
    queryKey: ['prompts'],
    queryFn: () => api.prompts.list(),
  });

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

  const deletePrompt = useMutation({
    mutationFn: (id: string) => api.prompts.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] }),
  });

  const toggleSkill = (id: string, enabled: boolean) => {
    const next = skills.map((s) => (s.id === id ? { ...s, enabled } : s));
    setSkillsDraft(next);
    saveConfig.mutate({ skills: next });
  };

  const insertVariable = (variable: string) => {
    setBaseDraft((prev) => `${prev ?? basePrompt} ${variable}`);
  };

  const prompts = library.data ?? [];

  return (
    <View style={styles.container}>
      {/* Studio Sub-Tabs */}
      <Segmented
        accessibilityLabel="Prompt Studio view"
        options={['base', 'library', 'skills'] as const}
        value={tab}
        onChange={setTab}
      />

      {/* Tab 1: Base System Prompt & Persona */}
      {tab === 'base' ? (
        <View style={styles.tabContent}>
          <ExiaCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles-outline" size={20} color={t.primary} />
              <ExiaText variant="title" style={styles.cardTitle}>
                System Directives & Persona
              </ExiaText>
            </View>
            <ExiaText variant="caption">
              The foundational persona injected into all LLM inference passes and LiveKit voice sessions.
            </ExiaText>

            <View style={styles.presetRow}>
              {BASE_PROMPT_PRESETS.map((preset) => (
                <Pressable
                  key={preset.title}
                  accessibilityRole="button"
                  accessibilityLabel={`Apply preset ${preset.title}`}
                  onPress={() => setBaseDraft(preset.text)}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor: basePrompt === preset.text ? t.primary : t.input,
                      borderColor: t.border,
                    },
                  ]}
                >
                  <ExiaText
                    variant="caption"
                    style={{
                      color: basePrompt === preset.text ? '#000000' : t.foreground,
                      fontWeight: '600',
                    }}
                  >
                    {preset.title}
                  </ExiaText>
                </Pressable>
              ))}
            </View>

            <View style={styles.variableSection}>
              <ExiaText variant="caption">Dynamic Variables (tap to insert):</ExiaText>
              <View style={styles.variableGrid}>
                {VARIABLE_PILLS.map((v) => (
                  <Pressable
                    key={v}
                    accessibilityRole="button"
                    accessibilityLabel={`Insert variable ${v}`}
                    onPress={() => insertVariable(v)}
                    style={[styles.varPill, { backgroundColor: t.input, borderColor: t.border }]}
                  >
                    <ExiaText variant="mono" style={styles.varText}>
                      {v}
                    </ExiaText>
                  </Pressable>
                ))}
              </View>
            </View>

            <ExiaInput
              multiline
              value={basePrompt}
              onChangeText={setBaseDraft}
              placeholder="Enter system prompt directives..."
              style={styles.promptInput}
            />

            <ExiaButton
              label={saveConfig.isPending ? 'Saving Persona…' : 'Save System Persona'}
              variant="primary"
              disabled={saveConfig.isPending || baseDraft === null}
              onPress={() => saveConfig.mutate({ base_system_prompt: basePrompt })}
            />
          </ExiaCard>
        </View>
      ) : null}

      {/* Tab 2: Prompt Directives Library */}
      {tab === 'library' ? (
        <View style={styles.tabContent}>
          <View style={styles.libraryActions}>
            <ExiaButton
              label="+ Create Directive"
              variant="primary"
              onPress={() => router.push('/prompt-editor')}
            />
          </View>

          {library.isLoading ? <Loading label="Loading directives…" /> : null}

          {prompts.length === 0 && !library.isLoading ? (
            <ExiaCard style={styles.card}>
              <ExiaText variant="title">Curated Starters</ExiaText>
              <ExiaText variant="caption">
                No custom directives yet. Tap any preset below to load it into the editor:
              </ExiaText>
              {CURATED_DIRECTIVES.map((item) => (
                <Pressable
                  key={item.title}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/prompt-editor',
                      params: { title: item.title, prompt_text: item.prompt_text, type: item.type },
                    })
                  }
                  style={[styles.curatedItem, { borderColor: t.border }]}
                >
                  <View style={styles.curatedHeader}>
                    <ExiaText style={styles.curatedTitle}>{item.title}</ExiaText>
                    <Badge label={item.badge} tone="info" />
                  </View>
                  <ExiaText variant="caption" numberOfLines={2}>
                    {item.prompt_text}
                  </ExiaText>
                </Pressable>
              ))}
            </ExiaCard>
          ) : null}

          {prompts.map((p) => (
            <ExiaCard key={p.id} style={styles.card}>
              <View style={styles.promptItemHeader}>
                <View style={styles.promptItemInfo}>
                  <ExiaText variant="title" style={styles.promptItemTitle}>
                    {p.title}
                  </ExiaText>
                  <Badge label={p.type.toUpperCase()} tone="muted" />
                </View>
                <View style={styles.promptItemActions}>
                  <Pressable
                    accessibilityLabel={`Edit prompt ${p.title}`}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/prompt-editor',
                        params: { id: p.id, title: p.title, prompt_text: p.prompt_text, type: p.type },
                      })
                    }
                    hitSlop={8}
                  >
                    <Ionicons name="pencil-outline" size={18} color={t.primary} />
                  </Pressable>
                  <DeleteButton onPress={() => deletePrompt.mutate(p.id)} />
                </View>
              </View>
              <ExiaText variant="caption" numberOfLines={3}>
                {p.prompt_text}
              </ExiaText>
            </ExiaCard>
          ))}
        </View>
      ) : null}

      {/* Tab 3: Agent Skills Registry */}
      {tab === 'skills' ? (
        <View style={styles.tabContent}>
          {skills.map((skill) => (
            <ExiaCard key={skill.id} style={styles.card}>
              <View style={styles.skillRow}>
                <View style={styles.skillText}>
                  <View style={styles.skillTitleRow}>
                    <ExiaText variant="title" style={styles.skillName}>
                      {skill.name}
                    </ExiaText>
                    <Badge label={skill.category.toUpperCase()} tone="info" />
                  </View>
                  <ExiaText variant="caption">{skill.description}</ExiaText>
                </View>
                <Switch
                  value={skill.enabled}
                  onValueChange={(enabled) => toggleSkill(skill.id, enabled)}
                  thumbColor={skill.enabled ? t.primary : t.mutedForeground}
                  trackColor={{ false: t.input, true: 'rgba(31, 213, 249, 0.4)' }}
                />
              </View>

              <View style={[styles.separator, { backgroundColor: t.border }]} />

              <ExiaText variant="caption" style={styles.triggerLabel}>
                Triggers: {skill.triggers.join(', ')}
              </ExiaText>
            </ExiaCard>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  tabContent: { gap: spacing.md },
  card: { gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.xs },
  presetPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  variableSection: { gap: spacing.xs, marginVertical: spacing.xs },
  variableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  varPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  varText: { fontSize: 11 },
  promptInput: { minHeight: 120, marginVertical: spacing.xs },
  libraryActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  curatedItem: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  curatedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  curatedTitle: { fontWeight: '600', fontSize: 14 },
  promptItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  promptItemInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  promptItemTitle: { fontSize: 15, fontWeight: '600' },
  promptItemActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  skillText: { flex: 1, gap: 4 },
  skillTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  skillName: { fontSize: 15, fontWeight: '600' },
  separator: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
  triggerLabel: { fontStyle: 'italic' },
});
