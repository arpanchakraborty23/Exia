import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';

import { spacing } from '@exia/design-tokens';
import { formatCount, formatDuration, formatRelativeTime } from '@exia/shared-logic';
import { ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { SessionSummary } from '@exia/shared-types';

import { api } from '@/lib/api';
import { Badge, EmptyState, ErrorState, Loading, ScreenHeader } from '@/components/ui';

/**
 * History tab — recorded voice sessions with pull-to-refresh.
 */
export default function History() {
  const t = useTheme();

  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.sessions.getSessions(1, 50),
  });

  const data = sessions.data;

  if (sessions.isLoading) {
    return (
      <ExiaScreen>
        <ScreenHeader title="History" subtitle="Recorded voice sessions" />
        <Loading label="Loading sessions…" />
      </ExiaScreen>
    );
  }

  if (sessions.isError && !data) {
    return (
      <ExiaScreen>
        <ScreenHeader title="History" subtitle="Recorded voice sessions" />
        <ErrorState
          message={sessions.error instanceof Error ? sessions.error.message : 'Failed to load sessions'}
          onRetry={() => sessions.refetch()}
        />
      </ExiaScreen>
    );
  }

  return (
    <ExiaScreen>
      <ScreenHeader title="History" subtitle="Recorded voice sessions" />

      <FlatList
        data={data?.sessions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionRow item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={sessions.isRefetching}
            onRefresh={() => {
              void sessions.refetch();
            }}
            tintColor={t.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No sessions yet"
            message="Start a voice session to see its transcript and telemetry here."
          />
        }
      />

      {/* Refresh failed but cached rows exist — nonblocking notice */}
      {sessions.isError && data ? (
        <ExiaText variant="caption" style={styles.refreshError}>
          Could not refresh — showing saved data.
        </ExiaText>
      ) : null}
    </ExiaScreen>
  );
}

function SessionRow({ item }: { item: SessionSummary }) {
  const active = item.status === 'active';
  const meta = [
    item.duration_seconds !== undefined ? formatDuration(item.duration_seconds) : null,
    item.total_tokens !== undefined ? `${formatCount(item.total_tokens)} tokens` : null,
    item.turns_count !== undefined ? `${item.turns_count} turns` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link href={`/session/${item.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open session ${item.room_name}`}
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
      >
        <ExiaCard style={styles.row}>
          <ExiaText style={styles.rowTitle}>{item.room_name}</ExiaText>
          <Badge label={active ? 'ACTIVE' : item.status.toUpperCase()} tone={active ? 'ok' : 'muted'} />
          <ExiaText variant="caption">{formatRelativeTime(item.started_at)}</ExiaText>
          {item.preview_text ? (
            <ExiaText variant="caption" numberOfLines={2}>
              {item.preview_text}
            </ExiaText>
          ) : null}
          {meta ? <ExiaText variant="mono">{meta}</ExiaText> : null}
        </ExiaCard>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xxl },
  row: { gap: spacing.xs },
  rowTitle: { fontWeight: '600' },
  refreshError: { marginTop: spacing.sm, textAlign: 'center' },
});
