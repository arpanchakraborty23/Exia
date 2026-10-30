import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { spacing } from '@exia/design-tokens';
import { ExiaButton, ExiaScreen, ExiaText, useTheme } from '@exia/shared-ui';
import type { MCPServer } from '@exia/shared-types';

import { api } from '@/lib/api';
import { ExiaInput, Field, ScreenHeader, Segmented } from '@/components/ui';

interface ServerForm {
  name: string;
  serverType: 'sse' | 'stdio';
  commandOrUrl: string;
  authToken: string;
  enabled: boolean;
}

/**
 * Add/edit an MCP server. Pass ?id=<server id> to edit an existing entry
 * (prefilled from the ['mcp'] query cache). Form values derive from the
 * cached server plus a local edit draft — no state-syncing effects.
 * Route: /mcp-editor (modal)
 */
export default function McpEditor() {
  const t = useTheme();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const existing = useQuery({
    queryKey: ['mcp'],
    queryFn: () => api.mcp.list(),
    enabled: Boolean(id),
    select: (servers: MCPServer[]) => servers.find((s) => s.id === id),
  });

  const [draft, setDraft] = useState<Partial<ServerForm>>({});
  const set = (patch: Partial<ServerForm>) => setDraft((d) => ({ ...d, ...patch }));

  const s = existing.data;
  const form: ServerForm = {
    name: draft.name ?? s?.name ?? '',
    serverType: draft.serverType ?? s?.server_type ?? 'sse',
    commandOrUrl: draft.commandOrUrl ?? s?.command_or_url ?? '',
    authToken: draft.authToken ?? s?.auth_token ?? '',
    enabled: draft.enabled ?? s?.enabled ?? true,
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        server_type: form.serverType,
        command_or_url: form.commandOrUrl,
        auth_token: form.authToken || undefined,
        enabled: form.enabled,
      };
      if (id && s) {
        return api.mcp.update(id, payload);
      }
      return api.mcp.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp'] });
      router.back();
    },
    onError: (err) => setSaveError(err instanceof Error ? err.message : 'Failed to save server'),
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const canSave = form.name.trim().length > 0 && form.commandOrUrl.trim().length > 0 && !save.isPending;

  return (
    <ExiaScreen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={id ? 'Edit server' : 'Add server'}
          subtitle="MCP tool provider"
          onBack={() => router.back()}
        />

        <Field label="Name">
          <ExiaInput
            autoCapitalize="none"
            placeholder="e.g. home-assistant"
            value={form.name}
            onChangeText={(name) => set({ name })}
          />
        </Field>

        <Field label="Transport">
          <Segmented
            accessibilityLabel="Transport type"
            options={['sse', 'stdio'] as const}
            value={form.serverType}
            onChange={(serverType) => set({ serverType })}
          />
        </Field>

        <Field label={form.serverType === 'sse' ? 'Server URL' : 'Command'}>
          <ExiaInput
            autoCapitalize="none"
            multiline={form.serverType === 'stdio'}
            placeholder={
              form.serverType === 'sse' ? 'https://mcp.example.com/sse' : 'npx -y @modelcontextprotocol/server…'
            }
            value={form.commandOrUrl}
            onChangeText={(commandOrUrl) => set({ commandOrUrl })}
          />
        </Field>

        <Field label="Auth token (optional)">
          <ExiaInput
            autoCapitalize="none"
            secureTextEntry
            value={form.authToken}
            onChangeText={(authToken) => set({ authToken })}
          />
        </Field>

        <Field label="Enabled">
          <View style={styles.switchRow}>
            <Switch
              accessibilityLabel="Server enabled"
              value={form.enabled}
              onValueChange={(enabled) => set({ enabled })}
              trackColor={{ false: t.muted, true: t.primary }}
            />
            <ExiaText variant="caption">
              {form.enabled ? 'Active — agent can use its tools' : 'Disabled'}
            </ExiaText>
          </View>
        </Field>

        {saveError ? (
          <ExiaText accessibilityRole="alert" style={[styles.error, { color: t.destructive }]}>
            {saveError}
          </ExiaText>
        ) : null}

        <ExiaButton
          disabled={!canSave}
          label={save.isPending ? 'Saving…' : id ? 'Save changes' : 'Add server'}
          onPress={() => save.mutate()}
        />
      </ScrollView>
    </ExiaScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  switchRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  error: { marginBottom: spacing.md },
});
