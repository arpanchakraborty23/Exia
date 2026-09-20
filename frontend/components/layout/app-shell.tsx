'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight, PanelLeftClose, PanelLeftOpen, ShieldCheck, Wifi } from 'lucide-react';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/shadcn/utils';
import { MobileNav } from './mobile-nav';
import { NavTab, Sidebar } from './sidebar';

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
    subtitle: 'Configure remote SSE tool servers with 1-click catalog (Remote MCP supported)',
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

export function AppShell({ currentTab, onSelectTab, isCallActive, children }: AppShellProps) {
  const { user } = useAuth();
  const currentMeta = TAB_TITLES[currentTab];
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Restore sidebar state from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('exia_sidebar_open');
      if (saved !== null) {
        setIsSidebarOpen(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('exia_sidebar_open', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Global Keyboard Shortcuts (⌘1 through ⌘6 and ⌘B to toggle navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          onSelectTab('session');
        } else if (e.key === '2') {
          e.preventDefault();
          onSelectTab('history');
        } else if (e.key === '3') {
          e.preventDefault();
          onSelectTab('mcp');
        } else if (e.key === '4') {
          e.preventDefault();
          onSelectTab('prompts');
        } else if (e.key === '5') {
          e.preventDefault();
          onSelectTab('models');
        } else if (e.key === '6') {
          e.preventDefault();
          onSelectTab('settings');
        } else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          toggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectTab]);

  return (
    <div className="bg-background text-foreground bg-tactical-grid relative flex h-screen w-screen overflow-hidden font-sans antialiased">
      {/* Desktop Sidebar with smooth collapse transition */}
      <div
        className={cn(
          'relative z-30 hidden shrink-0 overflow-hidden transition-all duration-300 ease-in-out md:block',
          isSidebarOpen ? 'w-72 opacity-100' : 'pointer-events-none w-0 opacity-0'
        )}
      >
        <Sidebar
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          isCallActive={isCallActive}
          isCollapsed={!isSidebarOpen}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Hover Arrow Trigger: reveals and expands navigation on hover when hidden */}
      {!isSidebarOpen && (
        <div
          className="group fixed top-0 bottom-0 left-0 z-40 hidden w-5 cursor-pointer items-center justify-start transition-all duration-200 hover:w-16 md:flex"
          onClick={toggleSidebar}
          title="Expand navigation (⌘B)"
        >
          {/* Subtle GN conduit indicator line on edge */}
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500/20 via-emerald-500/70 to-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all group-hover:w-1.5" />

          {/* Floating Hover Arrow Tab */}
          <button
            type="button"
            className="bg-card/95 ml-1 flex cursor-pointer items-center gap-1.5 rounded-r-xl border-y border-r border-emerald-500/40 p-2 text-emerald-600 opacity-80 shadow-xl shadow-emerald-500/15 backdrop-blur-md transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 dark:text-emerald-400"
          >
            <ChevronRight className="size-4 animate-pulse" />
            <span className="text-foreground hidden pr-1 font-mono text-[10px] font-bold tracking-wider uppercase group-hover:inline">
              Menu
            </span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-radial-gradient flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="border-border bg-card/75 z-20 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-xl transition-colors md:px-6">
          {/* Left: Sidebar Toggle + Title info */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Desktop Navigation Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarOpen ? 'Hide navigation (⌘B)' : 'Show navigation (⌘B)'}
              aria-label={isSidebarOpen ? 'Hide navigation' : 'Show navigation'}
              className="border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground hidden size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs transition-colors md:flex"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4 text-emerald-500" />
              )}
            </button>

            {/* Mobile Logo */}
            <div className="size-8 shrink-0 overflow-hidden rounded-lg border border-emerald-500/30 md:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/exia-logo.jpg" alt="Exia" className="size-full object-cover" />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="bg-muted text-muted-foreground border-border hidden rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold sm:inline">
                  {currentMeta.code}
                </span>
                <h2 className="text-foreground truncate text-sm font-semibold tracking-tight md:text-base">
                  {currentMeta.title}
                </h2>
                {isCallActive && currentTab === 'session' && (
                  <span className="inline-flex shrink-0 animate-pulse items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                    TRANSMITTING
                  </span>
                )}
              </div>
              <p className="text-muted-foreground hidden truncate text-[11px] md:block">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Telemetry Badges & Theme Toggle */}
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
            <div className="bg-card border-border text-muted-foreground hidden items-center gap-3 rounded-xl border px-3 py-1.5 font-mono text-[11px] shadow-xs lg:flex">
              <div className="flex items-center gap-1.5">
                <Wifi className="size-3.5 text-emerald-500" />
                <span>WebRTC: 24ms</span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>FastAPI REST: Active</span>
              </div>
            </div>

            {/* Global Theme Switch: prominently placed in top header */}
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Screen View */}
        <main className="relative flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>

        {/* Mobile Floating Bottom Dock */}
        <MobileNav currentTab={currentTab} onSelectTab={onSelectTab} isCallActive={isCallActive} />
      </div>
    </div>
  );
}
