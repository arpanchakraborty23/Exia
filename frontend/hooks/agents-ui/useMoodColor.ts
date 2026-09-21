'use client';

import { useEffect, useState } from 'react';
import chroma from 'chroma-js';
import { animate, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import type { AgentMood } from '@livekit/components-react';

export interface MoodMeta {
  color: `#${string}`;
  emoji: string;
  label: string;
  intensity: number;
  glow: string;
}

/**
 * Rich chromatic emotional palette for LiveKit expressive agents.
 * Hue carries valence (warm for bright moments, cool for deep contemplation);
 * saturation & glow carry intensity.
 */
export const MOOD_META: Record<AgentMood, MoodMeta> = {
  excited: {
    color: '#FF7A45',
    emoji: '⚡',
    label: 'Excited',
    intensity: 0.9,
    glow: 'rgba(255, 122, 69, 0.45)',
  },
  happy: {
    color: '#FFC53D',
    emoji: '✨',
    label: 'Happy',
    intensity: 0.75,
    glow: 'rgba(255, 197, 61, 0.4)',
  },
  playful: {
    color: '#F759AB',
    emoji: '🎉',
    label: 'Playful',
    intensity: 0.85,
    glow: 'rgba(247, 89, 171, 0.45)',
  },
  curious: {
    color: '#722ED1',
    emoji: '💡',
    label: 'Curious',
    intensity: 0.65,
    glow: 'rgba(114, 46, 209, 0.45)',
  },
  surprised: {
    color: '#B37FEB',
    emoji: '😲',
    label: 'Surprised',
    intensity: 0.8,
    glow: 'rgba(179, 127, 235, 0.4)',
  },
  anxious: {
    color: '#FA8C16',
    emoji: '⚡',
    label: 'Intrigued',
    intensity: 0.7,
    glow: 'rgba(250, 140, 22, 0.4)',
  },
  hopeful: {
    color: '#52C41A',
    emoji: '🌱',
    label: 'Hopeful',
    intensity: 0.6,
    glow: 'rgba(82, 196, 26, 0.4)',
  },
  empathetic: {
    color: '#13C2C2',
    emoji: '💙',
    label: 'Empathetic',
    intensity: 0.5,
    glow: 'rgba(19, 194, 194, 0.4)',
  },
  sad: {
    color: '#2F54EB',
    emoji: '🌧️',
    label: 'Reflective',
    intensity: 0.45,
    glow: 'rgba(47, 84, 235, 0.4)',
  },
  angry: {
    color: '#F5222D',
    emoji: '🔥',
    label: 'Dynamic',
    intensity: 0.95,
    glow: 'rgba(245, 34, 45, 0.5)',
  },
  calm: {
    color: '#1FD5F9',
    emoji: '🌊',
    label: 'Calm',
    intensity: 0.35,
    glow: 'rgba(31, 213, 249, 0.35)',
  },
};

export const NEUTRAL_META: MoodMeta = {
  color: '#1FD5F9',
  emoji: '🤖',
  label: 'Attentive',
  intensity: 0.3,
  glow: 'rgba(31, 213, 249, 0.25)',
};

export const MOOD_COLORS: Record<AgentMood, `#${string}`> = Object.fromEntries(
  Object.entries(MOOD_META).map(([k, v]) => [k, v.color])
) as Record<AgentMood, `#${string}`>;

export const NEUTRAL_COLOR: `#${string}` = NEUTRAL_META.color;

/**
 * Returns complete emotional metadata including emoji, label, and glow styling.
 */
export function getMoodMeta(mood: AgentMood | null): MoodMeta {
  if (!mood) return NEUTRAL_META;
  return MOOD_META[mood] || NEUTRAL_META;
}

/**
 * Drives audio visualizer color from the agent's emotional delivery in realtime.
 * Interpolates smoothly between mood colors using motion and chroma-js.
 */
export function useMoodColor(
  mood: AgentMood | null,
  moodColors: Record<AgentMood, `#${string}`> = MOOD_COLORS,
  fallbackColor: `#${string}` = NEUTRAL_COLOR
): `#${string}` {
  const targetColor = mood ? moodColors[mood] || fallbackColor : fallbackColor;
  const colorProgress = useMotionValue<string>(targetColor);
  const hexColor = useTransform(colorProgress, (latestRgba) => chroma(latestRgba).hex());
  const [color, setColor] = useState<`#${string}`>(targetColor);

  useMotionValueEvent(hexColor, 'change', (latestHex) => {
    setColor(`#${latestHex.slice(1)}` as `#${string}`);
  });

  useEffect(() => {
    const controls = animate(colorProgress, targetColor, { duration: 1.1, ease: 'easeInOut' });
    return () => controls.stop();
  }, [targetColor, colorProgress]);

  return color;
}
