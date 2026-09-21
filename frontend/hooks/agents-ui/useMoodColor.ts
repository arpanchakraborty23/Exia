'use client';

import { useEffect, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import chroma from 'chroma-js';
import type { AgentMood } from '@livekit/components-react';

/**
 * Hue carries valence (warm for bright moments, cool for heavy ones); saturation carries
 * intensity, so a quiet mood never out-shouts a strong one.
 */
export const MOOD_COLORS: Record<AgentMood, `#${string}`> = {
  angry: '#F5222D',
  excited: '#FF7A45',
  happy: '#FFC53D',
  playful: '#F759AB',
  surprised: '#B37FEB',
  anxious: '#D46B08',
  hopeful: '#52C41A',
  empathetic: '#36CFC9',
  curious: '#6600FF',
  sad: '#2F54EB',
  calm: '#1FD5F9',
};

// Shown when the agent hasn't expressed anything recently.
export const NEUTRAL_COLOR: `#${string}` = '#1FD5F9';

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
    const controls = animate(colorProgress, targetColor, { duration: 1, ease: 'linear' });
    return () => controls.stop();
  }, [targetColor, colorProgress]);

  return color;
}
