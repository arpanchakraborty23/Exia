import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@exia/design-tokens';
import { ExiaScreen } from '@exia/shared-ui';

import { PromptsSettings } from '@/components/settings/prompts-settings';
import { ScreenHeader } from '@/components/ui';

export default function PromptsScreen() {
  return (
    <ExiaScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ScreenHeader
          title="Directives & Prompts"
          subtitle="Part of Settings Hub"
          onBack={() => router.push('/settings?section=prompts')}
        />
        <PromptsSettings />
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxxl,
  },
});
