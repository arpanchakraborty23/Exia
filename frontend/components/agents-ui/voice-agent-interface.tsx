'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { type LocalAudioTrack, type RemoteAudioTrack } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentMood,
  type AgentState,
  useAgent,
  useAgentExpression,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';
import { MOOD_COLORS, getMoodMeta, useMoodColor } from '@/hooks/agents-ui/useMoodColor';
import { cn } from '@/lib/shadcn/utils';

export interface VoiceAgentInterfaceProps {
  size?: 'icon' | 'sm' | 'md' | 'lg' | 'xl';
  state?: AgentState;
  mood?: AgentMood | null;
  expression?: string | null;
  audioTrack?: LocalAudioTrack | RemoteAudioTrack;
  showMoodBadge?: boolean;
  className?: string;
}

/**
 * Creative Expressive Voice Agent Interface
 *
 * Drives audio visualization color and ambient atmospheric glow
 * from the agent's emotional delivery in realtime.
 */
export function VoiceAgentInterface({
  size = 'lg',
  state: propState,
  mood: propMood,
  expression: propExpression,
  audioTrack: propAudioTrack,
  showMoodBadge = true,
  className,
}: VoiceAgentInterfaceProps) {
  const voiceAssistant = useVoiceAssistant();
  const agent = useAgent();
  const agentExpression = useAgentExpression();

  const state = propState ?? voiceAssistant.state ?? agent.state ?? 'connecting';
  const audioTrack = propAudioTrack ?? voiceAssistant.audioTrack ?? agent.microphoneTrack;
  const mood = propMood !== undefined ? propMood : agentExpression.mood;
  const expression = propExpression !== undefined ? propExpression : agentExpression.expression;

  const color = useMoodColor(mood, MOOD_COLORS);
  const moodMeta = getMoodMeta(mood);
  const { resolvedTheme } = useTheme();
  const themeMode =
    resolvedTheme === 'light' || resolvedTheme === 'dark' ? resolvedTheme : undefined;

  const isSpeaking = state === 'speaking';

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      title={expression ?? (mood ? `Mood: ${moodMeta.label}` : undefined)}
    >
      {/* Dynamic Ambient Emotional Glow Halo */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.15, 1.05] : [1, 1.05, 1],
          opacity: isSpeaking ? [0.35, 0.65, 0.45] : [0.15, 0.28, 0.15],
        }}
        transition={{
          duration: isSpeaking ? 1.8 : 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-3xl transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle, ${moodMeta.glow} 0%, transparent 70%)`,
        }}
      />

      {/* Aura Audio Visualizer */}
      <AgentAudioVisualizerAura
        size={size}
        state={state}
        color={color}
        colorShift={0.08 + moodMeta.intensity * 0.1}
        audioTrack={audioTrack}
        themeMode={themeMode}
      />

      {/* Center Floating Expressive Mood Capsule */}
      <AnimatePresence>
        {showMoodBadge && (
          <motion.div
            key={mood || 'neutral'}
            initial={{ opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none"
          >
            <div
              className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-xs font-semibold shadow-xl backdrop-blur-xl transition-all duration-500"
              style={{
                backgroundColor: `${color}18`,
                borderColor: `${color}45`,
                color: color,
                boxShadow: `0 8px 24px ${moodMeta.glow}`,
              }}
            >
              <span className="text-sm">{moodMeta.emoji}</span>
              <span className="tracking-wider capitalize">{moodMeta.label}</span>
              {isSpeaking && (
                <span
                  className="size-1.5 animate-ping rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>

            {/* Optional Expression Whisper / Caption */}
            {expression && (
              <motion.p
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 0.85, y: 0 }}
                className="text-muted-foreground bg-black/50 mt-2 line-clamp-1 max-w-[220px] rounded-full px-3 py-0.5 text-center font-mono text-[10px] tracking-tight italic backdrop-blur-xl"
              >
                &ldquo;{expression}&rdquo;
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
