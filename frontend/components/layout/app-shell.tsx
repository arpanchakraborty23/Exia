'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { cn } from '@/lib/shadcn/utils';
import { MobileNav } from './mobile-nav';
import { NavTab, Sidebar } from './sidebar';

interface AppShellProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCallActive?: boolean;
  children: React.ReactNode;
}

const TAB_TITLES: Record<NavTab, { title: string; code: string }> = {
  session: { title: 'Voice Stage' },
  history: { title: 'Session History' },
  mcp: { title: 'MCP Registry' },
  prompts: { title: 'Directive Library' },
  models: { title: 'Model Engine' },
  settings: { title: 'Configuration' },
};

export function AppShell({ currentTab, onSelectTab, isCallActive, children }: AppShellProps) {
  const currentMeta = TAB_TITLES[currentTab];
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('exia_sidebar_open');
      if (saved !== null) setIsSidebarOpen(saved === 'true');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('exia_sidebar_open', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const shortcuts: Record<string, NavTab> = {
          '1': 'session',
          '2': 'history',
          '3': 'mcp',
          '4': 'prompts',
          '5': 'models',
          '6': 'settings',
        };
        if (shortcuts[e.key]) {
          e.preventDefault();
          onSelectTab(shortcuts[e.key]);
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
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'relative z-30 hidden shrink-0 overflow-hidden transition-all duration-300 ease-in-out md:block',
          isSidebarOpen ? 'w-64 opacity-100' : 'pointer-events-none w-0 opacity-0'
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

      {/* Hover edge trigger when sidebar hidden */}
      {!isSidebarOpen && (
        <div
          className="group fixed top-0 bottom-0 left-0 z-40 hidden w-5 cursor-pointer items-center justify-start transition-all duration-200 hover:w-16 md:flex"
          onClick={toggleSidebar}
          title="Expand navigation (⌘B)"
        >
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/60 to-transparent transition-all group-hover:w-[2px] group-hover:shadow-[0_0_8px_rgba(31,213,249,0.35)]" />
          <button
            type="button"
            className="border-border bg-card text-primary ml-1 flex cursor-pointer items-center gap-1.5 rounded-r-xl border-y border-r p-2 opacity-70 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
          >
            <ChevronRight className="size-3.5" />
            <span className="text-foreground hidden pr-1 font-mono text-[10px] font-bold tracking-wider uppercase group-hover:inline">
              Nav
            </span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-radial-gradient flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header — uses CSS vars, theme-aware */}
        <header className="border-border bg-card/80 z-20 flex h-12 shrink-0 items-center justify-between border-b px-4 backdrop-blur-xl transition-colors md:px-5">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarOpen ? 'Hide navigation (⌘B)' : 'Show navigation (⌘B)'}
              aria-label={isSidebarOpen ? 'Hide navigation' : 'Show navigation'}
              className="border-border bg-accent text-muted-foreground hover:text-foreground hidden size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors md:flex"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="size-3.5" />
              ) : (
                <PanelLeftOpen className="text-primary size-3.5" />
              )}
            </button>

            {/* Mobile logo */}
            <div className="border-border size-7 shrink-0 overflow-hidden rounded-lg border md:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/exia-logo.jpg" alt="Exia" className="size-full object-cover" />
            </div>

            <div className="flex min-w-0 items-center gap-2.5">
              <span className="border-border bg-accent text-muted-foreground hidden shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase sm:inline">
                {currentMeta.code}
              </span>
              <h2 className="text-foreground/80 truncate font-mono text-sm font-semibold tracking-tight">
                {currentMeta.title}
              </h2>
              {/* LIVE badge — emerald is functional "connected" status, keep it */}
              {isCallActive && currentTab === 'session' && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
                  LIVE
                </span>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="border-border bg-accent text-muted-foreground hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[10px] lg:flex">
              <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
              <span>WebRTC · 24ms · FastAPI Active</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Screen content */}
        <main className="relative flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom dock */}
        <MobileNav currentTab={currentTab} onSelectTab={onSelectTab} isCallActive={isCallActive} />
      </div>
    </div>
  );
}
