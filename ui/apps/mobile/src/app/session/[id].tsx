import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing } from '@exia/design-tokens';
import { formatCount, formatDuration, formatRelativeTime } from '@exia/shared-logic';
import { ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { api } from '@/lib/api';
import { Badge, ErrorState, Loading, ScreenHeader } from '@/components/ui';

/**
 * Session detail — summary metrics, transcript, and MCP tool invocations.
 * Route: /session/[id]
 */
export default function SessionDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const session = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.sessions.getSessionById(id),
    enabled: Boolean(id),
  });

  const data = session.data;

  const meta = [
    data?.duration_seconds !== undefined ? formatDuration(data.duration_seconds) : null,
    data?.total_tokens !== undefined ? `${formatCount(data.total_tokens)} tokens` : null,
    data?.avg_latency_ms !== undefined ? `${formatCount(data.avg_latency_ms)} ms avg` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Theme-dependent styles must be built inside the component tree.
  const styles = makeStyles(t.card, t.border, t.secondary);

  return (
    <ExiaScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={data?.room_name ?? 'Session'}
          subtitle={data ? formatRelativeTime(data.started_at) : undefined}
          onBack={() => router.back()}
        />

        {session.isLoading || !data ? (
          <Loading label="Loading session…" />
        ) : (
          <>
            <ExiaCard style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Badge
                  label={data.status === 'active' ? 'ACTIVE' : data.status.toUpperCase()}
                  tone={data.status === 'active' ? 'ok' : 'muted'}
                />
                {data.model_used ? <Badge label={data.model_used} tone="info" /> : null}
              </View>
              {meta ? <ExiaText variant="mono">{meta}</ExiaText> : null}
              {data.analytics ? (
                <ExiaText variant="caption">
                  {data.analytics.total_turns} turns · tool success{' '}
                  {Math.round(data.analytics.tool_success_rate * 100)}%
                </ExiaText>
              ) : null}
            </ExiaCard>

            {data.transcript.length > 0 ? (
              <ExiaText style={styles.sectionTitle}>Transcript</ExiaText>
            ) : null}
            {data.transcript.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.bubble,
                  message.role === 'user' ? styles.bubbleUser : null,
                ]}
              >
                <View style={styles.bubbleMeta}>
                  <Ionicons name="time-outline" size={11} color={t.mutedForeground} />
                  <ExiaText variant="caption" style={styles.bubbleTime}>
                    {message.role === 'user' ? 'You' : 'Exia'} · {formatRelativeTime(message.timestamp)}
                  </ExiaText>
                </View>
                <ExiaText>{message.text}</ExiaText>
              </View>
            ))}

            {data.transcript.length === 0 ? (
              <ExiaText variant="caption">No transcript was recorded for this session.</ExiaText>
            ) : null}

            {data.mcp_tools_invoked && data.mcp_tools_invoked.length > 0 ? (
              <>
                <ExiaText style={styles.sectionTitle}>Tool calls</ExiaText>
                {data.mcp_tools_invoked.map((call) => (
                  <ExiaCard key={call.id} style={styles.toolCard}>
                    <View style={styles.summaryRow}>
                      <ExiaText variant="mono" style={styles.toolName}>
                        {call.name}
                      </ExiaText>
                      <Badge
                        label={call.status.toUpperCase()}
                        tone={
                          call.status === 'success' ? 'ok' : call.status === 'error' ? 'warn' : 'muted'
                        }
                      />
                    </View>
                    {call.result ? (
                      <ExiaText variant="mono" numberOfLines={4}>
                        {call.result}
                      </ExiaText>
                    ) : null}
                  </ExiaCard>
                ))}
              </>
            ) : null}
          </>
        )}

        {session.isError && !data ? (
          <ErrorState
            message={session.error instanceof Error ? session.error.message : 'Failed to load session'}
            onRetry={() => session.refetch()}
          />
        ) : null}
      </ScrollView>
    </ExiaScreen>
  );
}

const makeStyles = (cardBg: string, border: string, userBubbleBg: string) =>
  StyleSheet.create({
    scroll: {
      paddingBottom: spacing.xxl,
      maxWidth: 760,
      width: '100%',
      alignSelf: 'center',
    },
    summaryCard: { gap: spacing.sm, marginBottom: spacing.lg },
    summaryRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    bubble: {
      alignSelf: 'flex-start',
      backgroundColor: cardBg,
      borderColor: border,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      gap: spacing.xs,
      marginBottom: spacing.sm,
      maxWidth: '92%',
      padding: spacing.md,
    },
    bubbleMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    bubbleTime: {
      fontSize: 12,
      fontWeight: '500',
    },
    bubbleUser: { alignSelf: 'flex-end', backgroundColor: userBubbleBg },
    toolCard: { gap: spacing.sm, marginBottom: spacing.sm },
    toolName: { flex: 1 },
  });
