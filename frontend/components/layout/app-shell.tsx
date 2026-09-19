'use client';

import React, { useEffect } from 'react';
import { Sidebar, NavTab } from './sidebar';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { ShieldCheck, Activity, Wifi } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface AppShellProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCallActive?: boolean;
  children: React.ReactNode;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string; code: string }> = {
  session: {
    title: 'Exia Voice Stage',
    subtitle: 'Live bidirectional WebRTC audio interface powered by LiveKit',
    code: 'STAGE-01',
  },
  history: {
    title: 'Session History & Telemetry',
    subtitle: 'Conversational logs, MCP tool calls, audio playback, and diagnostics',
    code: 'LOGS-02',
  },
  mcp: {
    title: 'Model Context Protocol (MCP)',
    subtitle: 'Configure local stdio and remote SSE tool servers with 1-click catalog',
    code: 'MCP-03',
  },
  prompts: {
    title: 'Directive & Prompt Matrix',
    subtitle: 'System personas, tactical instructions, and dynamic variable pills',
    code: 'DIRECTIVE-04',
  },
  models: {
    title: 'Intelligence & Model Engine',
    subtitle: 'Gemini Live native speech-to-speech or modular STT/LLM/TTS pipeline',
    code: 'ENGINE-05',
  },
  settings: {
    title: 'Settings & Security',
    subtitle: 'API endpoints, authentication credentials, and GN theme preferences',
    code: 'CONFIG-06',
  },
};

export function AppShell({
  currentTab,
  onSelectTab,
  isCallActive,
  children,
}: AppShellProps) {
  const { user } = useAuth();
  const currentMeta = TAB_TITLES[currentTab];

  // Global Keyboard Shortcuts (⌘1 through ⌘6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === '1') { e.preventDefault(); onSelectTab('session'); }
        if (e.key === '2') { e.preventDefault(); onSelectTab('history'); }
        if (e.key === '3') { e.preventDefault(); onSelectTab('mcp'); }
        if (e.key === '4') { e.preventDefault(); onSelectTab('prompts'); }
        if (e.key === '5') { e.preventDefault(); onSelectTab('models'); }
        if (e.key === '6') { e.preventDefault(); onSelectTab('settings'); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07090e] text-zinc-100 antialiased font-sans bg-tactical-grid">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isCallActive={isCallActive}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-radial-gradient">
        {/* Top Header */}
        <header className="h-14 border-b border-white/[0.08] px-4 md:px-6 flex items-center justify-between shrink-0 bg-[#07090e]/80 backdrop-blur-xl z-20">
          {/* Left: Branding on Mobile / Header info on Desktop */}
          <div className="flex items-center gap-3">
            <div className="md:hidden size-8 rounded-lg overflow-hidden border border-emerald-500/30 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/exia-logo.jpg"
                alt="Exia"
                className="size-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                  {currentMeta.code}
                </span>
                <h2 className="text-sm md:text-base font-semibold text-zinc-100 tracking-tight">
                  {currentMeta.title}
                </h2>
                {isCallActive && currentTab === 'session' && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                    TRANSMITTING
                  </span>
                )}
              </div>
              <p className="hidden md:block text-[11px] text-zinc-400">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Telemetry Badges & Mobile Theme Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Wifi className="size-3.5 text-emerald-400" />
                <span>WebRTC: 24ms</span>
              </div>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>FastAPI REST: Active</span>
              </div>
            </div>

            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative">
          {children}
        </main>

        {/* Mobile Floating Bottom Dock */}
        <MobileNav
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          isCallActive={isCallActive}
        />
      </div>
    </div>
  );
}

