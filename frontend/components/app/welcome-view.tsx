import React from 'react';
import { Mic, Radio, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref} className="flex min-h-[70vh] w-full items-center justify-center p-6 select-none">
      <div className="animate-in fade-in zoom-in-95 relative flex w-full max-w-lg flex-col items-center space-y-6 rounded-3xl border border-white/10 bg-[#080808]/90 p-8 text-center shadow-2xl backdrop-blur-2xl duration-300 md:p-10">
        {/* Dynamic GN Ambient Glow */}
        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-radial from-emerald-500/15 via-cyan-500/10 to-transparent blur-3xl" />

        {/* Animated Voice Orb */}
        <div className="group relative cursor-pointer" onClick={onStartCall}>
          <div className="absolute -inset-4 animate-pulse rounded-full bg-gradient-to-tr from-emerald-500/30 via-cyan-500/20 to-teal-500/30 blur-xl transition-all duration-300 group-hover:scale-115" />
          <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black shadow-xl shadow-emerald-500/30 transition-all duration-300 group-hover:scale-105 active:scale-95 md:size-28">
            <Mic className="size-10 stroke-[2.2] md:size-12" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
            <Sparkles className="size-3.5" />
            <span>LiveKit WebRTC • Gemini Live Multimodal</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white md:text-2xl">
            Autonomous Voice Stage
          </h2>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-zinc-400 md:text-sm">
            Engage in sub-second conversational speech with vision intelligence, real-time
            interruption, and connected MCP tools.
          </p>
        </div>

        <Button
          size="lg"
          onClick={onStartCall}
          className="w-full max-w-xs cursor-pointer rounded-full bg-white py-3.5 text-sm font-semibold text-black shadow-xl shadow-white/10 transition-all duration-200 hover:bg-neutral-200 active:scale-95"
        >
          <Radio className="mr-2 size-4 animate-pulse text-emerald-600" />
          {startButtonText || 'Initialize Voice Session'}
        </Button>

        <div className="flex w-full flex-wrap items-center justify-center gap-4 border-t border-white/10 pt-3 font-mono text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>FastAPI Secure Tokens</span>
          </span>
          <span>•</span>
          <span>Spatial Noise Reduction</span>
          <span>•</span>
          <span>Live Multimodal Feed</span>
        </div>
      </div>
    </div>
  );
};
