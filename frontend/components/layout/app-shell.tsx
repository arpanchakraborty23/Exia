'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './sidebar';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { ShieldCheck, Wifi, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/shadcn/utils';

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
        if (e.key === '1') { e.preventDefault(); onSelectTab('session'); }
        else if (e.key === '2') { e.preventDefault(); onSelectTab('history'); }
        else if (e.key === '3') { e.preventDefault(); onSelectTab('mcp'); }
        else if (e.key === '4') { e.preventDefault(); onSelectTab('prompts'); }
        else if (e.key === '5') { e.preventDefault(); onSelectTab('models'); }
        else if (e.key === '6') { e.preventDefault(); onSelectTab('settings'); }
        else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          toggleSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectTab]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased font-sans bg-tactical-grid relative">
      {/* Desktop Sidebar with smooth collapse transition */}
      <div
        className={cn(
          'hidden md:block transition-all duration-300 ease-in-out shrink-0 overflow-hidden relative z-30',
          isSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none'
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
          className="hidden md:flex fixed left-0 top-0 bottom-0 w-5 hover:w-16 z-40 items-center justify-start group cursor-pointer transition-all duration-200"
          onClick={toggleSidebar}
          title="Expand navigation (⌘B)"
        >
          {/* Subtle GN conduit indicator line on edge */}
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500/20 via-emerald-500/70 to-emerald-500/20 group-hover:w-1.5 transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
          
          {/* Floating Hover Arrow Tab */}
          <button
            type="button"
            className="ml-1 p-2 rounded-r-xl border-y border-r border-emerald-500/40 bg-card/95 text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/15 backdrop-blur-md opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronRight className="size-4 animate-pulse" />
            <span className="hidden group-hover:inline text-[10px] font-mono font-bold tracking-wider uppercase text-foreground pr-1">
              Menu
            </span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-radial-gradient min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-border px-4 md:px-6 flex items-center justify-between shrink-0 bg-card/75 backdrop-blur-xl z-20 transition-colors">
          {/* Left: Sidebar Toggle + Title info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Desktop Navigation Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarOpen ? "Hide navigation (⌘B)" : "Show navigation (⌘B)"}
              aria-label={isSidebarOpen ? "Hide navigation" : "Show navigation"}
              className="hidden md:flex size-8 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground items-center justify-center transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4 text-emerald-500" />
              )}
            </button>

            {/* Mobile Logo */}
            <div className="md:hidden size-8 rounded-lg overflow-hidden border border-emerald-500/30 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/exia-logo.jpg"
                alt="Exia"
                className="size-full object-cover"
              />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  {currentMeta.code}
                </span>
                <h2 className="text-sm md:text-base font-semibold text-foreground tracking-tight truncate">
                  {currentMeta.title}
                </h2>
                {isCallActive && currentTab === 'session' && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse shrink-0">
                    <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                    TRANSMITTING
                  </span>
                )}
              </div>
              <p className="hidden md:block text-[11px] text-muted-foreground truncate">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Telemetry Badges & Theme Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-card border border-border text-[11px] font-mono text-muted-foreground shadow-xs">
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
