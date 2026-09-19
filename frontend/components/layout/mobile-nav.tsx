'use client';

import React from 'react';
import {
  Mic,
  History,
  Cpu,
  FileText,
  Sliders,
  Settings as SettingsIcon,
} from 'lucide-react';
import { NavTab } from './sidebar';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCallActive?: boolean;
}

const MOBILE_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'session', label: 'Voice', icon: Mic },
  { id: 'history', label: 'History', icon: History },
  { id: 'mcp', label: 'MCP', icon: Cpu },
  { id: 'prompts', label: 'Prompts', icon: FileText },
  { id: 'models', label: 'Models', icon: Sliders },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function MobileNav({ currentTab, onSelectTab, isCallActive }: MobileNavProps) {
  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
      <nav className="bg-[#0c101a]/90 backdrop-blur-2xl border border-white/[0.1] rounded-2xl px-2 py-1.5 flex items-center justify-around shadow-2xl shadow-black/80">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isVoice = item.id === 'session';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon className={`size-5 transition-colors ${isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-zinc-500'}`} />
                {isVoice && isCallActive && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-mono">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 size-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
