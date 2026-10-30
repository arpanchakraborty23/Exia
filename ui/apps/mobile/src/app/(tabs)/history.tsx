import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { spacing } from '@exia/design-tokens';
import { formatCount, formatDuration, formatRelativeTime } from '@exia/shared-logic';
import { ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { SessionSummary } from '@exia/shared-types';

import { api } from '@/lib/api';
import { Badge, EmptyState, ErrorState, ExiaInput, Loading, ScreenHeader } from '@/components/ui';

const PAGE_SIZE = 10; // legacy parity (history-view fetches 10 per page)

type ModelFilter = 'all' | 'gemini' | 'modular';

/**
 * History tab — recorded voice sessions with search, model filter, and
 * server-side pagination (port of the legacy history-view's list logic).
 */
export default function History() {
  const t = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('all');

  const sessions = useInfiniteQuery({
    queryKey: ['sessions-infinite'],
    queryFn: ({ pageParam }) => api.sessions.getSessions(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.sessions.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
  });

  const allSessions = useMemo(
    () => sessions.data?.pages.flatMap((p) => p.sessions) ?? [],
    [sessions.data],
  );

  // Port of the legacy filter logic (history-view lines 559-574): search
  // across room name / preview / id, plus the gemini-vs-modular model split.
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allSessions.filter((s) => {
      const matchesSearch =
        !q ||
        s.room_name?.toLowerCase().includes(q) ||
        s.preview_text?.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q);
      const model = (s.model_used ?? '').toLowerCase();
      const matchesModel =
        modelFilter === 'all' ||
        (modelFilter === 'gemini' && model.includes('gemini')) ||
        (modelFilter === 'modular' && !model.includes('gemini'));
      return matchesSearch && matchesModel;
    });
  }, [allSessions, searchQuery, modelFilter]);

  if (sessions.isLoading) {
    return (
      <ExiaScreen>
        <ScreenHeader title="History" subtitle="Recorded voice sessions" />
        <Loading label="Loading sessions…" />
      </ExiaScreen>
    );
  }

  if (sessions.isError && allSessions.length === 0) {
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
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SessionRow item={item} />}
        contentContainerStyle={styles.list}
        // Search + filters live in the list header so they scroll away with
        // the content, keeping the whole screen one flat list.
        ListHeaderComponent={
          <View style={styles.controls}>
            <ExiaInput
              accessibilityLabel="Search sessions"
              autoCapitalize="none"
              placeholder="Search room, preview or session id…"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.filterRow}>
              {(['all', 'gemini', 'modular'] as const).map((f) => (
                <Pressable
                  key={f}
                  accessibilityLabel={`Filter ${f} models`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: modelFilter === f }}
                  onPress={() => setModelFilter(f)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      backgroundColor: modelFilter === f ? t.primary : t.input,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <ExiaText
                    style={{
                      color: modelFilter === f ? t.primaryForeground : t.foreground,
                      fontSize: 12,
                    }}
                  >
                    {f}
                  </ExiaText>
                </Pressable>
              ))}
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={sessions.isRefetching}
            onRefresh={() => {
              void sessions.refetch();
            }}
            tintColor={t.primary}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (sessions.hasNextPage && !sessions.isFetchingNextPage) {
            void sessions.fetchNextPage();
          }
        }}
        ListFooterComponent={
          sessions.isFetchingNextPage ? FooterSpinner : undefined
        }
        ListEmptyComponent={
          allSessions.length > 0 ? (
            <EmptyState
              title="No matching sessions"
              message="Try a different search or model filter."
            />
          ) : (
            <EmptyState
              title="No sessions yet"
              message="Start a voice session to see its transcript and telemetry here."
            />
          )
        }
      />

      {/* Refresh failed but cached rows exist — nonblocking notice */}
      {sessions.isError && allSessions.length > 0 ? (
        <ExiaText variant="caption" style={styles.refreshError}>
          Could not refresh — showing saved data.
        </ExiaText>
      ) : null}
    </ExiaScreen>
  );
}

function FooterSpinner() {
  return <Loading label="Loading more…" />;
}

function SessionRow({ item }: { item: SessionSummary }) {
  const active = item.status === 'active';
  const meta = [
    item.duration_seconds !== undefined ? formatDuration(item.duration_seconds) : null,
    item.total_tokens !== undefined ? `${formatCount(item.total_tokens)} tokens` : null,
    item.turns_count !== undefined ? `${item.turns_count} turns` : null,
    item.model_used ?? null,
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
          <View style={styles.rowHeader}>
            <ExiaText style={styles.rowTitle} numberOfLines={1}>
              {item.room_name}
            </ExiaText>
            <Badge label={active ? 'ACTIVE' : item.status.toUpperCase()} tone={active ? 'ok' : 'muted'} />
          </View>
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
  controls: { gap: spacing.sm, marginBottom: spacing.xs },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterChip: {
    borderRadius: 9999,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  row: { gap: spacing.xs },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  rowTitle: { flexShrink: 1, fontWeight: '600' },
  refreshError: { marginTop: spacing.sm, textAlign: 'center' },
});
