import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { spacing } from '@exia/design-tokens';
import { formatRelativeTime } from '@exia/shared-logic';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { PromptItem } from '@exia/shared-types';

import { api } from '@/lib/api';
import { Badge, DeleteButton, EmptyState, ErrorState, Loading, ScreenHeader } from '@/components/ui';

/**
 * Prompts tab — system prompts and quick commands for the voice agent.
 */
export default function Prompts() {
  const t = useTheme();
  const queryClient = useQueryClient();

  const prompts = useQuery({
    queryKey: ['prompts'],
    queryFn: () => api.prompts.list(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.prompts.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompts'] }),
  });

  const data = prompts.data;

  if (prompts.isLoading) {
    return (
      <ExiaScreen>
        <ScreenHeader title="Prompts" subtitle="System prompts & quick commands" />
        <Loading label="Loading prompts…" />
      </ExiaScreen>
    );
  }

  if (prompts.isError && !data) {
    return (
      <ExiaScreen>
        <ScreenHeader title="Prompts" subtitle="System prompts & quick commands" />
        <ErrorState
          message={prompts.error instanceof Error ? prompts.error.message : 'Failed to load prompts'}
          onRetry={() => prompts.refetch()}
        />
      </ExiaScreen>
    );
  }

  return (
    <ExiaScreen>
      <ScreenHeader title="Prompts" subtitle="System prompts & quick commands" />

      <ExiaButton label="New prompt" onPress={() => router.push('/prompt-editor')} />

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PromptCard
            prompt={item}
            onEdit={() => router.push(`/prompt-editor?id=${encodeURIComponent(item.id)}`)}
            onDelete={() => remove.mutate(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={prompts.isRefetching}
            onRefresh={() => {
              void prompts.refetch();
            }}
            tintColor={t.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No prompts yet"
            message="Create a system prompt to shape the agent's persona, or a quick command you reuse."
            actionLabel="New prompt"
            onAction={() => router.push('/prompt-editor')}
          />
        }
      />
    </ExiaScreen>
  );
}

function PromptCard({
  prompt,
  onEdit,
  onDelete,
}: {
  prompt: PromptItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTheme();

  return (
    <ExiaCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <ExiaText style={styles.cardTitle}>{prompt.title}</ExiaText>
          <View style={styles.badgeRow}>
            <Badge label={prompt.type === 'system' ? 'SYSTEM' : 'QUICK'} tone={prompt.type === 'system' ? 'info' : 'muted'} />
            {prompt.tags?.map((tag) => (
              <Badge key={tag} label={tag} tone="muted" />
            ))}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${prompt.title}`}
          hitSlop={8}
          onPress={onEdit}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={18} color={t.mutedForeground} />
        </Pressable>
      </View>

      <ExiaText variant="caption" numberOfLines={3}>
        {prompt.prompt_text}
      </ExiaText>

      <View style={styles.cardFooter}>
        <ExiaText variant="caption">Updated {formatRelativeTime(prompt.updated_at ?? prompt.created_at)}</ExiaText>
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
  badgeRow: { flexWrap: 'wrap', flexDirection: 'row', gap: spacing.xs },
  editButton: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
