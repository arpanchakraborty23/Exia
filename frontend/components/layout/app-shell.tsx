'use client';

import React from 'react';
import { Sidebar, NavTab } from './sidebar';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { Radio, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface AppShellProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCallActive?: boolean;
  children: React.ReactNode;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  session: {
    title: 'Voice Assistant Stage',
    subtitle: 'Real-time bidirectional LiveKit audio session',
  },
  history: {
    title: 'Session History',
    subtitle: 'Inspect past transcripts, tool invocations, and models',
  },
  mcp: {
    title: 'Model Context Protocol (MCP)',
    subtitle: 'Manage local and remote tool servers for the voice agent',
  },
  prompts: {
    title: 'Prompts & Commands',
    subtitle: 'Customize agent system instructions and quick triggers',
  },
  models: {
    title: 'Model & Voice Configuration',
    subtitle: 'Toggle Gemini Live or configure modular STT/LLM/TTS pipelines',
  },
  settings: {
    title: 'Account & Settings',
    subtitle: 'Security, authentication credentials, and preferences',
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isCallActive={isCallActive}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border/80 px-4 md:px-6 flex items-center justify-between shrink-0 bg-card/40 backdrop-blur-md">
          {/* Left: Mobile branding or Desktop Breadcrumbs */}
          <div className="flex items-center gap-3">
            <div className="md:hidden size-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
              <Radio className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-semibold text-foreground tracking-tight">
                  {currentMeta.title}
                </h2>
                {isCallActive && currentTab === 'session' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="hidden md:block text-[11px] text-muted-foreground">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Status Pill & Theme Switcher on Mobile */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/60 border border-border/80 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>FastAPI Connected</span>
            </div>
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          isCallActive={isCallActive}
        />
      </div>
    </div>
  );
}
