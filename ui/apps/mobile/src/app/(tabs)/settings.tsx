import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { ScreenHeader, Segmented } from '@/components/ui';
import { GeneralSettings } from '@/components/settings/general-settings';
import { McpSettings } from '@/components/settings/mcp-settings';
import { ModelSettings } from '@/components/settings/model-settings';
import { PromptsSettings } from '@/components/settings/prompts-settings';

type SettingsSection = 'general' | 'models' | 'prompts' | 'mcp';

function isSettingsSection(section: unknown): section is SettingsSection {
  return section === 'general' || section === 'models' || section === 'prompts' || section === 'mcp';
}

interface SectionMeta {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  shortDesc: string;
}

const SECTIONS_META: Record<SettingsSection, SectionMeta> = {
  general: {
    title: 'General Settings',
    subtitle: 'Personalization, theme customization & localization',
    icon: 'options-outline',
    shortDesc: 'Theme & Hardware',
  },
  models: {
    title: 'Model & Provider Settings',
    subtitle: 'Speech-to-speech, LLMs, fallback cascade & acoustic profiles',
    icon: 'hardware-chip-outline',
    shortDesc: 'LLMs & Voice Cascade',
  },
  prompts: {
    title: 'Directives & Prompts',
    subtitle: 'System persona, prompt library & agent skills matrix',
    icon: 'sparkles-outline',
    shortDesc: 'Directives & Persona',
  },
  mcp: {
    title: 'MCP Tools & Servers',
    subtitle: 'Model Context Protocol tool providers & integrations',
    icon: 'construct-outline',
    shortDesc: 'Tools & MCP Registry',
  },
};

export default function SettingsScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  const params = useLocalSearchParams<{ section?: string }>();
  const [activeSection, setActiveSection] = useState<SettingsSection>(() =>
    isSettingsSection(params.section) ? params.section : 'general',
  );
  const [previousSectionParam, setPreviousSectionParam] = useState(params.section);

  if (params.section !== previousSectionParam) {
    setPreviousSectionParam(params.section);
    if (isSettingsSection(params.section)) {
      setActiveSection(params.section);
    }
  }

  const currentInfo = SECTIONS_META[activeSection];

  const sectionKeys: SettingsSection[] = ['general', 'models', 'prompts', 'mcp'];

  return (
    <ExiaScreen>
      <ScrollView
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ScreenHeader title={currentInfo.title} subtitle={currentInfo.subtitle} />

        {/* High-Density Multi-Pane View (Desktop) vs Segmented Bar (Mobile) */}
        {isDesktop ? (
          <View style={styles.desktopSplitLayout}>
            {/* Left Desktop Settings Navigation Rail */}
            <View style={[styles.settingsNavRail, { backgroundColor: t.card, borderColor: t.border }]}>
              <ExiaText variant="caption" style={styles.railSectionTitle}>
                SETTINGS HUB
              </ExiaText>

              {sectionKeys.map((key) => {
                const meta = SECTIONS_META[key];
                const active = activeSection === key;

                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={meta.title}
                    onPress={() => setActiveSection(key)}
                    style={[
                      styles.railItem,
                      active && {
                        backgroundColor: 'rgba(31, 213, 249, 0.12)',
                        borderColor: brand.electricCyan,
                      },
                      !active && { borderColor: 'transparent' },
                    ]}
                  >
                    <Ionicons
                      name={meta.icon}
                      size={18}
                      color={active ? brand.electricCyan : t.mutedForeground}
                    />
                    <View style={styles.railItemText}>
                      <ExiaText
                        style={[
                          styles.railItemTitle,
                          active && { color: brand.electricCyan, fontWeight: '700' },
                        ]}
                      >
                        {meta.title.replace(' Settings', '')}
                      </ExiaText>
                      <ExiaText variant="caption" numberOfLines={1} style={styles.railItemSub}>
                        {meta.shortDesc}
                      </ExiaText>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Right Pane: Active Domain Content */}
            <View style={styles.desktopContentPane}>
              {activeSection === 'general' ? <GeneralSettings /> : null}
              {activeSection === 'models' ? <ModelSettings /> : null}
              {activeSection === 'prompts' ? <PromptsSettings /> : null}
              {activeSection === 'mcp' ? <McpSettings /> : null}
            </View>
          </View>
        ) : (
          <>
            {/* Mobile / Narrow View: Segmented Header Tabs */}
            <View style={styles.navRow}>
              <Segmented
                options={['general', 'models', 'prompts', 'mcp'] as const}
                labels={{
                  general: 'General',
                  models: 'Models',
                  prompts: 'Prompts',
                  mcp: 'MCP Tools',
                }}
                value={activeSection}
                onChange={setActiveSection}
                accessibilityLabel="Settings category"
              />
            </View>

            {/* Active Domain Panel */}
            <View style={styles.content}>
              {activeSection === 'general' ? <GeneralSettings /> : null}
              {activeSection === 'models' ? <ModelSettings /> : null}
              {activeSection === 'prompts' ? <PromptsSettings /> : null}
              {activeSection === 'mcp' ? <McpSettings /> : null}
            </View>
          </>
        )}
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 110,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  scrollDesktop: {
    maxWidth: 1240,
  },
  desktopSplitLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    width: '100%',
  },
  settingsNavRail: {
    width: 250,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  railSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  railItemText: {
    flex: 1,
    gap: 1,
  },
  railItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  railItemSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  desktopContentPane: {
    flex: 1,
  },
  navRow: {
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
  },
});
