import React from 'react';
import { Radio, ShieldCheck, Sparkles, Zap } from 'lucide-react';
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
    <div
      ref={ref}
      className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden p-6 select-none"
    >
      {/* Ambient aurora layers — LiveKit cyan */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="aurora-orb absolute top-1/3 left-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25"
          style={{
            background:
              'radial-gradient(circle, rgba(31,213,249,0.45) 0%, rgba(0,44,242,0.15) 45%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-12"
          style={{
            background: 'radial-gradient(circle, rgba(31,213,249,0.5) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-8 text-center">
        {/* Status badge — LiveKit primary cyan */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 font-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
          <Sparkles className="size-3 text-primary" />
          <span>LiveKit WebRTC · Gemini Live</span>
        </div>

        {/* Voice Orb */}
        <div className="relative cursor-pointer" onClick={onStartCall}>
          {/* Outer ring halo — breathes */}
          <div
            className="aurora-orb absolute -inset-8 rounded-full opacity-35"
            style={{
              background:
                'radial-gradient(circle, rgba(31,213,249,0.4) 0%, rgba(0,44,242,0.12) 50%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />
          {/* Ring border */}
          <div className="absolute -inset-3 rounded-full border border-primary/20 transition-all duration-500 hover:border-primary/40" />
          <div className="absolute -inset-1.5 rounded-full border border-primary/10" />

          {/* Core orb */}
          <div className="float-orb relative flex size-28 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 md:size-32">
            {/* Orb gradient fill — LiveKit cyan → blue */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #002CF2 0%, #0066ff 40%, #1FD5F9 100%)',
                boxShadow:
                  '0 0 40px rgba(31,213,249,0.5), 0 0 80px rgba(31,213,249,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            />
            {/* Inner highlight */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
            <Zap className="relative size-11 stroke-[1.8] text-white drop-shadow-lg md:size-13" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="font-mono text-3xl font-black tracking-tight text-white md:text-4xl">
            EXIA
            <span className="ml-3 font-mono text-base font-normal tracking-widest text-white/30">

            </span>
          </h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/50">
            Sub-second conversational speech with vision intelligence, real-time interruption, and
            connected MCP tools.
          </p>
        </div>

        {/* CTA — LiveKit cyan gradient */}
        <Button
          size="lg"
          onClick={onStartCall}
          className="group relative w-full max-w-xs cursor-pointer overflow-hidden rounded-full py-6 text-sm font-semibold text-black shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #002CF2 0%, #0055ff 50%, #1FD5F9 100%)',
            boxShadow: '0 0 32px rgba(31,213,249,0.4), 0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* Shimmer sweep on hover */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Radio className="relative mr-2 size-4 animate-pulse" />
          <span className="relative">{startButtonText || 'Initialize Voice Session'}</span>
        </Button>

        {/* Feature strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[10px] tracking-wide text-white/25 uppercase">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3 text-muted-foreground/50" />
            <span>Secure Tokens</span>
          </span>
          <span className="text-white/15">•</span>
          <span>Noise Reduction</span>
          <span className="text-white/15">•</span>
          <span>Multimodal Vision</span>
          <span className="text-white/15">•</span>
          <span>MCP Tools</span>
        </div>
      </div>
    </div>
  );
};

