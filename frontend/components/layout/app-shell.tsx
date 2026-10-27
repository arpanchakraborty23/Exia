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

const TAB_TITLES: Record<NavTab, string> = {
  session:   'Voice Session',
  history:   'Session History',
  analytics: 'Analytics & Observability',
  mcp:       'MCP Registry',
  prompts:   'Prompts',
  models:    'Model Engine',
  settings:  'Settings',
};

export function AppShell({ currentTab, onSelectTab, isCallActive, children }: AppShellProps) {
  const title = TAB_TITLES[currentTab];
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('exia_sidebar_open');
      if (saved !== null) setIsSidebarOpen(saved === 'true');
    } catch { /* ignore */ }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem('exia_sidebar_open', String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const shortcuts: Record<string, NavTab> = {
          '1': 'session', '2': 'history', '3': 'analytics',
          '4': 'mcp',     '5': 'prompts', '6': 'models',
          '7': 'settings',
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
    <div className="bg-background text-foreground relative flex h-screen w-screen overflow-hidden antialiased">
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
          className="group fixed top-0 bottom-0 left-0 z-40 hidden w-4 cursor-pointer items-center justify-start transition-all duration-200 hover:w-14 md:flex"
          onClick={toggleSidebar}
          title="Show navigation (⌘B)"
        >
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />
          <button
            type="button"
            className="border-border bg-card/90 text-muted-foreground ml-0.5 flex cursor-pointer items-center gap-1 rounded-r-xl border-y border-r p-2 opacity-60 shadow-xl backdrop-blur-xl transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-ambient-bloom flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-border bg-card/60 z-20 flex h-12 shrink-0 items-center justify-between border-b px-4 backdrop-blur-xl transition-colors md:px-5">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              title={isSidebarOpen ? 'Hide navigation (⌘B)' : 'Show navigation (⌘B)'}
              aria-label={isSidebarOpen ? 'Hide navigation' : 'Show navigation'}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent hidden size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors md:flex"
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
              <h2 className="text-foreground/70 truncate text-sm font-medium">{title}</h2>
              {isCallActive && currentTab === 'session' && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                  <span className="size-1 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="text-muted-foreground hidden items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] lg:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Connected</span>
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
