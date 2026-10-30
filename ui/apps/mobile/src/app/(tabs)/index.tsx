import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing, typography } from '@exia/design-tokens';
import { formatCount, formatDuration, formatRelativeTime } from '@exia/shared-logic';
import { ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { SessionSummary } from '@exia/shared-types';

import { api } from '@/lib/api';
import { Badge, ExiaAvatar } from '@/components/ui';

const HEALTH_REFETCH_MS = 15_000;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Home tab — dashboard: backend health, workspace stats, quick actions,
 * and recent session activity.
 */
export default function Home() {
  const t = useTheme();

  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.health.check(),
    refetchInterval: HEALTH_REFETCH_MS,
    retry: 1,
  });
  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.sessions.getSessions(1, 50),
  });
  const mcp = useQuery({
    queryKey: ['mcp'],
    queryFn: () => api.mcp.list(),
  });
  const prompts = useQuery({
    queryKey: ['prompts'],
    queryFn: () => api.prompts.list(),
  });

  const online = health.data?.status === 'ok';
  const refreshing = health.isFetching || sessions.isFetching || mcp.isFetching || prompts.isFetching;
  const refresh = () => {
    void health.refetch();
    void sessions.refetch();
    void mcp.refetch();
    void prompts.refetch();
  };

  const recent = sessions.data?.sessions.slice(0, 3) ?? [];
  const mcpActive = mcp.data?.filter((s) => s.enabled).length;

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ExiaScreen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.primary} />
        }
      >
        {/* Header: identity + greeting + live status pill */}
        <View style={styles.header}>
          <ExiaAvatar size={44} />
          <View style={styles.headerText}>
            <ExiaText variant="title">{greeting}</ExiaText>
            <ExiaText variant="caption">{dateLabel}</ExiaText>
          </View>
          <View
            accessibilityLabel={online ? 'Backend online' : 'Backend offline'}
            style={[
              styles.statusPill,
              { backgroundColor: online ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)' },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: online ? brand.liveEmerald : t.destructive }]}
            />
            <ExiaText style={[styles.statusPillText, { color: online ? brand.liveEmerald : t.destructive }]}>
              {health.isLoading ? '…' : online ? 'Online' : 'Offline'}
            </ExiaText>
          </View>
        </View>

        {/* Backend hero card */}
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.cardRow}>
            <ExiaText style={styles.cardTitle}>Backend</ExiaText>
            {health.data ? <Badge label={`${health.data.latencyMs} ms`} tone="info" /> : null}
          </View>
          <ExiaText variant="mono" selectable>
            {health.data?.target ?? 'Checking /api/health…'}
          </ExiaText>
          <ExiaText variant="caption">
            {health.data
              ? `Responding · checked ${formatRelativeTime(new Date(health.dataUpdatedAt).toISOString())}`
              : health.error instanceof Error
                ? health.error.message
                : 'Waiting for the first health check…'}
          </ExiaText>
        </View>

        {/* Stats row */}
        <View style={styles.gridRow}>
          <StatTile
            label="Sessions"
            value={sessions.data ? formatCount(sessions.data.total) : '—'}
          />
          <StatTile
            label="MCP servers"
            value={mcp.data ? String(mcp.data.length) : '—'}
            sub={mcpActive !== undefined ? `${mcpActive} active` : undefined}
          />
          <StatTile
            label="Prompts"
            value={prompts.data ? String(prompts.data.length) : '—'}
          />
        </View>

        {/* Quick actions */}
        <View style={styles.gridRow}>
          <ActionTile
            icon="mic-outline"
            label="Voice session"
            onPress={() => router.push('/voice')}
          />
          <ActionTile
            icon="time-outline"
            label="History"
            onPress={() => router.push('/history')}
          />
        </View>
        <View style={styles.gridRow}>
          <ActionTile
            icon="hardware-chip-outline"
            label="MCP servers"
            onPress={() => router.push('/mcp')}
          />
          <ActionTile
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push('/settings')}
          />
        </View>

        {/* Recent sessions */}
        <View style={styles.sectionHeader}>
          <ExiaText style={styles.sectionTitle}>Recent sessions</ExiaText>
          <Link href="/history" asChild>
            <Pressable hitSlop={8} accessibilityRole="link" accessibilityLabel="See all sessions">
              <ExiaText variant="caption" style={styles.seeAll}>
                See all
              </ExiaText>
            </Pressable>
          </Link>
        </View>

        {recent.map((session) => (
          <RecentRow key={session.id} session={session} />
        ))}
        {!sessions.isLoading && recent.length === 0 ? (
          <ExiaText variant="caption">
            No sessions yet — they will appear here after your first voice conversation.
          </ExiaText>
        ) : null}
      </ScrollView>
    </ExiaScreen>
  );
}

// ---------------------------------------------------------------------------
// Local building blocks (screen-private)
// ---------------------------------------------------------------------------

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.card, styles.statTile, { backgroundColor: t.card, borderColor: t.border }]}>
      <ExiaText variant="mono" style={[styles.statValue, { color: t.foreground }]}>
        {value}
      </ExiaText>
      <ExiaText variant="caption">{label}</ExiaText>
      {sub ? <ExiaText variant="caption" style={styles.statSub}>{sub}</ExiaText> : null}
    </View>
  );
}

function ActionTile({
  icon,
  label,
  badge,
  disabled,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  badge?: string;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        styles.actionTile,
        { backgroundColor: t.card, borderColor: t.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.actionTileHeader}>
        <View style={[styles.actionIconBox, { backgroundColor: t.input }]}>
          <Ionicons name={icon} size={18} color={t.primary} />
        </View>
        {badge ? <Badge label={badge} tone="muted" /> : null}
      </View>
      <ExiaText style={styles.actionLabel}>{label}</ExiaText>
    </Pressable>
  );
}

function RecentRow({ session }: { session: SessionSummary }) {
  const t = useTheme();
  const active = session.status === 'active';

  return (
    <Link href={`/session/${session.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open session ${session.room_name}`}
        style={({ pressed }) => [
          styles.card,
          styles.recentRow,
          { backgroundColor: t.card, borderColor: t.border, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.recentMain}>
          <ExiaText style={styles.recentTitle} numberOfLines={1}>
            {session.room_name}
          </ExiaText>
          <ExiaText variant="caption">
            {formatRelativeTime(session.started_at)}
            {session.duration_seconds !== undefined
              ? ` · ${formatDuration(session.duration_seconds)}`
              : ''}
          </ExiaText>
        </View>
        <View style={styles.recentSide}>
          <Badge label={active ? 'LIVE' : 'ENDED'} tone={active ? 'ok' : 'muted'} />
          <Ionicons name="chevron-forward" size={16} color={t.mutedForeground} />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  statusPill: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderCurve: 'continuous',
    flexDirection: 'row',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  statusDot: { borderRadius: radius.full, height: 8, width: 8 },
  statusPillText: { fontSize: typography.fontSizes.xs, fontWeight: '600' },
  card: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  cardRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  cardTitle: { flex: 1, fontWeight: '600' },
  gridRow: { flexDirection: 'row', gap: spacing.md },
  statTile: { alignItems: 'flex-start', flex: 1 },
  statValue: { fontSize: typography.fontSizes.xl, fontVariant: ['tabular-nums'], fontWeight: '600' },
  statSub: { color: brand.liveEmerald },
  actionTile: { flex: 1, gap: spacing.sm },
  actionTileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionIconBox: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderCurve: 'continuous',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionLabel: { fontWeight: '500' },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: typography.fontSizes.lg, fontWeight: '600' },
  seeAll: { color: '#1fd5f9' },
  recentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  recentMain: { flex: 1, gap: 2 },
  recentTitle: { fontWeight: '500' },
  recentSide: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
});
