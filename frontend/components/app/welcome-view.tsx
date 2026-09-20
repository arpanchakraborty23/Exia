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
    <div ref={ref} className="flex min-h-[70vh] w-full items-center justify-center p-6">
      <div className="bg-card/70 border-border animate-in fade-in zoom-in-95 flex w-full max-w-lg flex-col items-center space-y-6 rounded-3xl border p-8 text-center shadow-2xl backdrop-blur-xl duration-200 md:p-10">
        {/* Animated Orb/Mic */}
        <div className="group relative cursor-pointer" onClick={onStartCall}>
          <div className="absolute -inset-4 animate-pulse rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-violet-500/30 blur-xl transition-all duration-300 group-hover:scale-110" />
          <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 transition-all group-hover:scale-105 active:scale-95 md:size-28">
            <Mic className="size-10 md:size-12" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="size-3.5" />
            <span>LiveKit WebRTC + Gemini Live</span>
          </div>
          <h2 className="text-foreground text-xl font-bold tracking-tight md:text-2xl">
            Home Assistant Voice Stage
          </h2>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs leading-relaxed md:text-sm">
            Press to start a real-time conversational session. Natural interruption, sub-second
            latency, and local tools.
          </p>
        </div>

        <Button
          size="lg"
          onClick={onStartCall}
          className="shadow-primary/25 w-full max-w-xs cursor-pointer rounded-2xl py-3 text-sm font-semibold shadow-lg"
        >
          <Radio className="mr-2 size-4 animate-pulse" />
          {startButtonText || 'Start Voice Call'}
        </Button>

        <div className="text-muted-foreground border-border/60 flex w-full flex-wrap items-center justify-center gap-4 border-t pt-2 text-[11px]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>FastAPI Token Auth</span>
          </span>
          <span>•</span>
          <span>Adaptive Noise Cancellation</span>
          <span>•</span>
          <span>Auto-Transcript</span>
        </div>
      </div>
    </div>
  );
};
