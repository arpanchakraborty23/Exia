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

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'session', label: 'Voice Session', icon: Mic },
  { id: 'history', label: 'History', icon: History },
  { id: 'mcp', label: 'MCP Servers', icon: Cpu },
  { id: 'prompts', label: 'Prompts', icon: FileText },
  { id: 'models', label: 'Model Selection', icon: Sliders },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ currentTab, onSelectTab, isCallActive }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-md h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Radio className="size-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-foreground">Home Assistant</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              <span className="text-[11px] text-muted-foreground font-medium">LiveKit + Gemini</span>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Assistant Control Hub
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isSession = item.id === 'session';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`size-4.5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </div>
              {isSession && isCallActive && (
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-border mt-auto bg-muted/20">
        <div className="flex items-center justify-between p-2 rounded-lg bg-card/80 border border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserIcon className="size-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-foreground truncate">{user?.name || 'Home Owner'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'admin@home.local'}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
