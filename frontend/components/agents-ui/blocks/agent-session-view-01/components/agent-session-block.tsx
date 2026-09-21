'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, type MotionProps, motion } from 'motion/react';
import {
  useAgent,
  useAgentExpression,
  useSessionContext,
  useSessionMessages,
} from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';
import { MOOD_COLORS, useMoodColor } from '@/hooks/agents-ui/useMoodColor';
import { cn } from '@/lib/shadcn/utils';
import { TileLayout } from './tile-view';

const BOTTOM_MOTION: MotionProps = {
  variants: {
    visible: { opacity: 1, translateY: '0%' },
    hidden: { opacity: 0, translateY: '100%' },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: { duration: 0.3, delay: 0.5, ease: 'easeOut' },
};

const CHAT_MOTION: MotionProps = {
  variants: {
    hidden: { opacity: 0, transition: { ease: 'easeOut', duration: 0.25 } },
    visible: { opacity: 1, transition: { delay: 0.15, ease: 'easeOut', duration: 0.25 } },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

const SHIMMER_MOTION: MotionProps = {
  variants: {
    visible: { opacity: 1, transition: { ease: 'easeIn', duration: 0.5, delay: 0.8 } },
    hidden: { opacity: 0, transition: { ease: 'easeIn', duration: 0.4 } },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

export function Fade({ top = false, bottom = false, className }: { top?: boolean; bottom?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}

// State config map
const STATE_CONFIG = {
  connecting: {
    color: '#f59e0b',
    label: 'Connecting',
    dot: 'animate-ping bg-amber-400',
    text: 'text-amber-400',
  },
  listening: {
    color: '#10b981',
    label: 'Listening',
    dot: 'animate-pulse bg-emerald-400',
    text: 'text-emerald-400',
  },
  thinking: {
    color: '#22d3ee',
    label: 'Thinking',
    dot: 'animate-spin bg-cyan-400',
    text: 'text-cyan-400',
  },
  speaking: {
    color: '#8b5cf6',
    label: 'Speaking',
    dot: 'animate-pulse bg-violet-400',
    text: 'text-violet-400',
  },
} as const;

export interface AgentSessionView_01Props {
  themeMode?: 'dark' | 'light';
  preConnectMessage?: string;
  supportsChatInput?: boolean;
  supportsVideoInput?: boolean;
  supportsScreenShare?: boolean;
  isPreConnectBufferEnabled?: boolean;
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;
  className?: string;
  onDisconnect?: () => void;
}

export function AgentSessionView_01({
  preConnectMessage = 'Agent is listening, ask it a question',
  supportsChatInput = true,
  supportsVideoInput = true,
  supportsScreenShare = true,
  isPreConnectBufferEnabled = true,
  audioVisualizerType,
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerWaveLineWidth,
  themeMode,
  onDisconnect,
  ref,
  className,
  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { state: agentState } = useAgent();
  const { mood, expression } = useAgentExpression();
  const moodColor = useMoodColor(mood, MOOD_COLORS);

  const controls: AgentControlBarControls = {
    microphone: true,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
    chat: supportsChatInput,
    leave: true,
  };

  const handleDisconnect = () => {
    try { onDisconnect?.(); } catch (e) { console.error(e); }
    session.end();
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    if (scrollAreaRef.current && lastMessage?.from?.isLocal === true) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const stateConfig = STATE_CONFIG[agentState as keyof typeof STATE_CONFIG];

  return (
    <section
      ref={ref}
      className={cn('bg-background relative z-10 h-full w-full overflow-hidden', className)}
      {...props}
    >
      <Fade top className="absolute inset-x-4 top-0 z-10 h-40" />

      {/* Floating State HUD pill */}
      <div className="pointer-events-none absolute inset-x-0 top-4 z-40 flex justify-center">
        <motion.div
          key={agentState}
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-black/75 px-4 py-1.5 shadow-xl shadow-black/40 backdrop-blur-xl"
        >
          {stateConfig ? (
            <>
              <span className={cn('size-1.5 rounded-full', stateConfig.dot)} />
              <span className={cn('font-mono text-xs font-semibold', stateConfig.text)}>
                {stateConfig.label}
              </span>
              {agentState === 'listening' && (
                <span className="font-mono text-[10px] text-white/30">— speak naturally</span>
              )}
            </>
          ) : (
            <>
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="font-mono text-xs capitalize text-white/40">{agentState || 'Ready'}</span>
            </>
          )}

          {/* Mood pill */}
          {mood && (
            <>
              <span className="text-white/15">·</span>
              <span
                className="rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold capitalize"
                style={{
                  backgroundColor: `${moodColor}15`,
                  borderColor: `${moodColor}40`,
                  color: moodColor,
                }}
                title={expression ?? `Agent is feeling ${mood}`}
              >
                {mood}
              </span>
            </>
          )}
        </motion.div>
      </div>

      {/* Chat transcript */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            {...CHAT_MOTION}
            className="absolute inset-x-0 top-0 bottom-[135px] overflow-hidden md:bottom-[170px]"
          >
            <AgentChatTranscript
              agentState={agentState}
              messages={messages}
              className="mx-auto max-w-2xl **:data-[slot=message-scroller-content]:p-4 **:data-[slot=message-scroller-content]:pt-40! md:**:data-[slot=message-scroller-content]:p-6"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tile layout */}
      <TileLayout
        isChatOpen={isChatOpen}
        themeMode={themeMode}
        audioVisualizerType={audioVisualizerType}
        audioVisualizerColor={audioVisualizerColor}
        audioVisualizerColorShift={audioVisualizerColorShift}
        audioVisualizerBarCount={audioVisualizerBarCount}
        audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
        audioVisualizerRadialRadius={audioVisualizerRadialRadius}
        audioVisualizerGridRowCount={audioVisualizerGridRowCount}
        audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
        audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
      />

      {/* Bottom control area */}
      <motion.div
        {...BOTTOM_MOTION}
        className="absolute inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {/* Pre-connect message */}
        {isPreConnectBufferEnabled && (
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.p
                key="pre-connect-message"
                aria-hidden={messages.length > 0}
                {...SHIMMER_MOTION}
                className="shimmer-text pointer-events-none mx-auto mb-3 block w-full max-w-lg text-center font-mono text-sm font-semibold tracking-wide"
              >
                {preConnectMessage}
              </motion.p>
            )}
          </AnimatePresence>
        )}

        <div className="relative mx-auto max-w-2xl pb-3 md:pb-10">
          <AgentControlBar
            variant="livekit"
            controls={controls}
            isChatOpen={isChatOpen}
            isConnected={session.isConnected}
            onDisconnect={handleDisconnect}
            onIsChatOpenChange={setIsChatOpen}
          />
        </div>
      </motion.div>
    </section>
  );
}
