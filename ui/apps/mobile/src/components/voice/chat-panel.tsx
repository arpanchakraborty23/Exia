import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '@exia/design-tokens';
import { ExiaText, useTheme } from '@exia/shared-ui';

/**
 * Voice session chat transcript + input.
 *
 * Presentational only — messages come from the LiveKit room's `lk.chat`
 * topic (the same channel the legacy web AgentChatTranscript used), mapped
 * to plain entries by the session screen.
 */
export interface ChatEntry {
  id: string;
  text: string;
  /** True when the message was sent by the local participant. */
  mine: boolean;
}

export function ChatPanel({
  entries,
  onSend,
  style,
}: {
  entries: ChatEntry[];
  onSend: (text: string) => void;
  style?: object;
}) {
  const t = useTheme();
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend(draft.trim());
    setDraft('');
  };

  // Inverted list renders bottom-up, so feed it newest-last.
  const reversed = [...entries].reverse();

  return (
    <View style={[styles.container, style]}>
      <FlatList
        accessibilityLabel="Chat transcript"
        data={reversed}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              {
                alignSelf: item.mine ? 'flex-end' : 'flex-start',
                backgroundColor: item.mine ? t.primary : t.card,
                borderColor: item.mine ? t.primary : t.border,
              },
            ]}
          >
            <ExiaText style={item.mine ? { color: '#090909' } : undefined}>
              {item.text}
            </ExiaText>
          </View>
        )}
        ListEmptyComponent={
          <ExiaText variant="caption" style={styles.empty}>
            No messages yet — text sent here reaches the agent.
          </ExiaText>
        }
        contentContainerStyle={styles.listContent}
      />
      <View style={[styles.inputRow, { borderColor: t.border }]}>
        <TextInput
          accessibilityLabel="Chat message"
          multiline
          onChangeText={setDraft}
          placeholder="Type something…"
          placeholderTextColor={t.mutedForeground}
          style={[styles.input, { color: t.foreground }]}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Send message"
          accessibilityRole="button"
          disabled={!canSend}
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendButton,
            { backgroundColor: canSend ? t.primary : t.input, opacity: canSend && pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons
            name="send"
            size={18}
            color={canSend ? '#090909' : t.mutedForeground}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingVertical: spacing.md, gap: spacing.sm },
  bubble: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  empty: { textAlign: 'center', paddingVertical: spacing.lg },
  inputRow: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 96,
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
