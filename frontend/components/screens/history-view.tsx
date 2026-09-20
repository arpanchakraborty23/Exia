'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  History,
  Layers,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  User as UserIcon,
  Volume2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SessionDetail, SessionSummary } from '@/lib/types';

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
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      {/* Screen Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground font-mono text-xl font-extrabold tracking-tight md:text-2xl">
              SESSION HISTORY & TELEMETRY
            </h1>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
              LOG ARCHIVE
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Complete transcript audit trails, WebRTC audio metrics, and autonomous MCP tool logs.
          </p>
        </div>

        <button
          onClick={() => fetchSessions(page)}
          disabled={isLoading}
          className="bg-card/80 text-foreground border-border inline-flex items-center gap-2 self-start rounded-xl border px-3.5 py-2 text-xs font-medium transition-all hover:border-emerald-500/30 hover:bg-white/[0.09] sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Bento Stats Matrix */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <div className="bg-card/80 border-border relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-mono text-xs">Total Sessions</span>
            <div className="flex size-6 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <History className="size-3.5" />
            </div>
          </div>
          <div className="text-foreground mt-2 font-mono text-2xl font-bold">
            {total || sessions.length}
          </div>
          <div className="text-muted-foreground mt-1 font-mono text-[11px]">
            Autonomous missions
          </div>
        </div>

        <div className="bg-card/80 border-border relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-mono text-xs">Voice Airtime</span>
            <div className="flex size-6 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-400">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="text-foreground mt-2 font-mono text-2xl font-bold">
            {totalDurationMinutes}{' '}
            <span className="text-muted-foreground text-sm font-normal">mins</span>
          </div>
          <div className="text-muted-foreground mt-1 font-mono text-[11px]">
            48kHz Opus streamed
          </div>
        </div>

        <div className="bg-card/80 border-border relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-mono text-xs">Avg TTFT Latency</span>
            <div className="flex size-6 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <Sparkles className="size-3.5" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">
            185 <span className="text-muted-foreground text-sm font-normal">ms</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-emerald-500/80">
            Near real-time response
          </div>
        </div>

        <div className="bg-card/80 border-border relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-mono text-xs">MCP Tool Actions</span>
            <div className="flex size-6 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <Cpu className="size-3.5" />
            </div>
          </div>
          <div className="text-foreground mt-2 font-mono text-2xl font-bold">
            48 <span className="text-muted-foreground text-sm font-normal">calls</span>
          </div>
          <div className="text-muted-foreground mt-1 font-mono text-[11px]">
            100% execution rate
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card/80 border-border flex flex-col items-center justify-between gap-3 rounded-2xl border p-3 sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transcripts, rooms, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/40 border-border text-foreground w-full rounded-xl border py-1.5 pr-3 pl-9 text-xs placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>

        <div className="flex w-full items-center justify-end gap-1.5 self-end sm:w-auto sm:self-auto">
          <span className="text-muted-foreground mr-1 hidden font-mono text-[11px] md:inline">
            Model:
          </span>
          {(['all', 'gemini', 'modular'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModelFilter(m)}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs transition-all ${
                modelFilter === m
                  ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                  : 'bg-card/80 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {m === 'all' ? 'All Engines' : m === 'gemini' ? 'Gemini Live' : 'Modular'}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{error}</span>
          <button
            onClick={() => fetchSessions(page)}
            className="ml-auto cursor-pointer font-mono text-xs text-rose-300 underline hover:text-rose-200"
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
              className="bg-card/80 border-border h-24 animate-pulse rounded-2xl border"
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="border-border space-y-3 rounded-2xl border border-dashed bg-white/[0.01] px-4 py-16 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <History className="size-6" />
          </div>
          <h3 className="text-foreground font-semibold">No sessions found</h3>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs">
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
              className="group bg-card/80 hover:bg-card/80 border-border flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:border-emerald-500/30 sm:flex-row sm:items-center md:p-5"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground font-mono text-sm font-bold transition-colors group-hover:text-emerald-300">
                    {session.room_name || session.id}
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                    {session.model_used || 'Gemini 2.0 Flash'}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium ${
                      session.status === 'active'
                        ? 'animate-pulse border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                        : 'bg-card/80 text-muted-foreground border-border'
                    }`}
                  >
                    {session.status.toUpperCase()}
                  </span>
                </div>

                {session.preview_text && (
                  <p className="text-muted-foreground line-clamp-1 text-xs italic">
                    "{session.preview_text}"
                  </p>
                )}

                <div className="text-muted-foreground flex flex-wrap items-center gap-4 font-mono text-[11px]">
                  <span className="flex items-center gap-1">
                    <Calendar className="text-muted-foreground size-3" />
                    {formatDate(session.started_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="text-muted-foreground size-3" />
                    {formatDuration(session.duration_seconds)}
                  </span>
                  {session.message_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="text-muted-foreground size-3" />
                      {session.message_count} turns
                    </span>
                  )}
                  {/* Decorative Simulated Audio Waveform */}
                  <div className="hidden h-3 items-center gap-0.5 md:flex">
                    {[40, 70, 30, 90, 60, 80, 45, 100, 50, 75, 30].map((h, i) => (
                      <span
                        key={i}
                        className="w-0.5 rounded-full bg-emerald-500/30 transition-colors group-hover:bg-emerald-400"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                <span className="flex hidden items-center gap-1 font-mono text-xs font-semibold text-emerald-400 transition-transform group-hover:translate-x-0.5 sm:inline">
                  Telemetry Details
                  <ArrowUpRight className="size-3.5" />
                </span>
                <ChevronRight className="text-muted-foreground size-4 transition-colors group-hover:text-emerald-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {total > 10 && (
        <div className="border-border flex items-center justify-between border-t pt-4">
          <span className="text-muted-foreground font-mono text-xs">
            Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} missions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="bg-card/80 text-foreground border-border rounded-lg border px-3 py-1.5 font-mono text-xs hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Previous
            </button>
            <span className="px-2 font-mono text-xs text-emerald-400">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 10 >= total}
              className="bg-card/80 text-foreground border-border rounded-lg border px-3 py-1.5 font-mono text-xs hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Slide-out Drawer / Modal */}
      {selectedSessionId && (
        <div className="bg-card animate-in fade-in fixed inset-0 z-50 flex justify-end backdrop-blur-md duration-200">
          <div className="border-border relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l bg-[#080b12] shadow-2xl">
            {/* Drawer Header */}
            <div className="border-border bg-card flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                  <Terminal className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-foreground flex items-center gap-2 font-mono text-base font-bold">
                    <span>{sessionDetail?.room_name || selectedSessionId}</span>
                  </h2>
                  <p className="text-muted-foreground font-mono text-[11px]">
                    ID: {selectedSessionId} • {formatDate(sessionDetail?.started_at || '')}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDetail}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors hover:bg-white/[0.08]"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Audio Simulation Scrub Bar */}
            <div className="bg-card/80 border-border flex items-center gap-4 border-b p-4">
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black shadow-[0_0_10px_#10b981] transition-colors hover:bg-emerald-400"
              >
                {isPlayingAudio ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="text-muted-foreground flex items-center justify-between font-mono text-[10px]">
                  <span className="flex items-center gap-1">
                    <Volume2 className="size-3 text-emerald-400" />
                    WebRTC Audio Stream (Opus 48kHz)
                  </span>
                  <span>{Math.floor((audioProgress * 45) / 100)}s / 45s</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] transition-all duration-200"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {isLoadingDetail ? (
                <div className="space-y-4 py-8">
                  <div className="bg-card/80 h-16 animate-pulse rounded-xl" />
                  <div className="bg-card/80 h-28 animate-pulse rounded-xl" />
                  <div className="bg-card/80 h-40 animate-pulse rounded-xl" />
                </div>
              ) : sessionDetail ? (
                <>
                  {/* Telemetry Summary Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-card/80 border-border rounded-xl border p-3">
                      <div className="text-muted-foreground font-mono text-[10px]">Duration</div>
                      <div className="text-foreground mt-1 font-mono text-sm font-bold">
                        {formatDuration(sessionDetail.duration_seconds)}
                      </div>
                    </div>
                    <div className="bg-card/80 border-border rounded-xl border p-3">
                      <div className="text-muted-foreground font-mono text-[10px]">
                        Intelligence Engine
                      </div>
                      <div className="mt-1 truncate font-mono text-sm font-bold text-emerald-400">
                        {sessionDetail.model_used || 'Gemini 2.0'}
                      </div>
                    </div>
                    <div className="bg-card/80 border-border rounded-xl border p-3">
                      <div className="text-muted-foreground font-mono text-[10px]">Status</div>
                      <div className="mt-1 font-mono text-sm font-bold text-teal-400 uppercase">
                        {sessionDetail.status}
                      </div>
                    </div>
                  </div>

                  {/* MCP Tool Actions Executed */}
                  {sessionDetail.mcp_calls && sessionDetail.mcp_calls.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-foreground flex items-center gap-1.5 font-mono text-xs font-semibold">
                        <Cpu className="size-3.5 text-emerald-400" />
                        <span>MCP Autonomous Actions ({sessionDetail.mcp_calls.length})</span>
                      </div>
                      <div className="space-y-2">
                        {sessionDetail.mcp_calls.map((call, idx) => (
                          <div
                            key={idx}
                            className="border-border space-y-2 rounded-xl border bg-[#0e131d] p-3 font-mono text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-400">{call.tool_name}</span>
                              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                                {call.server_name || 'mcp-server'}
                              </span>
                            </div>
                            {call.arguments && (
                              <pre className="bg-card text-muted-foreground overflow-x-auto rounded-lg p-2 text-[10px]">
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
                    <div className="text-foreground flex items-center gap-1.5 font-mono text-xs font-semibold">
                      <MessageSquare className="size-3.5 text-emerald-400" />
                      <span>Dialogue Transcript Turns ({sessionDetail.messages?.length || 0})</span>
                    </div>

                    {!sessionDetail.messages || sessionDetail.messages.length === 0 ? (
                      <div className="text-muted-foreground border-border rounded-xl border border-dashed p-6 text-center font-mono text-xs">
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
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                                  <Bot className="size-4" />
                                </div>
                              )}

                              <div
                                className={`max-w-[80%] space-y-1 rounded-2xl p-3.5 text-xs ${
                                  isUser
                                    ? 'text-foreground rounded-tr-xs border border-emerald-500/30 bg-emerald-500/15'
                                    : 'bg-card/80 text-foreground border-border rounded-tl-xs border'
                                }`}
                              >
                                <div className="text-muted-foreground flex items-center justify-between gap-4 font-mono text-[10px]">
                                  <span>{isUser ? 'OPERATOR' : 'EXIA GN-001'}</span>
                                  {msg.timestamp && <span>{formatDate(msg.timestamp)}</span>}
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              </div>

                              {isUser && (
                                <div className="border-border text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg border bg-white/[0.08]">
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
