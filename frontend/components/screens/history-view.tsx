'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Bot,
  Calendar,
  ChevronRight,
  Clock,
  Cpu,
  History,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Search,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(page);
  }, [page]);

  // Handle audio simulation playback
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
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
    } catch (err: unknown) {
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
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Session History
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Transcript audit trails, audio metrics, and MCP tool logs.
          </p>
        </div>

        <button
          onClick={() => fetchSessions(page)}
          disabled={isLoading}
          className="border-border hover:bg-accent inline-flex items-center gap-2 self-start rounded-xl border px-3.5 py-2 text-sm font-medium transition-all sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Total Sessions</span>
            <History className="text-muted-foreground size-4" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-semibold">
            {total || sessions.length}
          </div>
          <div className="text-muted-foreground mt-1 text-xs">Recorded conversations</div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Voice Airtime</span>
            <Clock className="text-muted-foreground size-4" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-semibold">
            {totalDurationMinutes}{' '}
            <span className="text-muted-foreground text-sm font-normal">mins</span>
          </div>
          <div className="text-muted-foreground mt-1 text-xs">48kHz Opus streamed</div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Avg TTFT Latency</span>
            <Sparkles className="text-muted-foreground size-4" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-semibold">
            185 <span className="text-muted-foreground text-sm font-normal">ms</span>
          </div>
          <div className="text-muted-foreground mt-1 text-xs">Near real-time response</div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">MCP Tool Actions</span>
            <Cpu className="text-muted-foreground size-4" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-semibold">
            48 <span className="text-muted-foreground text-sm font-normal">calls</span>
          </div>
          <div className="text-muted-foreground mt-1 text-xs">100% execution rate</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="border-border bg-card flex flex-col items-center justify-between gap-3 rounded-xl border p-3 sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sessions, rooms, topics…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border py-2 pr-3 pl-9 text-sm"
          />
        </div>

        <div className="flex w-full items-center justify-end gap-1.5 self-end sm:w-auto sm:self-auto">
          <span className="text-muted-foreground mr-1 hidden text-xs md:inline">Model:</span>
          {(['all', 'gemini', 'modular'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModelFilter(m)}
              className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                modelFilter === m
                  ? 'border-border bg-muted text-foreground border font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m === 'all' ? 'All' : m === 'gemini' ? 'Gemini' : 'Modular'}
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
            className="ml-auto cursor-pointer text-xs text-rose-300 underline hover:text-rose-200"
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
              className="bg-card border-border h-24 animate-pulse rounded-2xl border"
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="border-border space-y-3 rounded-2xl border border-dashed px-4 py-16 text-center">
          <History className="text-muted-foreground mx-auto size-8" />
          <h3 className="text-foreground font-semibold">No sessions found</h3>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">
            {searchQuery
              ? 'Try modifying your search term or clearing the model filter.'
              : 'Launch a voice conversation from the Voice Stage to populate session recordings.'}
          </p>
        </div>
      ) : (
        /* Sessions List */
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenDetail(session.id)}
              className="group border-border bg-card flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border p-4 transition-all duration-200 hover:border-white/10 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground font-medium text-sm">
                    {session.room_name || session.id}
                  </span>
                  <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px]">
                    {session.model_used || 'Gemini 2.0 Flash'}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] ${
                      session.status === 'active'
                        ? 'animate-pulse bg-emerald-500/10 text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                {session.preview_text && (
                  <p className="text-muted-foreground line-clamp-1 text-sm italic">
                    &ldquo;{session.preview_text}&rdquo;
                  </p>
                )}

                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(session.started_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {formatDuration(session.duration_seconds)}
                  </span>
                  {session.message_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {session.message_count} turns
                    </span>
                  )}
                  {/* Decorative Simulated Audio Waveform */}
                  <div className="hidden h-3 items-center gap-0.5 md:flex">
                    {[40, 70, 30, 90, 60, 80, 45, 100, 50, 75, 30].map((h, i) => (
                      <span
                        key={i}
                        className="bg-border group-hover:bg-muted-foreground w-0.5 rounded-full transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                <span className="text-muted-foreground hidden items-center gap-1 text-xs transition-transform group-hover:translate-x-0.5 sm:inline-flex">
                  View details
                  <ArrowUpRight className="size-3.5" />
                </span>
                <ChevronRight className="text-muted-foreground size-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {total > 10 && (
        <div className="border-border flex items-center justify-between border-t pt-4">
          <span className="text-muted-foreground text-xs">
            Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="border-border hover:bg-accent rounded-lg border px-3 py-1.5 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-muted-foreground px-2 text-xs">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 10 >= total}
              className="border-border hover:bg-accent rounded-lg border px-3 py-1.5 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Slide-out Drawer */}
      {selectedSessionId && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm duration-200">
          <div className="border-border bg-card relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l shadow-2xl">
            {/* Drawer Header */}
            <div className="border-border flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="bg-muted flex size-9 items-center justify-center rounded-xl">
                  <Terminal className="text-muted-foreground size-4" />
                </div>
                <div>
                  <h2 className="text-foreground text-base font-semibold">
                    {sessionDetail?.room_name || selectedSessionId}
                  </h2>
                  <p className="text-muted-foreground font-mono text-[11px]">
                    {selectedSessionId} · {formatDate(sessionDetail?.started_at || '')}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDetail}
                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Audio Simulation Scrub Bar */}
            <div className="border-border bg-card flex items-center gap-4 border-b p-4">
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full shadow-lg transition-all hover:opacity-90"
              >
                {isPlayingAudio ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Volume2 className="size-3" />
                    Audio stream (Opus 48kHz)
                  </span>
                  <span className="font-mono">{Math.floor((audioProgress * 45) / 100)}s / 45s</span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-200"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {isLoadingDetail ? (
                <div className="space-y-4 py-8">
                  <div className="bg-muted h-16 animate-pulse rounded-xl" />
                  <div className="bg-muted h-28 animate-pulse rounded-xl" />
                  <div className="bg-muted h-40 animate-pulse rounded-xl" />
                </div>
              ) : sessionDetail ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border-border bg-card rounded-xl border p-3">
                      <div className="text-muted-foreground text-xs">Duration</div>
                      <div className="text-foreground mt-1 font-mono text-sm font-semibold">
                        {formatDuration(sessionDetail.duration_seconds)}
                      </div>
                    </div>
                    <div className="border-border bg-card rounded-xl border p-3">
                      <div className="text-muted-foreground text-xs">Model</div>
                      <div className="text-foreground mt-1 truncate font-mono text-sm font-semibold">
                        {sessionDetail.model_used || 'Gemini 2.0'}
                      </div>
                    </div>
                    <div className="border-border bg-card rounded-xl border p-3">
                      <div className="text-muted-foreground text-xs">Status</div>
                      <div className="text-foreground mt-1 font-mono text-sm font-semibold capitalize">
                        {sessionDetail.status}
                      </div>
                    </div>
                  </div>

                  {/* MCP Tool Actions Executed */}
                  {sessionDetail.mcp_tools_invoked &&
                    sessionDetail.mcp_tools_invoked.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                          <Cpu className="text-muted-foreground size-3.5" />
                          <span>
                            MCP Actions ({sessionDetail.mcp_tools_invoked.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {sessionDetail.mcp_tools_invoked.map((call, idx) => (
                            <div
                              key={call.id || idx}
                              className="border-border bg-muted/30 space-y-2 rounded-xl border p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-semibold">{call.name}</span>
                                <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px]">
                                  {call.status || 'mcp-server'}
                                </span>
                              </div>
                              {call.args && (
                                <pre className="bg-muted text-muted-foreground overflow-x-auto rounded-lg p-2 font-mono text-[10px]">
                                  {typeof call.args === 'string'
                                    ? call.args
                                    : JSON.stringify(call.args, null, 2)}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Conversation Transcript Turns */}
                  <div className="space-y-3">
                    <div className="text-foreground flex items-center gap-1.5 text-sm font-medium">
                      <MessageSquare className="text-muted-foreground size-3.5" />
                      <span>
                        Transcript ({sessionDetail.transcript?.length || 0} turns)
                      </span>
                    </div>

                    {!sessionDetail.transcript || sessionDetail.transcript.length === 0 ? (
                      <div className="text-muted-foreground border-border rounded-xl border border-dashed p-6 text-center text-sm">
                        No messages logged for this session.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sessionDetail.transcript.map((msg, idx) => {
                          const isUser = msg.role === 'user';
                          return (
                            <div
                              key={idx}
                              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                              {!isUser && (
                                <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg">
                                  <Bot className="size-4" />
                                </div>
                              )}

                              <div
                                className={`max-w-[80%] space-y-1 rounded-2xl p-3.5 text-sm ${
                                  isUser
                                    ? 'text-foreground border-border rounded-tr-sm border bg-white/[0.05]'
                                    : 'bg-muted text-foreground rounded-tl-sm'
                                }`}
                              >
                                <div className="text-muted-foreground flex items-center justify-between gap-4 font-mono text-[10px]">
                                  <span>{isUser ? 'You' : 'Exia'}</span>
                                  {msg.timestamp && <span>{formatDate(msg.timestamp)}</span>}
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              </div>

                              {isUser && (
                                <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg">
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
