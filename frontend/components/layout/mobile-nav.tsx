'use client';

import React from 'react';
import { Cpu, FileText, History, Mic, Settings as SettingsIcon, Sliders } from 'lucide-react';
import { NavTab } from './sidebar';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCallActive?: boolean;
}

const MOBILE_ITEMS: {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'session', label: 'Voice', icon: Mic },
  { id: 'history', label: 'History', icon: History },
  { id: 'mcp', label: 'MCP', icon: Cpu },
  { id: 'prompts', label: 'Prompts', icon: FileText },
  { id: 'models', label: 'Models', icon: Sliders },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function MobileNav({ currentTab, onSelectTab, isCallActive }: MobileNavProps) {
  return (
    <div className="fixed right-3 bottom-3 left-3 z-40 md:hidden">
      <nav className="bg-card/90 border-border text-card-foreground flex items-center justify-around rounded-2xl border px-2 py-1.5 shadow-2xl shadow-black/20 backdrop-blur-2xl">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isVoice = item.id === 'session';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl px-2.5 py-1 transition-all ${
                isActive
                  ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`size-5 transition-colors ${
                    isActive
                      ? 'text-emerald-600 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`}
                />
                {isVoice && isCallActive && (
                  <span className="absolute -top-1 -right-1 size-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                )}
              </div>
              <span className="mt-0.5 font-mono text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 size-1 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
