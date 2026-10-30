import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing, typography } from '@exia/design-tokens';
import { formatCount, formatDuration, formatRelativeTime } from '@exia/shared-logic';
import { ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { SessionSummary } from '@exia/shared-types';

import { api } from '@/lib/api';
import { Badge, EmptyState, ExiaAvatar, Skeleton, SkeletonCard } from '@/components/ui';

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
            <ExiaText variant="title" style={styles.greetingTitle}>
              {greeting}
            </ExiaText>
            <ExiaText variant="caption">{dateLabel}</ExiaText>
          </View>
          <View
            accessibilityLabel={health.isLoading ? 'Checking backend status' : online ? 'Backend online' : 'Backend offline'}
            style={[
              styles.statusPill,
              {
                backgroundColor: health.isLoading
                  ? 'rgba(255, 255, 255, 0.04)'
                  : online
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                borderColor: health.isLoading
                  ? t.border
                  : online
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: health.isLoading
                    ? t.mutedForeground
                    : online
                      ? brand.liveEmerald
                      : t.destructive,
                },
              ]}
            />
            <ExiaText
              style={[
                styles.statusPillText,
                {
                  color: health.isLoading
                    ? t.mutedForeground
                    : online
                      ? brand.liveEmerald
                      : t.destructive,
                },
              ]}
            >
              {health.isLoading ? 'Checking' : online ? 'Online' : 'Offline'}
            </ExiaText>
          </View>
        </View>

        {/* Backend hero card */}
        {health.isLoading && !health.data ? (
          <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={styles.cardRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="server-outline" size={16} color={t.mutedForeground} />
                <ExiaText style={styles.cardTitle}>Backend Gateway</ExiaText>
              </View>
              <Skeleton width={52} height={20} borderRadius={radius.full} />
            </View>
            <Skeleton width="70%" height={14} borderRadius={radius.sm} style={{ marginTop: spacing.xs }} />
            <Skeleton width="45%" height={12} borderRadius={radius.sm} />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={styles.cardRow}>
              <View style={styles.cardHeaderLeft}>
                <View
                  style={[
                    styles.serviceIconBox,
                    {
                      backgroundColor: online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    },
                  ]}
                >
                  <Ionicons
                    name={online ? 'server' : 'server-outline'}
                    size={14}
                    color={online ? brand.liveEmerald : t.destructive}
                  />
                </View>
                <View style={styles.cardHeaderTitleGroup}>
                  <ExiaText style={styles.cardTitle}>Backend Gateway</ExiaText>
                  <ExiaText variant="caption" style={styles.cardHeaderStatus}>
                    {online ? 'Operational' : 'Service unreachable'}
                  </ExiaText>
                </View>
              </View>
              {health.data ? (
                <Badge
                  label={`${health.data.latencyMs} ms`}
                  tone={health.data.latencyMs < 350 ? 'info' : 'warn'}
                />
              ) : null}
            </View>

            <View style={[styles.targetEndpointBox, { backgroundColor: t.input, borderColor: t.border }]}>
              <Ionicons name="link-outline" size={14} color={t.mutedForeground} />
              <ExiaText variant="mono" selectable numberOfLines={1} style={styles.targetEndpointText}>
                {health.data?.target ?? 'Checking gateway…'}
              </ExiaText>
            </View>

            <View style={styles.backendFooter}>
              <Ionicons
                name={online ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={14}
                color={online ? brand.liveEmerald : t.destructive}
              />
              <ExiaText variant="caption" style={styles.backendFooterText} numberOfLines={1}>
                {health.data
                  ? `Responding · checked ${formatRelativeTime(new Date(health.dataUpdatedAt).toISOString())}`
                  : health.error instanceof Error
                    ? health.error.message
                    : 'Waiting for connection telemetry…'}
              </ExiaText>
            </View>
          </View>
        )}

        {/* Stats row */}
        <View style={styles.gridRow}>
          <StatTile
            label="Sessions"
            value={sessions.data ? formatCount(sessions.data.total) : '0'}
            loading={sessions.isLoading}
            icon="mic-outline"
          />
          <StatTile
            label="MCP servers"
            value={mcp.data ? String(mcp.data.length) : '0'}
            sub={mcpActive !== undefined ? `${mcpActive} active` : undefined}
            loading={mcp.isLoading}
            icon="hardware-chip-outline"
          />
          <StatTile
            label="Prompts"
            value={prompts.data ? String(prompts.data.length) : '0'}
            loading={prompts.isLoading}
            icon="document-text-outline"
          />
        </View>

        {/* Quick actions */}
        <View style={styles.gridRow}>
          <ActionTile
            icon="mic"
            label="Voice session"
            description="Real-time AI voice call"
            onPress={() => router.push('/voice')}
          />
          <ActionTile
            icon="time-outline"
            label="History"
            description="Transcripts & logs"
            onPress={() => router.push('/history')}
          />
        </View>
        <View style={styles.gridRow}>
          <ActionTile
            icon="hardware-chip-outline"
            label="MCP servers"
            description="Tools & integrations"
            onPress={() => router.push('/mcp')}
          />
          <ActionTile
            icon="settings-outline"
            label="Settings"
            description="Preferences & models"
            onPress={() => router.push('/settings')}
          />
        </View>

        {/* Recent sessions */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <ExiaText style={styles.sectionTitle}>Recent sessions</ExiaText>
            <View style={[styles.sectionCountBadge, { backgroundColor: t.input }]}>
              <ExiaText style={[styles.sectionCountText, { color: t.mutedForeground }]}>
                {sessions.data ? sessions.data.total : '—'}
              </ExiaText>
            </View>
          </View>
          <Link href="/history" asChild>
            <Pressable hitSlop={8} accessibilityRole="link" accessibilityLabel="See all sessions">
              <ExiaText variant="caption" style={styles.seeAll}>
                See all
              </ExiaText>
            </Pressable>
          </Link>
        </View>

        {sessions.isLoading ? (
          <View style={styles.recentLoadingStack}>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </View>
        ) : recent.length > 0 ? (
          recent.map((session) => <RecentRow key={session.id} session={session} />)
        ) : (
          <EmptyState
            title="No sessions yet"
            message="Start your first voice conversation to record transcripts and telemetry."
            actionLabel="Start voice session"
            onAction={() => router.push('/voice')}
          />
        )}
      </ScrollView>
    </ExiaScreen>
  );
}

// ---------------------------------------------------------------------------
// Local building blocks (screen-private)
// ---------------------------------------------------------------------------

function StatTile({
  label,
  value,
  sub,
  loading,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
  icon?: IoniconName;
}) {
  const t = useTheme();
  return (
    <View style={[styles.card, styles.statTile, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={styles.statTileTop}>
        <ExiaText variant="caption" style={styles.statLabel} numberOfLines={1}>
          {label}
        </ExiaText>
        {icon ? <Ionicons name={icon} size={13} color={t.mutedForeground} /> : null}
      </View>
      {loading ? (
        <Skeleton width={42} height={24} borderRadius={radius.sm} style={{ marginVertical: 3 }} />
      ) : (
        <ExiaText variant="mono" style={[styles.statValue, { color: t.foreground }]}>
          {value}
        </ExiaText>
      )}
      {sub ? (
        <View style={styles.statSubRow}>
          <View style={styles.statSubDot} />
          <ExiaText variant="caption" style={styles.statSub}>
            {sub}
          </ExiaText>
        </View>
      ) : (
        <View style={styles.statSubSpacer} />
      )}
    </View>
  );
}

function ActionTile({
  icon,
  label,
  description,
  badge,
  disabled,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  description?: string;
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
        {
          backgroundColor: t.card,
          borderColor: pressed ? t.primary : t.border,
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
        },
      ]}
    >
      <View style={styles.actionTileHeader}>
        <View
          style={[
            styles.actionIconBox,
            {
              backgroundColor: 'rgba(31, 213, 249, 0.08)',
              borderColor: 'rgba(31, 213, 249, 0.2)',
            },
          ]}
        >
          <Ionicons name={icon} size={17} color={t.primary} />
        </View>
        {badge ? (
          <Badge label={badge} tone="muted" />
        ) : (
          <Ionicons name="chevron-forward" size={14} color={t.mutedForeground} />
        )}
      </View>
      <View style={styles.actionTextGroup}>
        <ExiaText style={styles.actionLabel}>{label}</ExiaText>
        {description ? (
          <ExiaText variant="caption" numberOfLines={1} style={styles.actionDescription}>
            {description}
          </ExiaText>
        ) : null}
      </View>
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
          {
            backgroundColor: t.card,
            borderColor: pressed ? t.primary : t.border,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.recentIconBox,
            {
              backgroundColor: active ? 'rgba(16, 185, 129, 0.12)' : t.input,
              borderColor: active ? 'rgba(16, 185, 129, 0.3)' : t.border,
            },
          ]}
        >
          <Ionicons
            name={active ? 'mic' : 'chatbubble-ellipses-outline'}
            size={16}
            color={active ? brand.liveEmerald : t.mutedForeground}
          />
        </View>
        <View style={styles.recentMain}>
          <View style={styles.recentTitleRow}>
            <ExiaText style={styles.recentTitle} numberOfLines={1}>
              {session.room_name}
            </ExiaText>
            <Badge label={active ? 'LIVE' : 'ENDED'} tone={active ? 'ok' : 'muted'} />
          </View>
          <View style={styles.recentMetaRow}>
            <ExiaText variant="caption" style={styles.recentTime}>
              {formatRelativeTime(session.started_at)}
            </ExiaText>
            {session.duration_seconds !== undefined ? (
              <View style={[styles.recentDurationPill, { backgroundColor: t.input }]}>
                <Ionicons name="time-outline" size={11} color={t.mutedForeground} />
                <ExiaText variant="mono" style={styles.recentDurationText}>
                  {formatDuration(session.duration_seconds)}
                </ExiaText>
              </View>
            ) : null}
            {session.model_used ? (
              <ExiaText variant="caption" style={styles.recentModelText} numberOfLines={1}>
                {`· ${session.model_used}`}
              </ExiaText>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={t.mutedForeground} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
  headerText: { flex: 1, gap: 2 },
  greetingTitle: { letterSpacing: -0.3 },
  statusPill: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  statusDot: { borderRadius: radius.full, height: 7, width: 7 },
  statusPillText: { fontSize: typography.fontSizes.xs, fontWeight: '600', letterSpacing: 0.2 },
  card: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: spacing.xs + 2,
    padding: spacing.lg,
  },
  cardRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardHeaderLeft: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  cardHeaderTitleGroup: { gap: 1 },
  cardHeaderStatus: { fontSize: 11, opacity: 0.8 },
  serviceIconBox: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  cardTitle: { fontWeight: '600', fontSize: typography.fontSizes.base },
  targetEndpointBox: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  targetEndpointText: { flex: 1, fontSize: typography.fontSizes.xs, opacity: 0.9 },
  backendFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  backendFooterText: { flex: 1 },
  gridRow: { flexDirection: 'row', gap: spacing.md },
  statTile: {
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md + 2,
  },
  statTileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statLabel: { opacity: 0.85, fontSize: 11, fontWeight: '500' },
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statSubRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  statSubDot: {
    backgroundColor: brand.liveEmerald,
    borderRadius: radius.full,
    height: 5,
    width: 5,
  },
  statSub: { color: brand.liveEmerald, fontSize: 11, fontWeight: '500' },
  statSubSpacer: { height: 16 },
  actionTile: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.md + 2,
  },
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
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionTextGroup: { gap: 2 },
  actionLabel: { fontWeight: '600', fontSize: typography.fontSizes.sm },
  actionDescription: { fontSize: 11, opacity: 0.75 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionHeaderLeft: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { fontSize: typography.fontSizes.lg, fontWeight: '600', letterSpacing: -0.2 },
  sectionCountBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  sectionCountText: { fontSize: 11, fontWeight: '600' },
  seeAll: { color: brand.electricCyan, fontWeight: '500' },
  recentLoadingStack: { gap: spacing.sm },
  recentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  recentIconBox: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  recentMain: { flex: 1, gap: 3 },
  recentTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  recentTitle: { flexShrink: 1, fontWeight: '600', fontSize: typography.fontSizes.sm },
  recentMetaRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  recentTime: { opacity: 0.8 },
  recentDurationPill: {
    alignItems: 'center',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  recentDurationText: { fontSize: 10, opacity: 0.9 },
  recentModelText: { opacity: 0.7, fontSize: 11 },
});
