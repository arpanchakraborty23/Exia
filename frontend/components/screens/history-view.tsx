'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  History,
  Clock,
  MessageSquare,
  Cpu,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
  Calendar,
  Sparkles,
  User as UserIcon,
  Bot,
  Play,
  Pause,
  Search,
  SlidersHorizontal,
  Volume2,
  Terminal,
  Layers,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SessionSummary, SessionDetail } from '@/lib/types';

export function HistoryView() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<'all' | 'gemini' | 'modular'>('all');

  // Detail Modal / Drawer
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Audio Playback Simulation State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const fetchSessions = async (pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.sessions.getSessions(pageNum, 10);
      setSessions(data.sessions || []);
      setTotal(data.total || data.sessions?.length || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(page);
  }, [page]);

  // Handle audio simulation playback
  useEffect(() => {
    let timer: any;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 2;
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio]);

  const handleOpenDetail = async (id: string) => {
    setSelectedSessionId(id);
    setIsLoadingDetail(true);
    setIsPlayingAudio(false);
    setAudioProgress(0);
    try {
      const detail = await api.sessions.getSessionById(id);
      setSessionDetail(detail);
    } catch (err: any) {
      console.error('Failed to load detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSessionId(null);
    setSessionDetail(null);
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`;
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.room_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.preview_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModel =
        modelFilter === 'all' ||
        (modelFilter === 'gemini' && (s.model_used || '').toLowerCase().includes('gemini')) ||
        (modelFilter === 'modular' && !(s.model_used || '').toLowerCase().includes('gemini'));

      return matchesSearch && matchesModel;
    });
  }, [sessions, searchQuery, modelFilter]);

  // Aggregate Metrics for Bento Grid
  const totalDurationMinutes = useMemo(() => {
    const totalSecs = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
    return Math.round(totalSecs / 60);
  }, [sessions]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-mono">
              SESSION HISTORY & TELEMETRY
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30">
              LOG ARCHIVE
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Complete transcript audit trails, WebRTC audio metrics, and autonomous MCP tool logs.
          </p>
        </div>

        <button
          onClick={() => fetchSessions(page)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-zinc-200 text-xs font-medium border border-white/[0.08] transition-all hover:border-emerald-500/30 self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Bento Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Total Sessions</span>
            <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <History className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {total || sessions.length}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">Autonomous missions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Voice Airtime</span>
            <div className="size-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {totalDurationMinutes} <span className="text-sm font-normal text-zinc-400">mins</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">48kHz Opus streamed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Avg TTFT Latency</span>
            <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            185 <span className="text-sm font-normal text-zinc-400">ms</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 font-mono mt-1">Near real-time response</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">MCP Tool Actions</span>
            <div className="size-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Cpu className="size-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            48 <span className="text-sm font-normal text-zinc-400">calls</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">100% execution rate</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search transcripts, rooms, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0e17] border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto w-full sm:w-auto justify-end">
          <span className="text-[11px] font-mono text-zinc-500 mr-1 hidden md:inline">Model:</span>
          {(['all', 'gemini', 'modular'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModelFilter(m)}
              className={`text-xs px-2.5 py-1 rounded-lg font-mono transition-all ${
                modelFilter === m
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/[0.03] text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {m === 'all' ? 'All Engines' : m === 'gemini' ? 'Gemini Live' : 'Modular'}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
          <button
            onClick={() => fetchSessions(page)}
            className="ml-auto underline font-mono text-xs cursor-pointer text-rose-300 hover:text-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 rounded-2xl bg-white/[0.02] animate-pulse border border-white/[0.06]"
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01] space-y-3">
          <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <History className="size-6" />
          </div>
          <h3 className="font-semibold text-white">No sessions found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search term or clearing the model filter.'
              : 'Launch a voice conversation from the Voice Stage to populate session recordings and telemetry.'}
          </p>
        </div>
      ) : (
        /* Sessions List */
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenDetail(session.id)}
              className="group p-4 md:p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.07] hover:border-emerald-500/30 shadow-sm transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-white group-hover:text-emerald-300 font-mono transition-colors">
                    {session.room_name || session.id}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/20">
                    {session.model_used || 'Gemini 2.0 Flash'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                      session.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                        : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                    }`}
                  >
                    {session.status.toUpperCase()}
                  </span>
                </div>

                {session.preview_text && (
                  <p className="text-xs text-zinc-400 line-clamp-1 italic">
                    "{session.preview_text}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3 text-zinc-400" />
                    {formatDate(session.started_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-zinc-400" />
                    {formatDuration(session.duration_seconds)}
                  </span>
                  {session.message_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3 text-zinc-400" />
                      {session.message_count} turns
                    </span>
                  )}
                  {/* Decorative Simulated Audio Waveform */}
                  <div className="hidden md:flex items-center gap-0.5 h-3">
                    {[40, 70, 30, 90, 60, 80, 45, 100, 50, 75, 30].map((h, i) => (
                      <span
                        key={i}
                        className="w-0.5 bg-emerald-500/30 group-hover:bg-emerald-400 transition-colors rounded-full"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="text-xs font-mono font-semibold text-emerald-400 hidden sm:inline group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Telemetry Details
                  <ArrowUpRight className="size-3.5" />
                </span>
                <ChevronRight className="size-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {total > 10 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          <span className="text-xs font-mono text-zinc-500">
            Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} missions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.08]"
            >
              Previous
            </button>
            <span className="text-xs font-mono text-emerald-400 px-2">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 10 >= total}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.08]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Slide-out Drawer / Modal */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#080b12] border-l border-white/[0.1] h-full flex flex-col shadow-2xl overflow-hidden relative">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Terminal className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>{sessionDetail?.room_name || selectedSessionId}</span>
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-500">
                    ID: {selectedSessionId} • {formatDate(sessionDetail?.started_at || '')}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDetail}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Audio Simulation Scrub Bar */}
            <div className="p-4 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-4">
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="size-9 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:bg-emerald-400 transition-colors shadow-[0_0_10px_#10b981] shrink-0"
              >
                {isPlayingAudio ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Volume2 className="size-3 text-emerald-400" />
                    WebRTC Audio Stream (Opus 48kHz)
                  </span>
                  <span>{Math.floor((audioProgress * 45) / 100)}s / 45s</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-200 shadow-[0_0_6px_#10b981]"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {isLoadingDetail ? (
                <div className="space-y-4 py-8">
                  <div className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
                  <div className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />
                  <div className="h-40 rounded-xl bg-white/[0.03] animate-pulse" />
                </div>
              ) : sessionDetail ? (
                <>
                  {/* Telemetry Summary Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="text-[10px] font-mono text-zinc-500">Duration</div>
                      <div className="text-sm font-bold font-mono text-white mt-1">
                        {formatDuration(sessionDetail.duration_seconds)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="text-[10px] font-mono text-zinc-500">Intelligence Engine</div>
                      <div className="text-sm font-bold font-mono text-emerald-400 mt-1 truncate">
                        {sessionDetail.model_used || 'Gemini 2.0'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="text-[10px] font-mono text-zinc-500">Status</div>
                      <div className="text-sm font-bold font-mono text-teal-400 mt-1 uppercase">
                        {sessionDetail.status}
                      </div>
                    </div>
                  </div>

                  {/* MCP Tool Actions Executed */}
                  {sessionDetail.mcp_calls && sessionDetail.mcp_calls.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-300">
                        <Cpu className="size-3.5 text-emerald-400" />
                        <span>MCP Autonomous Actions ({sessionDetail.mcp_calls.length})</span>
                      </div>
                      <div className="space-y-2">
                        {sessionDetail.mcp_calls.map((call, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#0e131d] border border-white/[0.08] space-y-2 text-xs font-mono"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-400">{call.tool_name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {call.server_name || 'mcp-server'}
                              </span>
                            </div>
                            {call.arguments && (
                              <pre className="p-2 rounded-lg bg-black/60 text-[10px] text-zinc-400 overflow-x-auto">
                                {typeof call.arguments === 'string'
                                  ? call.arguments
                                  : JSON.stringify(call.arguments, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conversation Transcript Turns */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-300">
                      <MessageSquare className="size-3.5 text-emerald-400" />
                      <span>Dialogue Transcript Turns ({sessionDetail.messages?.length || 0})</span>
                    </div>

                    {!sessionDetail.messages || sessionDetail.messages.length === 0 ? (
                      <div className="p-6 text-center text-xs font-mono text-zinc-500 border border-dashed border-white/[0.08] rounded-xl">
                        No text messages logged for this voice transmission.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sessionDetail.messages.map((msg, idx) => {
                          const isUser = msg.role === 'user';
                          return (
                            <div
                              key={idx}
                              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                              {!isUser && (
                                <div className="size-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                                  <Bot className="size-4" />
                                </div>
                              )}

                              <div
                                className={`max-w-[80%] p-3.5 rounded-2xl text-xs space-y-1 ${
                                  isUser
                                    ? 'bg-emerald-500/15 text-zinc-100 border border-emerald-500/30 rounded-tr-xs'
                                    : 'bg-white/[0.04] text-zinc-200 border border-white/[0.08] rounded-tl-xs'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4 text-[10px] font-mono text-zinc-500">
                                  <span>{isUser ? 'OPERATOR' : 'EXIA GN-001'}</span>
                                  {msg.timestamp && <span>{formatDate(msg.timestamp)}</span>}
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              </div>

                              {isUser && (
                                <div className="size-7 rounded-lg bg-white/[0.08] border border-white/[0.1] flex items-center justify-center shrink-0 text-zinc-400">
                                  <UserIcon className="size-4" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
