'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { type LocalAudioTrack, type RemoteAudioTrack } from 'livekit-client';
import {
  type AgentMood,
  type AgentState,
  useAgent,
  useAgentExpression,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';
import { MOOD_COLORS, useMoodColor } from '@/hooks/agents-ui/useMoodColor';
import { cn } from '@/lib/shadcn/utils';

export interface VoiceAgentInterfaceProps {
  size?: 'icon' | 'sm' | 'md' | 'lg' | 'xl';
  state?: AgentState;
  mood?: AgentMood | null;
  expression?: string | null;
  audioTrack?: LocalAudioTrack | RemoteAudioTrack;
  showMoodLabel?: boolean;
  className?: string;
}

/**
 * Expressive Voice Agent Interface
 *
 * Drives audio visualization color from the agent's emotional delivery in realtime.
 * Automatically tracks LiveKit expressive mode when props are omitted.
 */
export function VoiceAgentInterface({
  size = 'lg',
  state: propState,
  mood: propMood,
  expression: propExpression,
  audioTrack: propAudioTrack,
  showMoodLabel = true,
  className,
}: VoiceAgentInterfaceProps) {
  // Read LiveKit hooks if props are not explicitly passed
  const voiceAssistant = useVoiceAssistant();
  const agent = useAgent();
  const agentExpression = useAgentExpression();

  const state = propState ?? voiceAssistant.state ?? agent.state ?? 'connecting';
  const audioTrack = propAudioTrack ?? voiceAssistant.audioTrack ?? agent.microphoneTrack;
  const mood = propMood !== undefined ? propMood : agentExpression.mood;
  const expression = propExpression !== undefined ? propExpression : agentExpression.expression;

  const color = useMoodColor(mood, MOOD_COLORS);
  const { resolvedTheme } = useTheme();
  const themeMode =
    resolvedTheme === 'light' || resolvedTheme === 'dark' ? resolvedTheme : undefined;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      title={expression ?? (mood ? `Mood: ${mood}` : undefined)}
    >
      <AgentAudioVisualizerAura
        size={size}
        state={state}
        color={color}
        audioTrack={audioTrack}
        themeMode={themeMode}
      />
      {showMoodLabel && (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold tracking-wide capitalize transition-colors duration-300 select-none"
          style={{ color }}
        >
          {mood ?? 'neutral'}
        </span>
      )}
    </div>
  );
}
