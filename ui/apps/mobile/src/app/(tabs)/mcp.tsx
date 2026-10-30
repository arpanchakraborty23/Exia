import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '@exia/design-tokens';
import { ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { MCPServer } from '@exia/shared-types';

import { api } from '@/lib/api';
import {
  Badge,
  type BadgeTone,
  DeleteButton,
  EmptyState,
  ErrorState,
  ScreenHeader,
  Skeleton,
  SkeletonCard,
} from '@/components/ui';

/**
 * MCP tab — manage Model Context Protocol servers: toggle, edit, delete, add.
 */
export default function Mcp() {
  const t = useTheme();
  const queryClient = useQueryClient();

  const servers = useQuery({
    queryKey: ['mcp'],
    queryFn: () => api.mcp.list(),
  });

  // Optimistic enable/disable with rollback on failure (legacy web behavior).
  const toggle = useMutation({
    mutationFn: ({ server, enabled }: { server: MCPServer; enabled: boolean }) =>
      api.mcp.update(server.id, { enabled }),
    onMutate: async ({ server, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['mcp'] });
      const previous = queryClient.getQueryData<MCPServer[]>(['mcp']);
      queryClient.setQueryData<MCPServer[]>(['mcp'], (old) =>
        old?.map((s) => (s.id === server.id ? { ...s, enabled } : s)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['mcp'], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['mcp'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.mcp.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mcp'] }),
  });

  const data = servers.data;

  if (servers.isLoading) {
    return (
      <ExiaScreen>
        <ScreenHeader title="MCP servers" subtitle="Tool providers for the voice agent" />
        <View style={[styles.topBar, { backgroundColor: t.card, borderColor: t.border }]}>
          <View style={styles.topBarText}>
            <Skeleton width={120} height={18} />
            <Skeleton width={180} height={12} style={{ marginTop: 4 }} />
          </View>
          <Skeleton width={110} height={38} borderRadius={radius.md} />
        </View>
        <View style={styles.list}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </View>
      </ExiaScreen>
    );
  }

  if (servers.isError && !data) {
    return (
      <ExiaScreen>
        <ScreenHeader title="MCP servers" subtitle="Tool providers for the voice agent" />
        <ErrorState
          message={servers.error instanceof Error ? servers.error.message : 'Failed to load MCP servers'}
          onRetry={() => servers.refetch()}
        />
      </ExiaScreen>
    );
  }

  return (
    <ExiaScreen>
      <ScreenHeader title="MCP servers" subtitle="Tool providers for the voice agent" />

      {/* Prominent top bar */}
      <View style={[styles.topBar, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={styles.topBarText}>
          <View style={styles.topBarTitleRow}>
            <Ionicons name="server-outline" size={18} color={t.primary} />
            <ExiaText style={styles.topBarTitle}>MCP Registry</ExiaText>
          </View>
          <ExiaText variant="caption">
            {data && data.length > 0
              ? `${data.filter((s) => s.enabled).length} of ${data.length} servers active`
              : 'Extend voice agent capabilities'}
          </ExiaText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add MCP server"
          onPress={() => router.push('/mcp-editor')}
          style={({ pressed }) => [
            styles.addServerButton,
            { backgroundColor: t.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="add" size={18} color={t.primaryForeground} />
          <ExiaText style={[styles.addServerButtonText, { color: t.primaryForeground }]}>
            Add Server
          </ExiaText>
        </Pressable>
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ServerCard
            server={item}
            onToggle={(enabled) => toggle.mutate({ server: item, enabled })}
            onEdit={() =>
              router.push(`/mcp-editor?id=${encodeURIComponent(item.id)}`)
            }
            onDelete={() => remove.mutate(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={servers.isRefetching}
            onRefresh={() => {
              void servers.refetch();
            }}
            tintColor={t.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No MCP servers"
            message="Add an SSE or stdio server to give the agent tools like home control or search."
            actionLabel="Add server"
            onAction={() => router.push('/mcp-editor')}
          />
        }
      />
    </ExiaScreen>
  );
}

function ServerCard({
  server,
  onToggle,
  onEdit,
  onDelete,
}: {
  server: MCPServer;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  const connected = server.status === 'connected';

  // Semantic status tone & label
  const statusTone: BadgeTone = !server.enabled
    ? 'muted'
    : connected
      ? 'ok'
      : server.status === 'error'
        ? 'warn'
        : 'muted';

  const statusLabel = !server.enabled
    ? 'DISABLED'
    : connected
      ? 'CONNECTED'
      : server.status === 'error'
        ? 'ERROR'
        : 'OFFLINE';

  // Transport type badge: stdio, sse, websocket
  const transportType = (server.server_type || 'stdio').toUpperCase();
  const transportTone: BadgeTone =
    server.server_type === 'sse' ? 'info' : 'muted';

  return (
    <ExiaCard style={[styles.card, !server.enabled && styles.cardDisabled]}>
      {/* Header with name, status & transport badges, and edit button */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <View style={styles.serverNameRow}>
            <Ionicons
              name={server.server_type === 'sse' ? 'globe-outline' : 'terminal-outline'}
              size={18}
              color={server.enabled ? t.primary : t.mutedForeground}
            />
            <ExiaText style={styles.cardTitle} numberOfLines={1}>
              {server.name}
            </ExiaText>
          </View>
          <View style={styles.badgeRow}>
            <Badge label={transportType} tone={transportTone} />
            <Badge label={statusLabel} tone={statusTone} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${server.name}`}
          hitSlop={8}
          onPress={onEdit}
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: t.input, borderColor: t.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="pencil" size={15} color={t.foreground} />
        </Pressable>
      </View>

      {/* Subtle command box styling */}
      {server.command_or_url ? (
        <View style={[styles.commandBox, { backgroundColor: t.input, borderColor: t.border }]}>
          <Ionicons
            name={server.server_type === 'sse' ? 'link-outline' : 'code-outline'}
            size={14}
            color={t.mutedForeground}
          />
          <ExiaText variant="mono" numberOfLines={1} style={styles.commandText}>
            {server.command_or_url}
          </ExiaText>
        </View>
      ) : null}

      {/* Tools count pill & preview tags */}
      {server.tools && server.tools.length > 0 ? (
        <View style={styles.toolsSection}>
          <View
            style={[
              styles.toolsPill,
              {
                backgroundColor: server.enabled ? 'rgba(31, 213, 249, 0.12)' : t.input,
                borderColor: server.enabled ? 'rgba(31, 213, 249, 0.25)' : t.border,
              },
            ]}
          >
            <Ionicons
              name="build-outline"
              size={12}
              color={server.enabled ? t.primary : t.mutedForeground}
            />
            <ExiaText
              style={[
                styles.toolsCountText,
                { color: server.enabled ? t.primary : t.mutedForeground },
              ]}
            >
              {server.tools.length} {server.tools.length === 1 ? 'tool' : 'tools'}
            </ExiaText>
          </View>
          <View style={styles.toolChipsRow}>
            {server.tools.slice(0, 3).map((tool) => (
              <View
                key={tool}
                style={[styles.toolChip, { backgroundColor: t.input, borderColor: t.border }]}
              >
                <ExiaText variant="mono" style={styles.toolChipText} numberOfLines={1}>
                  {tool}
                </ExiaText>
              </View>
            ))}
            {server.tools.length > 3 ? (
              <ExiaText variant="caption" style={{ color: t.mutedForeground, alignSelf: 'center' }}>
                +{server.tools.length - 3} more
              </ExiaText>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Refined Switch row and delete button layout */}
      <View style={[styles.cardFooter, { borderTopColor: t.border }]}>
        <View style={styles.enabledRow}>
          <Switch
            accessibilityLabel={`Enable ${server.name}`}
            value={server.enabled}
            onValueChange={onToggle}
            trackColor={{ false: t.muted, true: t.primary }}
            thumbColor="#ffffff"
          />
          <ExiaText
            variant="caption"
            style={[
              styles.enabledLabel,
              { color: server.enabled ? t.foreground : t.mutedForeground },
            ]}
          >
            {server.enabled ? 'Enabled' : 'Disabled'}
          </ExiaText>
        </View>
        <DeleteButton onPress={onDelete} label="Delete" />
      </View>
    </ExiaCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xxl, marginTop: spacing.md },
  topBar: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  topBarText: { flex: 1, gap: 2 },
  topBarTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  topBarTitle: { fontSize: 16, fontWeight: '600' },
  addServerButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 4,
    minHeight: 38,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addServerButtonText: { fontSize: 13, fontWeight: '600' },
  card: { gap: spacing.md },
  cardDisabled: { opacity: 0.75 },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  cardTitleBlock: { flex: 1, gap: spacing.xs },
  serverNameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  badgeRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  editButton: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  commandBox: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commandText: { flex: 1, fontSize: 12 },
  toolsSection: { gap: spacing.xs },
  toolsPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
  },
  toolsCountText: { fontSize: 11, fontWeight: '600' },
  toolChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  toolChip: {
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  toolChipText: { fontSize: 11 },
  cardFooter: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  enabledRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  enabledLabel: { fontSize: 13, fontWeight: '500' },
});

