'use client';

import React from 'react';
import {
  Mic,
  History,
  Cpu,
  FileText,
  Sliders,
  Settings as SettingsIcon,
  LogOut,
  Radio,
  Zap,
  Activity,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/app/theme-toggle';

export type NavTab = 'session' | 'history' | 'mcp' | 'prompts' | 'models' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCallActive?: boolean;
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
    items: [
      { id: 'session', label: 'Voice Stage', badge: 'LIVE', shortcut: '⌘1', icon: Mic },
    ],
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
    items: [
      { id: 'settings', label: 'Configuration', shortcut: '⌘6', icon: SettingsIcon },
    ],
  },
];

export function Sidebar({ currentTab, onSelectTab, isCallActive }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-72 border-r border-white/[0.08] bg-[#07090e]/95 backdrop-blur-2xl h-screen select-none shrink-0 z-30 relative">
      {/* Brand Header with GN Conduit effect */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between relative overflow-hidden">
        <div className="absolute -top-10 -left-10 size-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative size-10 rounded-xl overflow-hidden border border-emerald-500/40 shadow-lg shadow-emerald-500/20 shrink-0 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/exia-logo.jpg"
              alt="Exia GN-001"
              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 border-2 border-[#07090e] shadow-[0_0_8px_#10b981]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-white font-mono">EXIA</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                GN-001
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shadow-[0_0_6px_#10b981]" />
              <span className="text-[11px] text-zinc-400 font-mono tracking-tight">
                Autonomous Voice AI
              </span>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* GN Drive Realtime Telemetry HUD */}
      <div className="px-3 pt-3">
        <div className="p-3 rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.07] relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                <Zap className="size-3 animate-pulse" />
              </div>
              <span className="text-[11px] font-semibold text-zinc-200 tracking-wide font-mono">GN DRIVE TACTICAL</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              100% SYNC
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/[0.05]">
            <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full rounded-full w-full shadow-[0_0_8px_#10b981]" />
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-zinc-500">
            <span>Particles: Pure GN</span>
            <span>Latency: &lt;180ms</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((sec) => (
          <div key={sec.group} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center justify-between">
              <span>{sec.group}</span>
              <Activity className="size-2.5 text-zinc-600" />
            </div>

            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isSession = item.id === 'session';

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.12)] font-semibold'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`size-4 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSession && isCallActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        LIVE
                      </span>
                    ) : item.badge ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold tracking-wider ${
                          isActive
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/[0.06] text-zinc-400 border border-white/[0.05]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : item.shortcut ? (
                      <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-500 transition-colors">
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
      <div className="p-3 border-t border-white/[0.08] mt-auto bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25">
              <UserIcon className="size-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name || 'Home Operator'}</p>
              <p className="text-[10px] font-mono text-zinc-500 truncate">{user?.email || 'admin@exia.local'}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
