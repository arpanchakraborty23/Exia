'use client';

import React from 'react';
import { AnimatePresence, type MotionProps, motion } from 'motion/react';
import { useAgentExpression, useVoiceAssistant } from '@livekit/components-react';
import { AgentAudioVisualizerAura } from '@/components/agents-ui/agent-audio-visualizer-aura';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { AgentAudioVisualizerGrid } from '@/components/agents-ui/agent-audio-visualizer-grid';
import { AgentAudioVisualizerRadial } from '@/components/agents-ui/agent-audio-visualizer-radial';
import { AgentAudioVisualizerWave } from '@/components/agents-ui/agent-audio-visualizer-wave';
import { MOOD_COLORS, useMoodColor } from '@/hooks/agents-ui/useMoodColor';
import { cn } from '@/lib/shadcn/utils';

const MotionAgentAudioVisualizerAura = motion.create(AgentAudioVisualizerAura);
const MotionAgentAudioVisualizerBar = motion.create(AgentAudioVisualizerBar);
const MotionAgentAudioVisualizerGrid = motion.create(AgentAudioVisualizerGrid);
const MotionAgentAudioVisualizerRadial = motion.create(AgentAudioVisualizerRadial);
const MotionAgentAudioVisualizerWave = motion.create(AgentAudioVisualizerWave);

interface AudioVisualizerProps extends MotionProps {
  themeMode?: 'dark' | 'light';
  isChatOpen: boolean;
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerWaveLineWidth?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerBarCount?: number;
  className?: string;
}

export function AudioVisualizer({
  themeMode,
  isChatOpen,
  audioVisualizerType = 'bar',
  audioVisualizerColor,
  audioVisualizerColorShift = 0.3,
  audioVisualizerBarCount = 5,
  audioVisualizerRadialRadius = 100,
  audioVisualizerRadialBarCount = 25,
  audioVisualizerGridRowCount = 15,
  audioVisualizerGridColumnCount = 15,
  audioVisualizerWaveLineWidth = 3,
  className,
  ...props
}: AudioVisualizerProps) {
  const { state, audioTrack } = useVoiceAssistant();
  const { mood, expression } = useAgentExpression();
  const moodColor = useMoodColor(mood, MOOD_COLORS);
  const activeColor = audioVisualizerColor || moodColor;

  const renderVisualizer = () => {
    switch (audioVisualizerType) {
      case 'aura': {
        return (
          <MotionAgentAudioVisualizerAura
            state={state}
            audioTrack={audioTrack}
            color={activeColor}
            colorShift={audioVisualizerColorShift}
            themeMode={themeMode}
            className={cn('size-[300px] md:size-[450px]', className)}
            {...props}
          />
        );
      }
      case 'wave': {
        return (
          <motion.div className={className} {...props}>
            <MotionAgentAudioVisualizerWave
              state={state}
              audioTrack={audioTrack}
              color={activeColor}
              colorShift={audioVisualizerColorShift}
              lineWidth={
                isChatOpen ? audioVisualizerWaveLineWidth * 2 : audioVisualizerWaveLineWidth
              }
              className="size-[300px] md:size-[450px]"
            />
          </motion.div>
        );
      }
      case 'grid': {
        const totalCount = audioVisualizerGridRowCount * audioVisualizerGridColumnCount;

        let size: 'icon' | 'sm' | 'md' | 'lg' | 'xl' = 'sm';
        if (totalCount < 100) {
          size = 'xl';
        } else if (totalCount < 200) {
          size = 'lg';
        } else if (totalCount < 300) {
          size = 'md';
        }

        return (
          <MotionAgentAudioVisualizerGrid
            size={size}
            state={state}
            color={activeColor}
            audioTrack={audioTrack}
            rowCount={audioVisualizerGridRowCount}
            columnCount={audioVisualizerGridColumnCount}
            radius={Math.round(
              Math.min(audioVisualizerGridRowCount, audioVisualizerGridColumnCount) / 4
            )}
            className={cn('size-[350px] gap-0 p-8 *:place-self-center md:size-[450px]', className)}
            {...props}
          />
        );
      }
      case 'radial': {
        return (
          <motion.div className={className} {...props}>
            <MotionAgentAudioVisualizerRadial
              size="xl"
              state={state}
              color={activeColor}
              audioTrack={audioTrack}
              radius={audioVisualizerRadialRadius}
              barCount={audioVisualizerRadialBarCount}
              className="size-[450px]"
            />
          </motion.div>
        );
      }
      default: {
        let size: 'icon' | 'sm' | 'md' | 'lg' | 'xl' = 'icon';
        let sizedClassName = cn('size-[300px] md:size-[450px]', className);

        if (audioVisualizerBarCount <= 5) {
          size = 'xl';
          sizedClassName = cn('size-[450px] *:min-h-[64px] *:w-[64px] gap-4', className);
        } else if (audioVisualizerBarCount <= 10) {
          size = 'lg';
          sizedClassName = cn('size-[450px]', className);
        } else if (audioVisualizerBarCount <= 15) {
          size = 'md';
          sizedClassName = cn('size-[350px] md:size-[450px]', className);
        } else if (audioVisualizerBarCount <= 30) {
          size = 'sm';
          sizedClassName = cn('size-[300px] md:size-[450px]', className);
        }

        return (
          <MotionAgentAudioVisualizerBar
            size={size}
            state={state}
            color={activeColor}
            audioTrack={audioTrack}
            barCount={audioVisualizerBarCount}
            className={sizedClassName}
            {...props}
          >
            <span className="min-h-2.5 w-2.5 rounded-full bg-current/10 transition-colors duration-250 ease-linear data-[lk-highlighted=true]:bg-current" />
          </MotionAgentAudioVisualizerBar>
        );
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {renderVisualizer()}
      <AnimatePresence>
        {mood && !isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="border-border/50 pointer-events-none absolute -bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-medium shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: `${activeColor}18`,
              borderColor: `${activeColor}55`,
              color: activeColor,
            }}
            title={expression ?? undefined}
          >
            <span
              className="size-1.5 animate-pulse rounded-full"
              style={{ backgroundColor: activeColor }}
            />
            <span className="capitalize">{mood}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
