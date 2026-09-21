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
      <nav className="border-border bg-card/95 flex items-center justify-around rounded-2xl border px-2 py-1.5 shadow-2xl shadow-black/20 backdrop-blur-2xl">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isVoice = item.id === 'session';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl px-2.5 py-1.5 transition-all duration-150 ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`size-5 transition-colors ${
                    isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(31,213,249,0.55)]' : ''
                  }`}
                />
                {/* Session live dot — emerald = functional status */}
                {isVoice && isCallActive && (
                  <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                )}
              </div>
              <span className="mt-0.5 font-mono text-[9px] tracking-wide">{item.label}</span>
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -bottom-0.5 size-1 rounded-full bg-primary shadow-[0_0_5px_rgba(31,213,249,0.7)]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
