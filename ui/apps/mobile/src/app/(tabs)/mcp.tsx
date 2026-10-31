import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@exia/design-tokens';
import { ExiaScreen } from '@exia/shared-ui';

import { McpSettings } from '@/components/settings/mcp-settings';
import { ScreenHeader } from '@/components/ui';

export default function McpScreen() {
  return (
    <ExiaScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ScreenHeader
          title="MCP Tools & Servers"
          subtitle="Part of Settings Hub"
          onBack={() => router.push('/settings?section=mcp')}
        />
        <McpSettings />
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxxl,
  },
});
