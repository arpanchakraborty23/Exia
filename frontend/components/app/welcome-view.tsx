'use client';

import React, { useState } from 'react';
import { ArrowUp, Cpu, Mic, Radio, Send, ShieldCheck, Sliders, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeViewProps {
  startButtonText?: string;
  onStartCall: () => void;
}

const SUGGESTED_PROMPTS = [
  { label: 'Check MCP registry tools', icon: Cpu, query: 'Show all registered MCP servers and available tools.' },
  { label: 'Switch AI model pipeline', icon: Sliders, query: 'Which model engines are currently configured?' },
  { label: 'Check smart home telemetry', icon: Radio, query: 'What is the current status of all home sensors?' },
  { label: 'Start hands-free voice mode', icon: Mic, query: 'voice' },
];

export const WelcomeView = ({
  startButtonText = 'Start Voice Session',
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const [typedInput, setTypedInput] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onStartCall();
  };

  const handleSelectPrompt = (prompt: (typeof SUGGESTED_PROMPTS)[0]) => {
    if (prompt.query === 'voice') {
      onStartCall();
    } else {
      setTypedInput(prompt.query);
      onStartCall();
    }
  };

  return (
    <div
      ref={ref}
      className="relative flex min-h-[82vh] w-full flex-col items-center justify-center overflow-hidden px-4 py-8 select-none"
    >
      {/* Ambient background bloom */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="aurora-orb absolute top-1/3 left-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(31,213,249,0.06) 0%, rgba(0,44,242,0.03) 50%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      <div className="relative flex w-full max-w-2xl flex-col items-center gap-7 text-center">
        {/* Status indicator */}
        <div className="border-border bg-card/60 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs backdrop-blur-md">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-muted-foreground font-medium">Exia Intelligence · Ready</span>
        </div>

        {/* Voice Orb */}
        <div
          className="group relative cursor-pointer"
          onClick={onStartCall}
          title="Click to activate voice session"
        >
          {/* Subtle breathing glow */}
          <div
            className="aurora-orb absolute -inset-6 rounded-full opacity-25 transition-opacity group-hover:opacity-40"
            style={{
              background:
                'radial-gradient(circle, rgba(31,213,249,0.5) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />

          {/* Interactive Core Orb */}
          <div className="float-orb relative flex size-20 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-105 group-active:scale-95 md:size-24">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #002CF2 0%, #0055ff 45%, #1FD5F9 100%)',
                boxShadow:
                  '0 0 36px rgba(31,213,249,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            />
            <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
            <Mic className="relative size-8 stroke-[1.75] text-white" />
          </div>
        </div>

        {/* Header copy */}
        <div className="space-y-2">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            What can Exia do for you?
          </h1>
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            Sub-second conversational voice intelligence, multimodal vision, and remote MCP tool execution.
          </p>
        </div>

        {/* TYPE UI — Interactive prompt input container */}
        <form
          onSubmit={handleSubmit}
          className="border-border bg-card/80 focus-within:border-primary/40 focus-within:ring-primary/10 relative w-full rounded-2xl border p-2 shadow-xl backdrop-blur-xl transition-all focus-within:ring-4"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder="Ask anything, type a command, or click to start voice..."
              className="placeholder:text-muted-foreground/50 text-foreground flex-1 bg-transparent px-3 py-2 text-sm outline-none"
            />

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onStartCall}
                className="hover:bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl transition-colors"
                title="Start Voice Session"
              >
                <Mic className="size-4.5" />
              </button>

              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary-hover flex size-9 items-center justify-center rounded-xl font-semibold shadow-md transition-all active:scale-95"
                title="Send"
              >
                <ArrowUp className="size-4.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </form>

        {/* Suggested Prompt Chips */}
        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          {SUGGESTED_PROMPTS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPrompt(p)}
                className="border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all hover:border-primary/30"
              >
                <Icon className="text-primary size-3.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feature badges */}
        <div className="text-muted-foreground/60 flex flex-wrap items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            End-to-End Encrypted
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Real-time Interruption
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Cpu className="size-3.5 text-primary" />
            LiveKit WebRTC
          </span>
        </div>
      </div>
    </div>
  );
};
