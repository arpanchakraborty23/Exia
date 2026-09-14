import React from 'react';
import { Mic, MicOff, Database, Cpu, Radio, ShieldCheck, Sparkles, Brain } from 'lucide-react';
import { AgentStatus } from '../types';

interface NavbarProps {
  agentStatus: AgentStatus;
  isLiveKitConnected: boolean;
  onToggleVoice: () => void;
  mcpServerCount: number;
  memoryCount: number;
  taskCount: number;
  selectedModel?: string;
  memoryEngine?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  agentStatus,
  isLiveKitConnected,
  onToggleVoice,
  mcpServerCount,
  memoryCount,
  taskCount,
  selectedModel = 'llama3.2:latest',
  memoryEngine = 'mem0',
}) => {
  const getStatusBadge = () => {
    switch (agentStatus) {
      case 'speaking':
        return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', text: 'Speaking' };
      case 'listening':
        return { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40', text: 'Listening' };
      case 'thinking':
        return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', text: 'Thinking' };
      case 'connecting':
        return { bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40', text: 'Connecting' };
      default:
        return { bg: 'bg-zinc-800 text-zinc-400 border-zinc-700', text: 'Standby' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-base text-zinc-100 tracking-tight">HomeAssistant</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Desktop AI
            </span>
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            100% Private Local Core
          </p>
        </div>
      </div>

      {/* Center Status Badges */}
      <div className="hidden lg:flex items-center gap-2.5">
        {/* Model Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>LLM: {selectedModel}</span>
        </div>

        {/* Mem0 Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-300 text-xs font-mono font-medium">
          <Brain className="w-3.5 h-3.5 text-pink-400" />
          <span>{memoryEngine.toUpperCase()} ({memoryCount})</span>
        </div>

        {/* LiveKit Voice Status */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${statusBadge.bg}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              agentStatus === 'speaking'
                ? 'bg-emerald-400 animate-ping'
                : agentStatus === 'listening'
                ? 'bg-blue-400 animate-pulse'
                : agentStatus === 'thinking'
                ? 'bg-amber-400 animate-spin'
                : 'bg-zinc-500'
            }`}
          />
          <span>LiveKit: {statusBadge.text}</span>
        </div>

        {/* MongoDB Atlas DB Status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>MongoDB Atlas</span>
          <span className="text-[11px] text-zinc-400 ml-1">({taskCount} tasks)</span>
        </div>

        {/* MCP Server Count */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs font-medium">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>MCP: {mcpServerCount} Servers</span>
        </div>
      </div>

      {/* Voice Toggle Action Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleVoice}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer ${
            isLiveKitConnected
              ? 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
          }`}
        >
          {isLiveKitConnected ? (
            <>
              <MicOff className="w-4 h-4 text-red-400" />
              <span>Disconnect Voice</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Start LiveKit Voice</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
