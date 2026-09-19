import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Radio, Sparkles, ShieldCheck } from 'lucide-react';

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
    <div ref={ref} className="w-full flex items-center justify-center p-6 min-h-[70vh]">
      <div className="w-full max-w-lg p-8 md:p-10 rounded-3xl bg-card/70 backdrop-blur-xl border border-border shadow-2xl flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Orb/Mic */}
        <div className="relative group cursor-pointer" onClick={onStartCall}>
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-violet-500/30 rounded-full blur-xl group-hover:scale-110 transition-all duration-300 animate-pulse" />
          <div className="relative size-24 md:size-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-105 active:scale-95 transition-all">
            <Mic className="size-10 md:size-12" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="size-3.5" />
            <span>LiveKit WebRTC + Gemini Live</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Home Assistant Voice Stage
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Press to start a real-time conversational session. Natural interruption, sub-second latency, and local tools.
          </p>
        </div>

        <Button
          size="lg"
          onClick={onStartCall}
          className="w-full max-w-xs py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-primary/25 cursor-pointer"
        >
          <Radio className="size-4 mr-2 animate-pulse" />
          {startButtonText || 'Start Voice Call'}
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] text-muted-foreground border-t border-border/60 w-full">
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
