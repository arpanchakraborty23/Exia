import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@exia/design-tokens';
import { ExiaScreen } from '@exia/shared-ui';

import { ScreenHeader, Segmented } from '@/components/ui';
import { GeneralSettings } from '@/components/settings/general-settings';
import { McpSettings } from '@/components/settings/mcp-settings';
import { ModelSettings } from '@/components/settings/model-settings';
import { PromptsSettings } from '@/components/settings/prompts-settings';

type SettingsSection = 'general' | 'models' | 'prompts' | 'mcp';

function isSettingsSection(section: unknown): section is SettingsSection {
  return section === 'general' || section === 'models' || section === 'prompts' || section === 'mcp';
}

export default function SettingsScreen() {
  const params = useLocalSearchParams<{ section?: string }>();
  const [activeSection, setActiveSection] = useState<SettingsSection>(() =>
    isSettingsSection(params.section) ? params.section : 'general'
  );
  const [previousSectionParam, setPreviousSectionParam] = useState(params.section);

  if (params.section !== previousSectionParam) {
    setPreviousSectionParam(params.section);
    if (isSettingsSection(params.section)) {
      setActiveSection(params.section);
    }
  }

  const sectionTitles: Record<SettingsSection, { title: string; subtitle: string }> = {
    general: {
      title: 'General Settings',
      subtitle: 'Personalization, theme customization & localization',
    },
    models: {
      title: 'Model & Provider Settings',
      subtitle: 'Speech-to-speech, LLMs, fallback cascade & acoustic profiles',
    },
    prompts: {
      title: 'Directives & Prompts',
      subtitle: 'System persona, prompt library & agent skills matrix',
    },
    mcp: {
      title: 'MCP Tools & Servers',
      subtitle: 'Model Context Protocol tool providers & integrations',
    },
  };

  const currentInfo = sectionTitles[activeSection];

  return (
    <ExiaScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ScreenHeader title={currentInfo.title} subtitle={currentInfo.subtitle} />

        {/* Section Navigation Tabs */}
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
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxxl,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  navRow: {
    marginBottom: spacing.lg,
  },
  content: {
    flex: 1,
  },
});
