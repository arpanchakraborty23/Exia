import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  Bot,
  User,
  Radio,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { AgentStatus, ChatMessage, LiveKitConfig } from '../types';

interface VoiceAssistantViewProps {
  agentStatus: AgentStatus;
  setAgentStatus: (status: AgentStatus) => void;
  isLiveKitConnected: boolean;
  onToggleVoice: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  liveKitConfig: LiveKitConfig;
}

export const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  agentStatus,
  setAgentStatus,
  isLiveKitConnected,
  onToggleVoice,
  messages,
  onSendMessage,
  liveKitConfig,
}) => {
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    'What tasks are on my schedule today?',
    'Summarize my stored habits and preferences',
    'Test local filesystem MCP server',
    'Add a reminder to stretch in 30 minutes',
  ];

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6 p-6 overflow-hidden">
      {/* Left: Interactive Voice Visualizer Stage */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
          <div
            className={`w-96 h-96 rounded-full blur-3xl transition-all duration-700 ${
              agentStatus === 'speaking'
                ? 'bg-emerald-500/40 scale-125'
                : agentStatus === 'listening'
                ? 'bg-blue-500/30 scale-110'
                : agentStatus === 'thinking'
                ? 'bg-amber-500/30 scale-100'
                : 'bg-indigo-500/20 scale-90'
            }`}
          />
        </div>

        {/* Top Info Bar */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLiveKitConnected ? 'bg-emerald-400' : 'bg-zinc-500'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLiveKitConnected ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
              />
            </span>
            <span className="text-xs font-medium text-zinc-300">
              {isLiveKitConnected ? `LiveKit Room: ${liveKitConfig.roomName}` : 'Standby Mode'}
            </span>
          </div>

          <div className="text-xs text-zinc-500 font-mono">
            {liveKitConfig.serverUrl}
          </div>
        </div>

        {/* Central Voice Orb & Waveform Simulation */}
        <div className="my-auto flex flex-col items-center justify-center z-10">
          {/* Animated AI Core Orb */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Outer pulsating rings */}
            <div
              className={`absolute w-56 h-56 rounded-full border border-dashed transition-all duration-1000 ${
                agentStatus === 'speaking'
                  ? 'border-emerald-500/40 animate-spin'
                  : agentStatus === 'listening'
                  ? 'border-blue-500/40 animate-pulse'
                  : 'border-zinc-700/40'
              }`}
            />
            <div
              className={`absolute w-44 h-44 rounded-full border transition-all duration-700 ${
                agentStatus === 'speaking'
                  ? 'border-emerald-400/30 scale-110'
                  : agentStatus === 'listening'
                  ? 'border-blue-400/30 scale-105'
                  : 'border-zinc-800'
              }`}
            />

            {/* Main Orb */}
            <button
              onClick={onToggleVoice}
              title={isLiveKitConnected ? 'Click to disconnect' : 'Click to start voice'}
              className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 cursor-pointer ${
                agentStatus === 'speaking'
                  ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 shadow-emerald-500/50 scale-105'
                  : agentStatus === 'listening'
                  ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 shadow-blue-500/50 scale-100 animate-pulse'
                  : agentStatus === 'thinking'
                  ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 shadow-amber-500/50'
                  : 'bg-gradient-to-tr from-zinc-800 via-zinc-700 to-zinc-900 border border-zinc-700 shadow-zinc-900/50 hover:scale-105'
              }`}
            >
              {agentStatus === 'speaking' ? (
                <Volume2 className="w-10 h-10 text-white animate-bounce" />
              ) : agentStatus === 'listening' ? (
                <Mic className="w-10 h-10 text-white" />
              ) : agentStatus === 'thinking' ? (
                <Sparkles className="w-10 h-10 text-white animate-spin" />
              ) : (
                <Radio className="w-10 h-10 text-zinc-300" />
              )}
            </button>
          </div>

          {/* Audio Bar Visualizer (LiveKit Components style) */}
          <div className="flex items-center gap-1.5 h-12 px-6 py-2 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            {[40, 65, 85, 30, 95, 55, 75, 45, 90, 60, 35, 80, 50, 70, 40].map((height, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  agentStatus === 'speaking'
                    ? 'bg-gradient-to-t from-emerald-500 to-cyan-300'
                    : agentStatus === 'listening'
                    ? 'bg-gradient-to-t from-blue-500 to-indigo-300'
                    : 'bg-zinc-700'
                }`}
                style={{
                  height:
                    agentStatus === 'speaking'
                      ? `${Math.max(12, Math.sin(Date.now() / 200 + i) * 35 + 20)}px`
                      : agentStatus === 'listening'
                      ? `${Math.max(8, (i % 3 + 1) * 8)}px`
                      : '6px',
                }}
              />
            ))}
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-sm font-semibold text-zinc-200 capitalize">
              {agentStatus === 'speaking'
                ? 'Assistant is speaking...'
                : agentStatus === 'listening'
                ? 'Listening to your voice...'
                : agentStatus === 'thinking'
                ? 'Thinking & query processing...'
                : 'Assistant is on standby'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              {isLiveKitConnected
                ? 'WebRTC audio channel active. Speak naturally or type below.'
                : 'Click the orb or "Start LiveKit Voice" to connect your microphone.'}
            </p>
          </div>
        </div>

        {/* Bottom Audio Controls */}
        <div className="w-full flex items-center justify-center gap-3 z-10">
          <button
            onClick={() => setIsMuted(!isMuted)}
            disabled={!isLiveKitConnected}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
              isMuted
                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700 disabled:opacity-40'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'Muted' : 'Mic Active'}</span>
          </button>

          {/* Simulate Status Transitions */}
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-950/80 px-2 py-1.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-400">
            <span className="text-zinc-500">Simulate:</span>
            <button
              onClick={() => setAgentStatus('listening')}
              className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-zinc-200"
            >
              Listen
            </button>
            <button
              onClick={() => setAgentStatus('thinking')}
              className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-zinc-200"
            >
              Think
            </button>
            <button
              onClick={() => setAgentStatus('speaking')}
              className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-zinc-200"
            >
              Speak
            </button>
            <button
              onClick={() => setAgentStatus('disconnected')}
              className="px-2 py-0.5 rounded hover:bg-zinc-800 hover:text-zinc-200"
            >
              Idle
            </button>
          </div>
        </div>
      </div>

      {/* Right: Live Transcript & Interaction Log */}
      <div className="w-full xl:w-[460px] flex flex-col h-full rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm overflow-hidden">
        {/* Transcript Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Live Transcript & MCP Log
            </h2>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {messages.length} exchanges
          </span>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed space-y-1.5 ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-zinc-900/80 text-zinc-200 border border-zinc-800 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Tool Call Inspection Badge */}
                  {msg.toolCall && (
                    <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                      <div className="flex items-center gap-1 text-purple-400 font-mono">
                        <Wrench className="w-3 h-3" />
                        <span>MCP Tool: {msg.toolCall.tool}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 bg-zinc-950/60 p-1.5 rounded font-mono">
                        Result: {msg.toolCall.result}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] flex items-center justify-end gap-1 ${
                      isUser ? 'text-indigo-200' : 'text-zinc-500'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    <CheckCircle2 className="w-2.5 h-2.5 opacity-60" />
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 border-t border-zinc-800/50 bg-zinc-950/20 overflow-x-auto flex gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              className="text-[11px] whitespace-nowrap px-3 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message or ask assistant..."
            className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
