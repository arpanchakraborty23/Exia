'use client';

import React from 'react';
import { Cpu, FileText, History, Mic, Settings as SettingsIcon, Sliders } from 'lucide-react';
import { cn } from '@/lib/shadcn/utils';
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
  { id: 'session', label: 'Voice',    icon: Mic },
  { id: 'history', label: 'History',  icon: History },
  { id: 'mcp',     label: 'MCP',      icon: Cpu },
  { id: 'prompts', label: 'Prompts',  icon: FileText },
  { id: 'models',  label: 'Models',   icon: Sliders },
  { id: 'settings',label: 'Settings', icon: SettingsIcon },
];

export function MobileNav({ currentTab, onSelectTab, isCallActive }: MobileNavProps) {
  return (
    <div className="fixed right-3 bottom-3 left-3 z-40 md:hidden">
      <nav className="border-border bg-card/90 flex items-center justify-around rounded-2xl border px-1 py-1.5 shadow-2xl shadow-black/30 backdrop-blur-2xl">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isVoice = item.id === 'session';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-2 text-[10px] transition-all duration-150',
                isActive
                  ? 'text-primary bg-primary/8'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className="size-5" />
                {isVoice && isCallActive && (
                  <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
