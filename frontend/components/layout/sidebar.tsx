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
    group: 'STAGE',
    items: [{ id: 'session', label: 'Voice Session', badge: 'LIVE', shortcut: '⌘1', icon: Mic }],
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { id: 'history', label: 'History', shortcut: '⌘2', icon: History },
      { id: 'mcp', label: 'MCP Registry', badge: 'Tools', shortcut: '⌘3', icon: Cpu },
      { id: 'prompts', label: 'Directives', shortcut: '⌘4', icon: FileText },
      { id: 'models', label: 'Model Engine', shortcut: '⌘5', icon: Sliders },
    ],
  },
  {
    group: 'SYSTEM',
    items: [{ id: 'settings', label: 'Configuration', shortcut: '⌘6', icon: SettingsIcon }],
  },
];

export function Sidebar({ currentTab, onSelectTab, isCallActive, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border relative z-30 flex h-screen w-64 shrink-0 flex-col border-r backdrop-blur-2xl select-none">
      {/* Top blue accent line */}
      <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />

      {/* Brand Header */}
      <div className="border-sidebar-border relative flex items-center justify-between overflow-hidden border-b px-4 py-4">
        <div className="pointer-events-none absolute -top-6 -left-6 size-24 rounded-full bg-primary/8 blur-2xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-xl border border-primary/30 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/exia-logo.jpg" alt="Exia" className="size-full object-cover" />
            {/* Live indicator — emerald = connected status (functional) */}
            <span className="border-sidebar absolute right-0 bottom-0 size-2 rounded-full border-2 bg-emerald-500 shadow-[0_0_5px_#10b981]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black tracking-[0.2em]">EXIA</span>
              <span className="rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-primary uppercase">

              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
              <span className="text-sidebar-foreground/70 font-mono text-[10px] tracking-wide">
                Autonomous Voice AI
              </span>
            </div>
          </div>
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse navigation (⌘B)"
            aria-label="Collapse navigation"
            className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground/40 hover:text-sidebar-foreground flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        )}
      </div>

      {/* Telemetry strip */}
      <div className="px-4 pt-3">
        <div className="border-sidebar-border bg-sidebar-accent flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Activity className="size-3 text-primary/60" />
            <span className="text-sidebar-foreground/30 font-mono text-[10px]">GN DRIVE</span>
          </div>
          <div className="text-sidebar-foreground/30 flex items-center gap-2 font-mono text-[10px]">
            <span>
              Sync: <span className="text-primary">100%</span>
            </span>
            <span className="text-sidebar-border opacity-60">·</span>
            <span>{'<'}180ms</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((sec) => (
          <div key={sec.group} className="space-y-0.5">
            <div className="mb-1.5 flex items-center gap-2 px-3">
              <span className="text-sidebar-foreground/50 font-mono text-[9px] font-semibold tracking-[0.18em] uppercase">
                {sec.group}
              </span>
              <div className="border-sidebar-border h-px flex-1 border-t" />
            </div>

            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isSession = item.id === 'session';

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`group relative flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                >
                  {/* Active left accent bar */}
                  {isActive && (
                    <span className="absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-r bg-primary shadow-[0_0_8px_rgba(31,213,249,0.5)]" />
                  )}

                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`size-3.5 transition-colors ${isActive
                          ? 'text-primary'
                          : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
                        }`}
                    />
                    <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSession && isCallActive ? (
                      /* LIVE badge — emerald is functional status color, keep it */
                      <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-500">
                        <span className="size-1 animate-pulse rounded-full bg-emerald-500" />
                        LIVE
                      </span>
                    ) : item.badge ? (
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase ${isActive
                            ? 'border border-primary/25 bg-primary/10 text-primary'
                            : 'border-sidebar-border bg-sidebar-accent text-sidebar-foreground/30 border'
                          }`}
                      >
                        {item.badge}
                      </span>
                    ) : item.shortcut ? (
                      <span className="text-sidebar-foreground/20 group-hover:text-sidebar-foreground/35 font-mono text-[9px] transition-colors">
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

      {/* User Footer */}
      <div className="border-sidebar-border border-t p-3">
        <div className="border-sidebar-border bg-sidebar-accent flex items-center justify-between rounded-lg border p-2.5 transition-colors">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 font-mono text-[11px] font-bold text-primary">
              {user?.name ? (
                user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              ) : (
                <UserIcon className="size-3.5" />
              )}
            </div>
            <div className="truncate">
              <p className="text-sidebar-foreground truncate font-mono text-xs font-semibold">
                {user?.name || 'Home Operator'}
              </p>
              <p className="text-sidebar-foreground/35 truncate font-mono text-[10px]">
                {user?.email || 'admin@exia.local'}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="text-sidebar-foreground/30 shrink-0 cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
