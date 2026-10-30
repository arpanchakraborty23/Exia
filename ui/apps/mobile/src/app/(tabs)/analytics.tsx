import { useQuery } from '@tanstack/react-query';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { radius, spacing } from '@exia/design-tokens';
import { formatDuration, formatRelativeTime } from '@exia/shared-logic';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { api } from '@/lib/api';
import { Badge, ErrorState, Loading, ScreenHeader, Segmented } from '@/components/ui';

type AnalyticsTab = 'overview' | 'tools' | 'models' | 'json';

type AnalyticsMetrics = Awaited<ReturnType<typeof api.analytics.getMetrics>>;
type MCPServer = Awaited<ReturnType<typeof api.mcp.list>>[number];

/**
 * Analytics tab — "Agent Observability & Analytics", the port of the legacy
 * analytics-view: live MongoDB telemetry KPIs, the MCP tool matrix, model
 * distribution + token accounting, and the raw JSON payload inspector.
 */
export default function Analytics() {
  const t = useTheme();

  const metrics = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.analytics.getMetrics(),
  });

  const mcp = useQuery({
    queryKey: ['mcp'],
    queryFn: () => api.mcp.list(),
  });

  const m = metrics.data;
  const servers = mcp.data ?? [];
  const totalRegisteredTools = servers.reduce((sum, s) => sum + (s.tools?.length ?? 0), 0);

  const sync = () => {
    void metrics.refetch();
    void mcp.refetch();
  };

  const json = m ? JSON.stringify(m, null, 2) : null;

  return (
    <ExiaScreen>
      <ScreenHeader title="Analytics" subtitle="Agent observability & telemetry" />

      {metrics.isLoading && !m ? (
        <Loading label="Syncing telemetry…" />
      ) : metrics.isError && !m ? (
        <ErrorState
          message={metrics.error instanceof Error ? metrics.error.message : 'Failed to load telemetry'}
          onRetry={sync}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Sync bar */}
          <View style={styles.syncRow}>
            <View style={styles.livePill}>
              <View style={[styles.liveDot, { backgroundColor: '#10b981' }]} />
              <ExiaText style={styles.liveText}>Live MongoDB telemetry</ExiaText>
            </View>
            <ExiaButton
              accessibilityLabel="Sync telemetry"
              label={metrics.isRefetching ? 'Syncing…' : 'Sync'}
              variant="secondary"
              onPress={sync}
              disabled={metrics.isRefetching}
              style={styles.syncButton}
            />
          </View>

          <Segmented
            accessibilityLabel="Analytics section"
            options={['overview', 'tools', 'models', 'json'] as const}
            value={tab}
            onChange={setTab}
          />

          {tab === 'overview' ? (
            <OverviewTab m={m} servers={servers} totalRegisteredTools={totalRegisteredTools} />
          ) : tab === 'tools' ? (
            <ToolsTab servers={servers} totalRegisteredTools={totalRegisteredTools} />
          ) : tab === 'models' ? (
            <ModelsTab m={m} />
          ) : (
            <JsonTab json={json} />
          )}
        </ScrollView>
      )}
    </ExiaScreen>
  );
}
