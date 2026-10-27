'use client';

import React from 'react';
import {
  BarChart3,
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
import { BackendStatus } from '@/components/app/backend-status';
import { cn } from '@/lib/shadcn/utils';

export type NavTab = 'session' | 'history' | 'analytics' | 'mcp' | 'prompts' | 'models' | 'settings';

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
    group: 'Voice',
    items: [{ id: 'session', label: 'Voice Session', shortcut: '⌘1', icon: Mic }],
  },
  {
    group: 'Intelligence',
    items: [
      { id: 'history', label: 'History', shortcut: '⌘2', icon: History },
      { id: 'analytics', label: 'Analytics', shortcut: '⌘3', icon: BarChart3 },
      { id: 'mcp', label: 'MCP Registry', shortcut: '⌘4', icon: Cpu },
      { id: 'prompts', label: 'Prompts', shortcut: '⌘5', icon: FileText },
      { id: 'models', label: 'Models', shortcut: '⌘6', icon: Sliders },
    ],
  },
  {
    group: 'System',
    items: [{ id: 'settings', label: 'Settings', shortcut: '⌘7', icon: SettingsIcon }],
  },
];

export function Sidebar({
  currentTab,
  onSelectTab,
  isCallActive,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border relative flex h-screen shrink-0 flex-col border-r select-none transition-[width] duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'border-sidebar-border flex h-14 items-center border-b px-3 py-2 transition-all',
          isCollapsed ? 'justify-center' : 'justify-between px-4'
        )}
      >
        {isCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand navigation (⌘B)"
            aria-label="Expand navigation"
            className="group relative flex size-9 items-center justify-center rounded-xl transition-transform hover:scale-105 active:scale-95"
          >
            <div className="relative size-8 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/exia-logo.jpg" alt="Exia" className="size-full object-cover" />
              <span className="border-sidebar absolute right-0 bottom-0 size-2 rounded-full border-2 bg-emerald-500" />
            </div>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="relative size-8 shrink-0 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/exia-logo.jpg" alt="Exia" className="size-full object-cover" />
                {/* Online indicator */}
                <span className="border-sidebar absolute right-0 bottom-0 size-2 rounded-full border-2 bg-emerald-500" />
              </div>
              <div>
                <span className="text-sidebar-foreground/90 text-sm font-semibold tracking-tight">
                  Exia
                </span>
                <p className="text-sidebar-foreground/40 mt-0.5 text-[11px]">Personal AI</p>
              </div>
            </div>

            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse to icons (⌘B)"
                aria-label="Collapse to icons"
                className="text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation Sections */}
      <div className={cn('flex-1 space-y-1 overflow-y-auto py-3', isCollapsed ? 'px-2' : 'px-2')}>
        {NAV_SECTIONS.map((sec, secIdx) => (
          <div key={sec.group}>
            {secIdx > 0 && (
              <div
                className={cn(
                  'border-sidebar-border border-t',
                  isCollapsed ? 'my-2 mx-1' : 'my-2'
                )}
              />
            )}

            {!isCollapsed && (
              <div className="mb-1 px-3 py-1">
                <span className="text-sidebar-foreground/35 text-[10px] font-medium tracking-wider uppercase">
                  {sec.group}
                </span>
              </div>
            )}

            <div className={cn('flex flex-col', isCollapsed ? 'gap-1.5' : 'gap-0.5')}>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isSession = item.id === 'session';

                if (isCollapsed) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      title={`${item.label} (${item.shortcut})`}
                      aria-label={item.label}
                      className={cn(
                        'group relative flex size-11 w-full cursor-pointer items-center justify-center rounded-xl transition-all duration-150',
                        isActive
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="bg-primary absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r" />
                      )}

                      <div className="relative flex items-center justify-center">
                        <Icon
                          className={cn(
                            'size-5 transition-transform duration-150 group-hover:scale-110',
                            isActive ? 'text-primary' : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
                          )}
                        />
                        {isSession && isCallActive && (
                          <span className="border-sidebar absolute -top-1 -right-1 size-2 rounded-full border-2 bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={cn(
                      'group relative flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150',
                      isActive
                        ? 'bg-white/6 text-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    {/* Active left bar */}
                    {isActive && (
                      <span className="bg-primary absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-r" />
                    )}

                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          'size-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-primary'
                            : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isSession && isCallActive ? (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                          <span className="size-1 animate-pulse rounded-full bg-emerald-500" />
                          Live
                        </span>
                      ) : item.shortcut ? (
                        <span className="text-sidebar-foreground/20 group-hover:text-sidebar-foreground/35 font-mono text-[10px] transition-colors">
                          {item.shortcut}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className={cn('border-sidebar-border border-t flex flex-col gap-2', isCollapsed ? 'p-2 items-center' : 'p-3')}>
        {!isCollapsed && (
          <div className="pb-1">
            <BackendStatus />
          </div>
        )}
        {isCollapsed && (
          <BackendStatus variant="minimal" />
        )}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold cursor-default"
              title={`${user?.name || 'Operator'} (${user?.email || 'admin@exia.local'})`}
            >
              {user?.name ? (
                user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              ) : (
                <UserIcon className="size-4" />
              )}
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              aria-label="Sign out"
              className="text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-500/10 flex size-9 items-center justify-center rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-xl px-2 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold">
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
              <div className="min-w-0">
                <p className="text-sidebar-foreground/80 truncate text-xs font-medium">
                  {user?.name || 'Operator'}
                </p>
                <p className="text-sidebar-foreground/35 truncate text-[10px]">
                  {user?.email || 'admin@exia.local'}
                </p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="text-sidebar-foreground/30 shrink-0 cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-red-500/8 hover:text-red-500"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
