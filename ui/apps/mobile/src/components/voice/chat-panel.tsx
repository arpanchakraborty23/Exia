import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brand, radius, spacing } from '@exia/design-tokens';
import { ExiaText, useTheme } from '@exia/shared-ui';

/**
 * Voice session chat transcript + real-time input.
 *
 * Messages flow over the LiveKit room's `lk.chat` topic (the same channel the
 * web AgentChatTranscript uses). Displays user & agent messages with
 * Linear/Perplexity dark styling, timestamps, and active state indicators.
 */
export interface ChatEntry {
  id: string;
  text: string;
  /** True when the message was sent by the local participant. */
  mine: boolean;
  /** Optional message timestamp (epoch ms or ISO string). */
  timestamp?: number | string;
}

export interface ChatPanelProps {
  entries: ChatEntry[];
  onSend: (text: string) => void;
  onClose?: () => void;
  isAgentThinking?: boolean;
  style?: ViewStyle;
}

export function ChatPanel({
  entries,
  onSend,
  onClose,
  isAgentThinking = false,
  style,
}: ChatPanelProps) {
  const t = useTheme();
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend(draft.trim());
    setDraft('');
  };

  // Inverted FlatList renders bottom-up, so feed it newest-first.
  const reversed = [...entries].reverse();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: t.card,
          borderColor: t.border,
        },
        style,
      ]}
    >
      {/* Panel Header */}
      <View style={[styles.headerRow, { borderBottomColor: t.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.liveIndicatorDot} />
          <ExiaText style={styles.headerTitle}>TRANSCRIPT</ExiaText>
          <View style={[styles.channelBadge, { backgroundColor: 'rgba(31, 213, 249, 0.1)' }]}>
            <ExiaText style={styles.channelBadgeText}>lk.chat</ExiaText>
          </View>
        </View>

        {onClose ? (
          <Pressable
            accessibilityLabel="Close transcript panel"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="close" size={18} color={t.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {/* Transcript list */}
      <FlatList
        accessibilityLabel="Chat transcript"
        data={reversed}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatMessageBubble item={item} />}
        ListHeaderComponent={
          isAgentThinking ? (
            <View
              style={[
                styles.thinkingBubble,
                { backgroundColor: t.input, borderColor: t.border },
              ]}
            >
              <View style={styles.thinkingDot} />
              <ExiaText variant="caption" style={styles.thinkingText}>
                Agent is thinking…
              </ExiaText>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrap, { backgroundColor: t.input }]}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={28}
                color={brand.electricCyan}
              />
            </View>
            <ExiaText style={styles.emptyTitle}>Live Session Transcript</ExiaText>
            <ExiaText variant="caption" style={styles.emptyDesc}>
              Messages sent here stream directly to the agent over the WebRTC data channel.
            </ExiaText>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Input bar */}
      <View style={[styles.inputRow, { borderTopColor: t.border }]}>
        <View style={[styles.inputContainer, { backgroundColor: t.input, borderColor: t.border }]}>
          <TextInput
            accessibilityLabel="Chat message input"
            multiline
            onChangeText={setDraft}
            onSubmitEditing={handleSend}
            placeholder="Type a message to the agent…"
            placeholderTextColor={t.mutedForeground}
            style={[styles.input, { color: t.foreground }]}
            value={draft}
          />
          <Pressable
            accessibilityLabel="Send message"
            accessibilityRole="button"
            disabled={!canSend}
            hitSlop={6}
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: canSend ? brand.electricCyan : 'transparent',
                opacity: canSend && pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={canSend ? '#000000' : t.mutedForeground}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ChatMessageBubble({ item }: { item: ChatEntry }) {
  const t = useTheme();

  return (
    <View
      style={[
        styles.bubbleWrap,
        {
          alignSelf: item.mine ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      <View style={styles.metaRow}>
        {!item.mine ? (
          <View style={styles.agentTag}>
            <View style={styles.agentDot} />
            <ExiaText style={styles.senderLabel}>Agent</ExiaText>
          </View>
        ) : (
          <ExiaText style={styles.senderLabel}>You</ExiaText>
        )}
      </View>

      <View
        style={[
          styles.bubble,
          item.mine
            ? {
                backgroundColor: brand.electricCyan,
                borderBottomRightRadius: 4,
              }
            : {
                backgroundColor: t.input,
                borderColor: t.border,
                borderWidth: StyleSheet.hairlineWidth,
                borderBottomLeftRadius: 4,
              },
        ]}
      >
        <ExiaText
          style={[
            styles.bubbleText,
            item.mine ? { color: '#000000', fontWeight: '500' } : { color: t.foreground },
          ]}
        >
          {item.text}
        </ExiaText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    overflow: 'hidden',
  },
  headerRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  liveIndicatorDot: {
    backgroundColor: brand.liveEmerald,
    borderRadius: radius.full,
    height: 6,
    width: 6,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  channelBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
  },
  channelBadgeText: {
    color: brand.electricCyan,
    fontSize: 10,
    fontWeight: '600',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  listContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  bubbleWrap: {
    maxWidth: '85%',
  },
  metaRow: {
    marginBottom: 3,
    paddingHorizontal: 2,
  },
  agentTag: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  agentDot: {
    backgroundColor: brand.liveEmerald,
    borderRadius: radius.full,
    height: 5,
    width: 5,
  },
  senderLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
  bubble: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  thinkingBubble: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  thinkingDot: {
    backgroundColor: brand.electricCyan,
    borderRadius: radius.full,
    height: 6,
    width: 6,
  },
  thinkingText: {
    color: brand.electricCyan,
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIconWrap: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 52,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyDesc: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  inputRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
  },
  inputContainer: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 44,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 88,
    paddingVertical: spacing.xs + 2,
  },
  sendButton: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
});
