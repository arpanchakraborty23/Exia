import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing, typography } from '@exia/design-tokens';
import { formatCount, formatDuration, formatRelativeTime } from '@exia/shared-logic';
import { ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { SessionSummary } from '@exia/shared-types';

import { api } from '@/lib/api';
import { Badge, EmptyState, ErrorState, Loading, ScreenHeader, Skeleton, SkeletonCard } from '@/components/ui';

const PAGE_SIZE = 10; // legacy parity (history-view fetches 10 per page)

type ModelFilter = 'all' | 'gemini' | 'modular';

interface FilterOption {
  id: ModelFilter;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const FILTER_OPTIONS: readonly FilterOption[] = [
  { id: 'all', label: 'All', icon: 'albums-outline' },
  { id: 'gemini', label: 'Gemini', icon: 'sparkles-outline' },
  { id: 'modular', label: 'Modular', icon: 'cube-outline' },
] as const;

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
        <View style={styles.list}>
          <View style={styles.controls}>
            <Skeleton height={44} borderRadius={radius.md} />
            <View style={styles.filterRow}>
              <Skeleton width={68} height={32} borderRadius={radius.full} />
              <Skeleton width={88} height={32} borderRadius={radius.full} />
              <Skeleton width={92} height={32} borderRadius={radius.full} />
            </View>
          </View>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </View>
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
            {/* Search input with icon and clear button */}
            <View style={[styles.searchBox, { backgroundColor: t.input, borderColor: t.border }]}>
              <Ionicons
                name="search-outline"
                size={17}
                color={t.mutedForeground}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: t.foreground }]}
                placeholderTextColor={t.mutedForeground}
                accessibilityLabel="Search sessions"
                autoCapitalize="none"
                placeholder="Search room, preview or session ID…"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 ? (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={16} color={t.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            {/* Filter chips with active/inactive borders and subtle background tints */}
            <View style={styles.filterRow}>
              {FILTER_OPTIONS.map((opt) => {
                const isSelected = modelFilter === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityLabel={`Filter ${opt.label} models`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => setModelFilter(opt.id)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? 'rgba(31, 213, 249, 0.12)' : t.card,
                        borderColor: isSelected ? t.primary : t.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={13}
                      color={isSelected ? t.primary : t.mutedForeground}
                    />
                    <ExiaText
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected ? t.primary : t.mutedForeground,
                          fontWeight: isSelected ? '600' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </ExiaText>
                  </Pressable>
                );
              })}
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
              message="No recorded sessions match your search or model filter."
              actionLabel="Clear filters"
              onAction={() => {
                setSearchQuery('');
                setModelFilter('all');
              }}
            />
          ) : (
            <EmptyState
              title="No sessions yet"
              message="Start a voice session to see its transcript, audio metrics, and telemetry here."
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
  const t = useTheme();
  const active = item.status === 'active';
  const isGemini = (item.model_used ?? '').toLowerCase().includes('gemini');

  return (
    <Link href={`/session/${item.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open session ${item.room_name}`}
        style={({ pressed }) => [
          styles.rowCard,
          {
            backgroundColor: t.card,
            borderColor: pressed ? t.primary : t.border,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        {/* Card Header: Room name + Status Badge */}
        <View style={styles.rowHeader}>
          <View style={styles.rowTitleWrap}>
            <View
              style={[
                styles.sessionStatusDot,
                { backgroundColor: active ? brand.liveEmerald : t.mutedForeground },
              ]}
            />
            <ExiaText style={styles.rowTitle} numberOfLines={1}>
              {item.room_name}
            </ExiaText>
          </View>
          <View style={styles.rowHeaderRight}>
            <Badge label={active ? 'LIVE' : 'ENDED'} tone={active ? 'ok' : 'muted'} />
            <Ionicons name="chevron-forward" size={14} color={t.mutedForeground} />
          </View>
        </View>

        {/* Timestamp */}
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={13} color={t.mutedForeground} />
          <ExiaText variant="caption" style={styles.startedTimeText}>
            {formatRelativeTime(item.started_at)}
          </ExiaText>
        </View>

        {/* Preview text container if available */}
        {item.preview_text ? (
          <View style={[styles.previewContainer, { backgroundColor: t.input, borderColor: t.border }]}>
            <Ionicons
              name="chatbubble-outline"
              size={12}
              color={t.mutedForeground}
              style={styles.previewIcon}
            />
            <ExiaText variant="caption" numberOfLines={2} style={styles.previewText}>
              {item.preview_text}
            </ExiaText>
          </View>
        ) : null}

        {/* Metadata pill row: duration, model badge, token counter, turns */}
        <View style={styles.metaRow}>
          {/* Duration Pill */}
          {item.duration_seconds !== undefined ? (
            <View style={[styles.metaPill, { backgroundColor: t.input, borderColor: t.border }]}>
              <Ionicons name="time-outline" size={11} color={t.mutedForeground} />
              <ExiaText variant="mono" style={styles.metaPillText}>
                {formatDuration(item.duration_seconds)}
              </ExiaText>
            </View>
          ) : null}

          {/* Model Badge */}
          {item.model_used ? (
            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor: isGemini ? 'rgba(31, 213, 249, 0.1)' : t.input,
                  borderColor: isGemini ? 'rgba(31, 213, 249, 0.25)' : t.border,
                },
              ]}
            >
              <Ionicons
                name={isGemini ? 'sparkles' : 'cube-outline'}
                size={11}
                color={isGemini ? t.primary : t.mutedForeground}
              />
              <ExiaText
                style={[
                  styles.metaPillText,
                  {
                    color: isGemini ? t.primary : t.foreground,
                    fontWeight: isGemini ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {item.model_used}
              </ExiaText>
            </View>
          ) : null}

          {/* Token counter */}
          {item.total_tokens !== undefined ? (
            <View style={[styles.metaPill, { backgroundColor: t.input, borderColor: t.border }]}>
              <Ionicons name="layers-outline" size={11} color={t.mutedForeground} />
              <ExiaText variant="mono" style={styles.metaPillText}>
                {`${formatCount(item.total_tokens)} tokens`}
              </ExiaText>
            </View>
          ) : null}

          {/* Turns counter */}
          {item.turns_count !== undefined ? (
            <View style={[styles.metaPill, { backgroundColor: t.input, borderColor: t.border }]}>
              <Ionicons name="chatbubbles-outline" size={11} color={t.mutedForeground} />
              <ExiaText variant="mono" style={styles.metaPillText}>
                {`${item.turns_count} turns`}
              </ExiaText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  controls: { gap: spacing.sm, marginBottom: spacing.xs },
  searchBox: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { opacity: 0.9 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: spacing.md,
  },
  filterChipText: {
    fontSize: 12,
  },
  rowCard: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: spacing.xs + 3,
    padding: spacing.md + 2,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  rowTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  sessionStatusDot: {
    borderRadius: radius.full,
    height: 7,
    width: 7,
  },
  rowTitle: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  rowHeaderRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startedTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewContainer: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginVertical: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  previewIcon: {
    marginTop: 2,
  },
  previewText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: 2,
  },
  metaPill: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  metaPillText: {
    fontSize: 11,
    opacity: 0.85,
  },
  refreshError: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
