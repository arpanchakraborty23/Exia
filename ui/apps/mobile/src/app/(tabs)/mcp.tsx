import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { MCPServer } from '@exia/shared-types';

import { api } from '@/lib/api';
import { Badge, DeleteButton, EmptyState, ErrorState, Loading, ScreenHeader } from '@/components/ui';

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
        <Loading label="Loading servers…" />
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

      <ExiaButton label="Add server" onPress={() => router.push('/mcp-editor')} />

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

  return (
    <ExiaCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <ExiaText style={styles.cardTitle}>{server.name}</ExiaText>
          <View style={styles.badgeRow}>
            <Badge label={server.server_type.toUpperCase()} tone="info" />
            <Badge label={connected ? 'CONNECTED' : 'OFFLINE'} tone={connected ? 'ok' : 'muted'} />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${server.name}`}
          hitSlop={8}
          onPress={onEdit}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={18} color={t.mutedForeground} />
        </Pressable>
      </View>

      {server.command_or_url ? (
        <ExiaText variant="mono" numberOfLines={1}>
          {server.command_or_url}
        </ExiaText>
      ) : null}
      {server.tools && server.tools.length > 0 ? (
        <ExiaText variant="caption">
          {server.tools.length} tool{server.tools.length === 1 ? '' : 's'}:{' '}
          {server.tools.slice(0, 3).join(', ')}
          {server.tools.length > 3 ? '…' : ''}
        </ExiaText>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.enabledRow}>
          <Switch
            accessibilityLabel={`Enable ${server.name}`}
            value={server.enabled}
            onValueChange={onToggle}
            trackColor={{ false: t.muted, true: t.primary }}
          />
          <ExiaText variant="caption">{server.enabled ? 'Enabled' : 'Disabled'}</ExiaText>
        </View>
        <DeleteButton onPress={onDelete} label="Delete" />
      </View>
    </ExiaCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xxl, marginTop: spacing.md },
  card: { gap: spacing.sm },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row' },
  cardTitleBlock: { flex: 1, gap: spacing.xs },
  cardTitle: { fontWeight: '600' },
  badgeRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  editButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  enabledRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
});
