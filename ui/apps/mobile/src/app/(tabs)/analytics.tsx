import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
  const [tab, setTab] = useState<AnalyticsTab>('overview');

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
          {/* Sync bar — legacy "Live MongoDB Telemetry" pill + refresh */}
          <View style={styles.syncRow}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <ExiaText style={styles.liveText}>Live telemetry</ExiaText>
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
            <OverviewTab m={m} serverCount={servers.length} toolCount={totalRegisteredTools} />
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

// ---------------------------------------------------------------------------
// Tab 1 — Overview & KPIs
// ---------------------------------------------------------------------------

function OverviewTab({
  m,
  serverCount,
  toolCount,
}: {
  m?: AnalyticsMetrics;
  serverCount: number;
  toolCount: number;
}) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.kpiGrid}>
        <KpiCard
          label="Total sessions"
          value={String(m?.total_sessions ?? 0)}
          hint={`${m?.formatted_duration || '0m 0s'} voice stream`}
          badge={{ label: 'LIVE', tone: 'ok' }}
        />
        <KpiCard
          label="Avg E2E latency"
          value={m?.avg_latency?.e2e_ms ? `${m.avg_latency.e2e_ms}ms` : 'Pending'}
          hint={`TTFT ${m?.avg_latency?.llm_ttft_ms ?? 0}ms · STT ${m?.avg_latency?.stt_ms ?? 0}ms`}
          badge={{ label: 'REALTIME', tone: 'info' }}
        />
        <KpiCard
          label="Total tokens"
          value={(m?.total_tokens?.total_tokens ?? 0).toLocaleString()}
          hint={`${m?.total_turns ?? 0} conversational turns`}
          badge={{ label: 'AUDIO+TEXT', tone: 'muted' }}
        />
        <KpiCard
          label="MCP tool calls"
          value={String(m?.total_tool_calls ?? 0)}
          hint={`${serverCount} servers · ${toolCount} tools`}
          badge={{ label: 'REGISTRY', tone: 'ok' }}
        />
      </View>

      {/* Recent voice sessions */}
      <ExiaText style={styles.tabSectionTitle}>Recent voice sessions</ExiaText>
      {(() => {
        const activity = m?.recent_activity ?? [];
        return activity.length > 0 ? (
          activity.map((s) => (
            <ExiaCard key={s.session_id} style={styles.sessionRow}>
              <View style={styles.sessionTop}>
                <ExiaText variant="mono" numberOfLines={1} style={styles.sessionId}>
                  {s.session_id}
                </ExiaText>
                <Badge label={s.status || 'unknown'} tone={s.status === 'completed' ? 'ok' : 'muted'} />
              </View>
              <ExiaText variant="caption" numberOfLines={1}>
                {s.room_name || '—'} · {formatDuration(s.duration_seconds)} · {s.turns} turns ·{' '}
                {s.timestamp ? formatRelativeTime(s.timestamp) : '—'}
              </ExiaText>
            </ExiaCard>
          ))
        ) : (
          <ExiaCard style={styles.emptyCard}>
            <ExiaText style={styles.emptyTitle}>No voice sessions recorded yet</ExiaText>
            <ExiaText variant="caption" style={styles.emptyMessage}>
              Start a conversation from the Voice tab to stream realtime telemetry
              into MongoDB.
            </ExiaText>
          </ExiaCard>
        );
      })()}
    </View>
  );
}

function KpiCard({
  label,
  value,
  hint,
  badge,
}: {
  label: string;
  value: string;
  hint: string;
  badge?: { label: string; tone: 'ok' | 'muted' | 'warn' | 'info' };
}) {
  return (
    <ExiaCard style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <ExiaText variant="caption" numberOfLines={1}>
          {label}
        </ExiaText>
        {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
      </View>
      <ExiaText variant="title" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ExiaText>
      <ExiaText variant="caption" numberOfLines={2}>
        {hint}
      </ExiaText>
    </ExiaCard>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — MCP tools matrix
// ---------------------------------------------------------------------------

function ToolsTab({
  servers,
  totalRegisteredTools,
}: {
  servers: MCPServer[];
  totalRegisteredTools: number;
}) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.toolsHeader}>
        <ExiaText style={styles.tabSectionTitle}>Connected MCP servers</ExiaText>
        <ExiaText variant="caption">
          {servers.length} servers · {totalRegisteredTools} tools
        </ExiaText>
      </View>

      {servers.map((s) => (
        <ExiaCard key={s.id} style={styles.serverCard}>
          <View style={styles.sessionTop}>
            <ExiaText style={styles.serverName} numberOfLines={1}>
              {s.name}
            </ExiaText>
            <Badge
              label={s.enabled ? 'Connected' : 'Disabled'}
              tone={s.enabled ? 'ok' : 'muted'}
            />
          </View>
          <ExiaText variant="caption" numberOfLines={1}>
            {s.server_type.toUpperCase()} · {s.command_or_url}
          </ExiaText>
          <ExiaText variant="caption" numberOfLines={2}>
            {s.tools && s.tools.length > 0
              ? `${s.tools.length} tools: ${s.tools.slice(0, 3).join(', ')}${s.tools.length > 3 ? ` +${s.tools.length - 3}` : ''}`
              : 'No tools reported'}
          </ExiaText>
        </ExiaCard>
      ))}

      {servers.length === 0 ? (
        <ExiaCard style={styles.emptyCard}>
          <ExiaText style={styles.emptyTitle}>No MCP servers registered</ExiaText>
          <ExiaText variant="caption" style={styles.emptyMessage}>
            Connect tool servers in the MCP tab to see them here.
          </ExiaText>
        </ExiaCard>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Model distribution + token accounting
// ---------------------------------------------------------------------------

function ModelsTab({ m }: { m?: AnalyticsMetrics }) {
  const t = useTheme();
  const breakdown = m?.model_breakdown ?? [];

  return (
    <View style={styles.tabContent}>
      <ExiaText style={styles.tabSectionTitle}>Model session distribution</ExiaText>
      <ExiaCard style={styles.tokenCard}>
        {breakdown.length > 0 ? (
          breakdown.map((mb) => (
            <View key={mb.model} style={styles.barRow}>
              <View style={styles.barLabels}>
                <ExiaText numberOfLines={1} style={styles.barModel}>
                  {mb.model}
                </ExiaText>
                <ExiaText variant="caption">
                  {mb.sessions} sessions ({mb.percentage}%)
                </ExiaText>
              </View>
              <View style={[styles.barTrack, { backgroundColor: t.input }]}>
                <View
                  style={[
                    styles.barFill,
                    { backgroundColor: t.primary, width: `${Math.min(100, Math.max(2, mb.percentage))}%` },
                  ]}
                />
              </View>
            </View>
          ))
        ) : (
          <ExiaText variant="caption">
            Default: Gemini 2.0 Flash Live (multimodal bidirectional WebRTC).
          </ExiaText>
        )}
      </ExiaCard>

      <ExiaText style={styles.tabSectionTitle}>Token consumption</ExiaText>
      <ExiaCard style={styles.tokenCard}>
        <View style={styles.tokenRow}>
          <ExiaText variant="caption">Prompt / context tokens</ExiaText>
          <ExiaText variant="mono">{(m?.total_tokens?.prompt_tokens ?? 0).toLocaleString()}</ExiaText>
        </View>
        <View style={styles.tokenRow}>
          <ExiaText variant="caption">Completion / output tokens</ExiaText>
          <ExiaText variant="mono">
            {(m?.total_tokens?.completion_tokens ?? 0).toLocaleString()}
          </ExiaText>
        </View>
        <View style={[styles.tokenRow, styles.tokenTotal]}>
          <ExiaText style={styles.tokenTotalLabel}>Grand total</ExiaText>
          <ExiaText variant="mono" style={{ color: t.primary }}>
            {(m?.total_tokens?.total_tokens ?? 0).toLocaleString()}
          </ExiaText>
        </View>
      </ExiaCard>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Live JSON telemetry inspector
// ---------------------------------------------------------------------------

function JsonTab({ json }: { json: string | null }) {
  const payload = json ?? JSON.stringify({ status: 'Awaiting telemetry events…' }, null, 2);

  return (
    <View style={styles.tabContent}>
      <View style={styles.toolsHeader}>
        <ExiaText style={styles.tabSectionTitle}>Live telemetry payload</ExiaText>
        <ExiaButton
          accessibilityLabel="Share telemetry JSON"
          label="Share JSON"
          variant="secondary"
          onPress={() => {
            void Share.share({ message: payload });
          }}
          style={styles.syncButton}
        />
      </View>
      <ExiaCard style={styles.jsonCard}>
        <View style={styles.jsonHeader}>
          <ExiaText variant="mono" style={styles.jsonSchema}>
            schema: Exia.AnalyticsMetricsResponse
          </ExiaText>
          <Badge label="LIVE" tone="ok" />
        </View>
        <ExiaText variant="mono" style={styles.jsonBody}>
          {payload}
        </ExiaText>
      </ExiaCard>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xxl },
  syncRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  livePill: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  liveDot: {
    backgroundColor: '#10b981', // liveEmerald — live status only
    borderRadius: radius.full,
    height: 6,
    width: 6,
  },
  liveText: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  syncButton: { minHeight: 36, paddingVertical: spacing.xs },
  tabContent: { gap: spacing.sm },
  tabSectionTitle: { fontWeight: '600', marginTop: spacing.xs },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '47%',
    gap: spacing.xs,
  },
  kpiHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  sessionRow: { gap: spacing.xs },
  sessionTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  sessionId: { flexShrink: 1, fontWeight: '500' },
  emptyCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl },
  emptyTitle: { fontWeight: '600' },
  emptyMessage: { textAlign: 'center' },
  toolsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  serverCard: { gap: spacing.xs },
  serverName: { flexShrink: 1, fontWeight: '600' },
  barRow: { gap: spacing.xs },
  barLabels: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  barModel: { flexShrink: 1, fontWeight: '500' },
  barTrack: {
    borderRadius: radius.full,
    height: 8,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.full },
  tokenCard: { gap: spacing.sm },
  tokenRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  tokenTotal: { borderBottomWidth: 0, paddingBottom: 0 },
  tokenTotalLabel: { fontWeight: '600' },
  jsonCard: { gap: spacing.sm },
  jsonHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  jsonSchema: { flexShrink: 1, fontSize: 11, opacity: 0.7 },
  jsonBody: { fontSize: 11, lineHeight: 18 },
});
