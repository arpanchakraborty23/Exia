import React from 'react';
import { Mic, CheckSquare, Brain, Blocks, Key, Settings } from 'lucide-react';

export type TabType = 'voice' | 'tasks' | 'memory' | 'mcp' | 'token' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingTasksCount: number;
  memoryCount: number;
  mcpServerCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingTasksCount,
  memoryCount,
  mcpServerCount,
}) => {
  const navItems = [
    {
      id: 'voice' as TabType,
      label: 'LiveKit Voice',
      icon: Mic,
      description: 'Real-time Voice AI',
    },
    {
      id: 'tasks' as TabType,
      label: 'Daily Tasks',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      description: 'Agenda & Todo List',
    },
    {
      id: 'memory' as TabType,
      label: 'Memory Bank',
      icon: Brain,
      badge: memoryCount,
      description: 'Context & Knowledge',
    },
    {
      id: 'mcp' as TabType,
      label: 'MCP Servers',
      icon: Blocks,
      badge: mcpServerCount,
      description: 'Tools & Integrations',
    },
    {
      id: 'token' as TabType,
      label: 'Token Studio',
      icon: Key,
      description: 'In-UI LiveKit Tokens',
    },
    {
      id: 'settings' as TabType,
      label: 'System & Models',
      icon: Settings,
      description: 'LiveKit & Local LLM',
    },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950/50 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                  : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium leading-none">{item.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">{item.description}</div>
                </div>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-indigo-500/30 text-indigo-300'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Footnote */}
      <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Local Privacy</span>
          <span className="text-emerald-400 font-medium">Active</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Audio Latency</span>
          <span className="text-zinc-300 font-mono">~180ms</span>
        </div>
        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
          <div className="bg-indigo-500 h-full w-3/4 rounded-full" />
        </div>
      </div>
    </aside>
  );
};
