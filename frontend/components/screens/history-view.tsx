'use client';

import React, { useEffect, useState } from 'react';
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
  CheckCircle2,
  Sparkles,
  User as UserIcon,
  Bot,
} from 'lucide-react';
import { api } from '@/lib/api';
import { SessionSummary, SessionDetail } from '@/lib/types';

export function HistoryView() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal / Drawer
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

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

  const handleOpenDetail = async (id: string) => {
    setSelectedSessionId(id);
    setIsLoadingDetail(true);
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

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Session History
          </h1>
          <p className="text-sm text-muted-foreground">
            Review past voice conversations, transcripts, and MCP tool actions
          </p>
        </div>
        <button
          onClick={() => fetchSessions(page)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-all"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => fetchSessions(page)}
            className="ml-auto underline font-medium text-xs cursor-pointer"
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
              className="h-24 rounded-2xl bg-muted/40 animate-pulse border border-border"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <History className="size-6" />
          </div>
          <h3 className="font-semibold text-foreground">No sessions recorded yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Start a voice conversation from the Voice Session tab to record transcripts, tool usage, and models.
          </p>
        </div>
      ) : (
        /* Sessions List */
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleOpenDetail(session.id)}
              className="group p-4 md:p-5 rounded-2xl bg-card/80 hover:bg-card border border-border hover:border-primary/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {session.room_name || session.id}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {session.model_used || 'Gemini Live'}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      session.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                {session.preview_text && (
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">
                    "{session.preview_text}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatDate(session.started_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatDuration(session.duration_seconds)}
                  </span>
                  {session.message_count !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3.5" />
                      {session.message_count} messages
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="text-xs font-medium text-primary hidden sm:inline group-hover:underline">
                  View Detail
                </span>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}

          {/* Pagination */}
          {total > 10 && (
            <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
              <span>Showing {sessions.length} of {total} sessions</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page * 10 >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Inspector Drawer / Modal */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-bold text-foreground">
                    {sessionDetail?.room_name || selectedSessionId}
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {sessionDetail?.model_used || 'Gemini Live'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Session ID: <span className="font-mono">{selectedSessionId}</span>
                </p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {isLoadingDetail ? (
                <div className="space-y-4 py-8">
                  <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md" />
                  <div className="h-20 bg-muted animate-pulse rounded-xl" />
                  <div className="h-20 bg-muted animate-pulse rounded-xl" />
                </div>
              ) : sessionDetail ? (
                <>
                  {/* Metadata Stats Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/40 border border-border/80">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Duration
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {formatDuration(sessionDetail.duration_seconds)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Started
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {formatDate(sessionDetail.started_at)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Status
                      </span>
                      <p className="text-sm font-semibold text-emerald-500 capitalize">
                        {sessionDetail.status}
                      </p>
                    </div>
                  </div>

                  {/* MCP Tools Invoked */}
                  {sessionDetail.mcp_tools_invoked && sessionDetail.mcp_tools_invoked.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Cpu className="size-4 text-primary" />
                        <span>MCP Tools Invoked ({sessionDetail.mcp_tools_invoked.length})</span>
                      </div>
                      <div className="space-y-2">
                        {sessionDetail.mcp_tools_invoked.map((tool) => (
                          <div
                            key={tool.id}
                            className="p-3 rounded-xl border border-border bg-background space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-semibold text-foreground">
                                {tool.name}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  tool.status === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-destructive/10 text-destructive'
                                }`}
                              >
                                {tool.status}
                              </span>
                            </div>
                            {tool.args && (
                              <pre className="text-[11px] bg-muted/50 p-2 rounded-lg font-mono overflow-x-auto text-muted-foreground">
                                {JSON.stringify(tool.args, null, 2)}
                              </pre>
                            )}
                            {tool.result && (
                              <div className="text-[11px] text-muted-foreground">
                                <span className="font-medium text-foreground/80">Result: </span>
                                {tool.result}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transcript View */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <MessageSquare className="size-4 text-primary" />
                      <span>Full Conversation Transcript</span>
                    </div>

                    {sessionDetail.transcript && sessionDetail.transcript.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        {sessionDetail.transcript.map((msg) => {
                          const isUser = msg.role === 'user';
                          return (
                            <div
                              key={msg.id}
                              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              <div
                                className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                                  isUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {isUser ? (
                                  <UserIcon className="size-3.5" />
                                ) : (
                                  <Bot className="size-3.5" />
                                )}
                              </div>
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs md:text-sm ${
                                  isUser
                                    ? 'bg-primary text-primary-foreground rounded-tr-xs'
                                    : 'bg-muted/70 text-foreground border border-border/60 rounded-tl-xs'
                                }`}
                              >
                                <p className="leading-relaxed">{msg.text}</p>
                                <span
                                  className={`block text-[10px] mt-1 ${
                                    isUser
                                      ? 'text-primary-foreground/70 text-right'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {formatDate(msg.timestamp)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-4 text-center">
                        No transcript recorded for this session.
                      </p>
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
