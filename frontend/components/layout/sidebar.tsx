'use client';

import React from 'react';
import {
  Activity,
  ChevronLeft,
  Cpu,
  FileText,
  History,
  LogOut,
  Mic,
  Settings as SettingsIcon,
  Sliders,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export type NavTab = 'session' | 'history' | 'mcp' | 'prompts' | 'models' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCallActive?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavSection {
  group: string;
  items: {
    id: NavTab;
    label: string;
    badge?: string;
    shortcut?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    group: 'TACTICAL STAGE',
    items: [{ id: 'session', label: 'Voice Stage', badge: 'LIVE', shortcut: '⌘1', icon: Mic }],
  },
  {
    group: 'INTELLIGENCE CORE',
    items: [
      { id: 'history', label: 'Session History', shortcut: '⌘2', icon: History },
      { id: 'mcp', label: 'MCP Registry', badge: 'Tools', shortcut: '⌘3', icon: Cpu },
      { id: 'prompts', label: 'Directive Library', shortcut: '⌘4', icon: FileText },
      { id: 'models', label: 'Model Engine', shortcut: '⌘5', icon: Sliders },
    ],
  },
  {
    group: 'SYSTEM & SECURITY',
    items: [{ id: 'settings', label: 'Configuration', shortcut: '⌘6', icon: SettingsIcon }],
  },
];

export function Sidebar({
  currentTab,
  onSelectTab,
  isCallActive,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="border-sidebar-border bg-sidebar/95 text-sidebar-foreground relative z-30 flex h-screen w-72 shrink-0 flex-col border-r backdrop-blur-2xl transition-colors duration-200 select-none">
      {/* Brand Header with GN Conduit effect */}
      <div className="border-sidebar-border relative flex items-center justify-between overflow-hidden border-b p-4">
        <div className="pointer-events-none absolute -top-10 -left-10 size-28 rounded-full bg-emerald-500/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="group relative size-10 shrink-0 overflow-hidden rounded-xl border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/exia-logo.jpg"
              alt="Exia GN-001"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="border-background absolute right-0 bottom-0 size-2.5 rounded-full border-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-mono text-sm font-extrabold tracking-wider">
                EXIA
              </span>
              <span className="py-0.2 rounded border border-emerald-500/30 bg-emerald-500/15 px-1.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                GN-001
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              <span className="text-muted-foreground font-mono text-[11px] tracking-tight">
                Autonomous Voice AI
              </span>
            </div>
          </div>
        </div>

        {/* Collapse Navigation Arrow */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse navigation (⌘B)"
            aria-label="Collapse navigation"
            className="border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground group flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs transition-all duration-200 hover:border-emerald-500/40"
          >
            <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
        )}
      </div>

      {/* GN Drive Realtime Telemetry HUD */}
      <div className="px-3 pt-3">
        <div className="bg-card/80 border-border group relative overflow-hidden rounded-xl border p-3 shadow-xs dark:bg-gradient-to-b dark:from-white/[0.04] dark:to-white/[0.01]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Zap className="size-3 animate-pulse" />
              </div>
              <span className="text-foreground font-mono text-[11px] font-semibold tracking-wide">
                GN DRIVE TACTICAL
              </span>
            </div>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              100% SYNC
            </span>
          </div>

          {/* Progress bar */}
          <div className="bg-muted border-border h-1.5 w-full overflow-hidden rounded-full border p-0.5">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-[0_0_8px_#10b981]" />
          </div>

          <div className="text-muted-foreground mt-2 flex items-center justify-between font-mono text-[10px]">
            <span>Particles: Pure GN</span>
            <span>Latency: &lt;180ms</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {NAV_SECTIONS.map((sec) => (
          <div key={sec.group} className="space-y-1">
            <div className="text-muted-foreground flex items-center justify-between px-3 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase">
              <span>{sec.group}</span>
              <Activity className="size-2.5 opacity-60" />
            </div>

            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isSession = item.id === 'session';

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`group relative flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'border border-emerald-500/35 bg-emerald-500/15 font-semibold text-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.12)] dark:text-emerald-300'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`size-4 transition-colors ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSession && isCallActive ? (
                      <span className="flex animate-pulse items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        LIVE
                      </span>
                    ) : item.badge ? (
                      <span
                        className={`py-0.2 rounded px-1.5 font-mono text-[9px] font-bold tracking-wider uppercase ${
                          isActive
                            ? 'border border-emerald-500/30 bg-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground border-border border'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : item.shortcut ? (
                      <span className="text-muted-foreground/70 group-hover:text-muted-foreground font-mono text-[10px] transition-colors">
                        {item.shortcut}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Identity & Logout */}
      <div className="border-sidebar-border bg-card/60 mt-auto border-t p-3 backdrop-blur-md">
        <div className="bg-card border-border hover:border-border/80 flex items-center justify-between rounded-xl border p-2 shadow-xs transition-colors">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <UserIcon className="size-4" />
            </div>
            <div className="truncate">
              <p className="text-foreground truncate text-xs font-semibold">
                {user?.name || 'Home Operator'}
              </p>
              <p className="text-muted-foreground truncate font-mono text-[10px]">
                {user?.email || 'admin@exia.local'}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="text-muted-foreground cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-rose-500/10 hover:text-rose-500"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
