import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@exia/design-tokens';
import { ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { ScreenHeader, Segmented } from '@/components/ui';
import { GeneralSettings } from '@/components/settings/general-settings';
import { McpSettings } from '@/components/settings/mcp-settings';
import { ModelSettings } from '@/components/settings/model-settings';
import { PromptsSettings } from '@/components/settings/prompts-settings';

type SettingsSection = 'general' | 'models' | 'prompts' | 'mcp';

export default function SettingsScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<{ section?: string }>();
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  useEffect(() => {
    if (params.section && ['general', 'models', 'prompts', 'mcp'].includes(params.section)) {
      setActiveSection(params.section as SettingsSection);
    }
  }, [params.section]);

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
  },
  navRow: {
    marginBottom: spacing.lg,
  },
  content: {
    flex: 1,
  },
});
