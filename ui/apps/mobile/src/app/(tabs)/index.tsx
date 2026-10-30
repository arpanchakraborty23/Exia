import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { brand, spacing } from '@exia/design-tokens';
import { formatCount, formatRelativeTime } from '@exia/shared-logic';
import { ExiaButton, ExiaCard, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';

import { api } from '@/lib/api';
import { Badge, Loading } from '@/components/ui';

/**
 * Home tab — backend health at a glance plus quick navigation.
 */
export default function Home() {
  const t = useTheme();

  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.health.check(),
    refetchInterval: 15_000,
    retry: 1,
  });

  const sessions = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.sessions.getSessions(1, 50),
  });

  const online = health.data?.status === 'ok';
  const totalSessions = sessions.data?.total;

  return (
    <ExiaScreen>
      <View style={styles.header}>
        <ExiaText variant="title">Exia</ExiaText>
        <ExiaText variant="caption">Your private home AI assistant</ExiaText>
      </View>

      {health.isLoading ? (
        <Loading label="Checking backend…" />
      ) : (
        <ExiaCard style={styles.healthCard}>
          <View style={styles.healthRow}>
            <View
              accessibilityRole="image"
              accessibilityLabel={online ? 'Backend online' : 'Backend offline'}
              style={[styles.statusDot, { backgroundColor: online ? brand.liveEmerald : t.destructive }]}
            />
            <ExiaText style={styles.healthTitle}>{online ? 'Backend online' : 'Backend offline'}</ExiaText>
            <Badge
              label={online ? 'LIVE' : 'DOWN'}
              tone={online ? 'ok' : 'warn'}
            />
          </View>
          <ExiaText variant="mono">
            {health.data?.target ?? 'http://127.0.0.1:12568/api/health'}
          </ExiaText>
          <ExiaText variant="caption">
            {health.data
              ? `Latency ${health.data.latencyMs} ms · checked ${formatRelativeTime(
                  new Date(health.dataUpdatedAt).toISOString(),
                )}`
              : health.error instanceof Error
                ? health.error.message
                : 'Waiting for backend…'}
          </ExiaText>
        </ExiaCard>
      )}

      {totalSessions !== undefined ? (
        <ExiaCard style={styles.statsCard}>
          <ExiaText variant="caption">Sessions recorded</ExiaText>
          <ExiaText variant="title">{formatCount(totalSessions)}</ExiaText>
        </ExiaCard>
      ) : null}

      <Link href="/history" asChild>
        <ExiaButton label="Session history" variant="secondary" />
      </Link>
      <Link href="/mcp" asChild>
        <ExiaButton label="MCP servers" variant="secondary" />
      </Link>

      <ExiaButton label="Start voice session" disabled onPress={() => {}} />
      <ExiaText variant="caption" style={styles.voiceNote}>
        Voice sessions need the LiveKit native module — planned next milestone.
      </ExiaText>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, marginBottom: 24 },
  healthCard: { gap: spacing.sm, marginBottom: spacing.md },
  healthRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  statusDot: { borderRadius: 6, height: 12, width: 12 },
  healthTitle: { flex: 1, fontWeight: '600' },
  statsCard: { gap: 2, marginBottom: spacing.md },
  voiceNote: { marginTop: spacing.sm, textAlign: 'center' },
});
