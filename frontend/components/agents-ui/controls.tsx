'use client';

import React, { useState } from 'react';
import { type LocalAudioTrack, type RemoteAudioTrack, TokenSource } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  useAgentExpression,
  useLocalParticipant,
  useSession,
  useVoiceAssistant,
} from '@livekit/components-react';
import { AgentControlBar } from '@/components/agents-ui/agent-control-bar';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { VoiceAgentInterface } from '@/components/agents-ui/voice-agent-interface';
import { MOOD_COLORS, getMoodMeta, useMoodColor } from '@/hooks/agents-ui/useMoodColor';
import { cn } from '@/lib/shadcn/utils';

const TOKEN_SOURCE = TokenSource.endpoint('/api/token');

export interface ControlsProps {
  /** Visual variant of the LiveKit control bar */
  variant?: 'livekit' | 'default' | 'outline';
  /** Initial chat drawer state */
  initialChatOpen?: boolean;
  /** Whether to show the integrated expressive visualizer hero above the controls */
  showVisualizer?: boolean;
  className?: string;
}

/**
 * Creative Expressive Agent Console
 *
 * Combines LiveKit's AgentSessionProvider, real-time emotional expression
 * audio visualization (driven by useAgentExpression and useMoodColor),
 * multimodal camera & screen-share vision indicators, and full media controls.
 */
function CreativeControlsInner({
  variant = 'livekit',
  initialChatOpen = true,
  showVisualizer = true,
  className,
}: Omit<ControlsProps, 'tokenSource'>) {
  const [isChatOpen, setIsChatOpen] = useState(initialChatOpen);
  const [isExpanded, setIsExpanded] = useState(true);

  const { state, audioTrack } = useVoiceAssistant();
  const { mood, expression } = useAgentExpression();
  const { localParticipant } = useLocalParticipant();

  const activeColor = useMoodColor(mood, MOOD_COLORS);
  const moodMeta = getMoodMeta(mood);

  const isCameraActive = localParticipant?.isCameraEnabled;
  const isScreenSharing = localParticipant?.isScreenShareEnabled;
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-6 p-6 transition-all duration-700 select-none',
        className
      )}
    >
      {/* Dynamic Ambient Emotional Atmosphere Halo */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.25, 1.1] : [1, 1.08, 1],
          opacity: isSpeaking ? [0.4, 0.7, 0.45] : [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: isSpeaking ? 2 : 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl blur-3xl transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${moodMeta.glow} 0%, transparent 70%)`,
        }}
      />

      {/* Multimodal Vision & Emotion Status Header */}
      <div className="z-10 flex flex-wrap items-center justify-center gap-2.5">
        {/* Agent State Badge */}
        <div className="bg-background/60 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs font-medium shadow-xs backdrop-blur-md">
          <span
            className={cn('size-2 rounded-full', {
              'animate-pulse bg-emerald-400': isSpeaking,
              'bg-primary': isListening,
              'animate-spin bg-amber-400': isThinking,
              'bg-muted-foreground/40': !isSpeaking && !isListening && !isThinking,
            })}
          />
          <span className="text-muted-foreground capitalize">
            {isSpeaking
              ? '🎙️ Speaking'
              : isListening
                ? '🎧 Listening'
                : isThinking
                  ? '💭 Thinking'
                  : '🟢 Active'}
          </span>
        </div>

        {/* Expressive Mood Capsule */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mood || 'neutral'}
            initial={{ opacity: 0, y: 3, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -3, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-medium shadow-xs backdrop-blur-md transition-colors"
            style={{
              backgroundColor: `${activeColor}15`,
              borderColor: `${activeColor}45`,
              color: activeColor,
            }}
          >
            <span>{moodMeta.emoji}</span>
            <span className="capitalize">{moodMeta.label}</span>
          </motion.div>
        </AnimatePresence>

        {/* Multimodal Vision Indicator */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md transition-all duration-300',
            isCameraActive || isScreenSharing
              ? 'border-primary/35 bg-primary/10 text-primary shadow-sm shadow-primary/15'
              : 'bg-background/60 text-muted-foreground border-white/10'
          )}
        >
          <span
            className={cn('size-2 rounded-full', {
              'animate-ping bg-emerald-400': isCameraActive || isScreenSharing,
              'bg-muted-foreground/40': !isCameraActive && !isScreenSharing,
            })}
          />
          <span>
            {isCameraActive
              ? '📷 Camera Feed Active'
              : isScreenSharing
                ? '🖥️ Screen Feed Active'
                : '👁️ Vision Ready'}
          </span>
        </div>

        {/* Visualizer Toggle */}
        {showVisualizer && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-background/40 hover:bg-background/80 text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] transition-colors"
            title={isExpanded ? 'Collapse Visualizer' : 'Expand Visualizer'}
          >
            {isExpanded ? 'Visualizer ▼' : 'Visualizer ▲'}
          </button>
        )}
      </div>

      {/* Expressive Audio Visualizer Hero Stage */}
      <AnimatePresence>
        {showVisualizer && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.9 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.9 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="my-2 flex flex-col items-center justify-center"
          >
            <VoiceAgentInterface
              size="lg"
              state={state}
              audioTrack={
                (audioTrack?.publication?.track ?? audioTrack) as
                  | LocalAudioTrack
                  | RemoteAudioTrack
                  | undefined
              }
              mood={mood}
              expression={expression}
              showMoodBadge={true}
              className="drop-shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glassmorphic Media Control Dock */}
      <div className="relative z-20 flex flex-col items-center justify-center">
        <div
          className="bg-background/75 rounded-2xl border border-white/10 p-2 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:shadow-primary/10"
          style={{
            boxShadow: `0 12px 40px -10px ${activeColor}25, 0 0 20px -2px ${activeColor}15`,
          }}
        >
          <AgentControlBar
            variant={variant}
            isChatOpen={isChatOpen}
            onIsChatOpenChange={setIsChatOpen}
            isConnected={true}
            controls={{
              microphone: true,
              camera: true,
              screenShare: true,
              chat: true,
              leave: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Creative LiveKit Controls Component
 *
 * Directly drop this into your page or modal to get:
 * - LiveKit Session Provider with automatic token retrieval
 * - Realtime Expressive Audio Visualization responding to agent emotional valence
 * - Full media controls (Microphone, Camera, Screen Share, Chat, Leave)
 * - Multimodal vision state tracking for Gemini 2.5 / LiveKit voice+vision
 */
export function Controls(props: ControlsProps) {
  const session = useSession(TOKEN_SOURCE);

  return (
    <AgentSessionProvider session={session}>
      <CreativeControlsInner {...props} />
    </AgentSessionProvider>
  );
}

export default Controls;
