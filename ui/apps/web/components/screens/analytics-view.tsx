'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Copy,
  Cpu,
  Download,
  Flame,
  Gauge,
  Layers,
  Mic,
  PieChart,
  Radio,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Volume2,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { MCPServer } from '@/lib/types';

interface AnalyticsData {
  total_sessions: number;
  completed_sessions: number;
  total_duration_seconds: number;
  formatted_duration: string;
  total_turns: number;
  total_tool_calls: number;
  total_tokens: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  avg_latency: {
    stt_ms: number;
    llm_ttft_ms: number;
    tts_ms: number;
    e2e_ms: number;
  };
  model_breakdown: Array<{
    model: string;
    sessions: number;
    percentage: number;
  }>;
  recent_activity: Array<{
    session_id: string;
    room_name: string;
    timestamp: string;
    duration_seconds: number;
    turns: number;
    status: string;
  }>;
}

export function AnalyticsView() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'tools' | 'telemetry'>(
    'overview'
  );
  const [liveMetrics, setLiveMetrics] = useState<AnalyticsData | null>(null);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTelemetry = async () => {
    setIsLoading(true);
    try {
      const [metricsData, mcpData] = await Promise.allSettled([
        api.analytics.getMetrics(),
        api.mcp.list(),
      ]);

      if (metricsData.status === 'fulfilled' && metricsData.value) {
        setLiveMetrics(metricsData.value);
      }
      if (mcpData.status === 'fulfilled' && mcpData.value) {
        setMcpServers(mcpData.value);
      }
    } catch (err) {
      console.warn('Analytics sync error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [timeRange]);

  const handleCopyJSON = () => {
    const payload = liveMetrics || {
      telemetry: 'No telemetry collected yet from active sessions.',
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success('Live telemetry JSON copied to clipboard');
  };

  const totalRegisteredTools = mcpServers.reduce(
    (sum, s) => sum + (s.tools?.length || 0),
    0
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              Agent Observability & Analytics
            </h1>
            <span className="flex items-center gap-1 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-400">
              <span className="size-1.5 animate-pulse rounded-full bg-cyan-400" />
              Live MongoDB Telemetry
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Live turn request tracking, token economics, model latencies, and registered MCP tool execution.
          </p>
        </div>

        {/* Time Range Selector & Sync */}
        <div className="flex items-center gap-2">
          <div className="border-border bg-card flex rounded-xl border p-1 text-xs">
            {(['24h', '7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-muted text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              fetchTelemetry();
              toast.success('Telemetry synchronized from MongoDB');
            }}
            disabled={isLoading}
            className="border-border hover:bg-accent inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="border-border flex gap-1 border-b pb-1">
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: BarChart3 },
          { id: 'tools', label: `MCP Tools (${totalRegisteredTools})`, icon: Cpu },
          { id: 'models', label: 'Models & Engine Breakdown', icon: Gauge },
          { id: 'telemetry', label: 'Live JSON Telemetry', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-t-xl border-b-2 px-3.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'border-primary text-foreground bg-white/[0.04] font-semibold'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & KPIs */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Real Bento Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {/* Card 1: Total Sessions */}
            <div className="border-border bg-card rounded-2xl border p-4 shadow-sm transition-all hover:border-white/15">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">Total Sessions</span>
                <span className="flex items-center gap-0.5 text-[11px] font-medium text-emerald-400">
                  <Activity className="size-3" />
                  Live
                </span>
              </div>
              <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
                {liveMetrics?.total_sessions ?? 0}
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">
                <Clock className="size-3" />
                <span>{liveMetrics?.formatted_duration || '0m 0s'} voice stream</span>
              </div>
            </div>

            {/* Card 2: E2E Turn Latency */}
            <div className="border-border bg-card rounded-2xl border p-4 shadow-sm transition-all hover:border-white/15">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">Avg E2E Latency</span>
                <span className="flex items-center gap-0.5 text-[11px] font-medium text-cyan-400">
                  <Zap className="size-3 text-amber-400" />
                  Realtime
                </span>
              </div>
              <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
                {liveMetrics?.avg_latency?.e2e_ms ? (
                  <>
                    {liveMetrics.avg_latency.e2e_ms} <span className="text-muted-foreground text-xs font-normal">ms</span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-lg font-normal">Pending call</span>
                )}
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">
                <span>TTFT: {liveMetrics?.avg_latency?.llm_ttft_ms ?? 0}ms · STT: {liveMetrics?.avg_latency?.stt_ms ?? 0}ms</span>
              </div>
            </div>

            {/* Card 3: Total Tokens */}
            <div className="border-border bg-card rounded-2xl border p-4 shadow-sm transition-all hover:border-white/15">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">Total Tokens</span>
                <span className="border-border bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">
                  Audio + Text
                </span>
              </div>
              <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
                {liveMetrics?.total_tokens?.total_tokens
                  ? liveMetrics.total_tokens.total_tokens.toLocaleString()
                  : '0'}
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">
                <Volume2 className="size-3 text-cyan-400" />
                <span>{liveMetrics?.total_turns ?? 0} conversational turns</span>
              </div>
            </div>

            {/* Card 4: Tool Invocations */}
            <div className="border-border bg-card rounded-2xl border p-4 shadow-sm transition-all hover:border-white/15">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">MCP Tool Invocations</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  {mcpServers.length} servers
                </span>
              </div>
              <div className="text-foreground mt-2 text-2xl font-bold tracking-tight">
                {liveMetrics?.total_tool_calls ?? 0}
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">
                <Workflow className="size-3 text-purple-400" />
                <span>{totalRegisteredTools} tools available in registry</span>
              </div>
            </div>
          </div>

          {/* Real Sessions Activity Table */}
          <div className="border-border bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-foreground flex items-center gap-2 font-semibold text-sm">
                  <Activity className="size-4 text-cyan-400" />
                  Recent Voice Sessions & Telemetry
                </h3>
                <p className="text-muted-foreground text-xs">
                  Recorded LiveKit sessions synchronized with your MongoDB database.
                </p>
              </div>
            </div>

            {liveMetrics?.recent_activity && liveMetrics.recent_activity.length > 0 ? (
              <div className="border-border overflow-hidden rounded-xl border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-border border-b text-muted-foreground font-medium">
                    <tr>
                      <th className="px-4 py-3">Session ID</th>
                      <th className="px-4 py-3">Room Name</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Turns</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {liveMetrics.recent_activity.map((session) => (
                      <tr key={session.session_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {session.session_id}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{session.room_name}</td>
                        <td className="px-4 py-3 font-mono text-foreground">
                          {session.duration_seconds}s
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {session.turns} turns
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            <span className="size-1 rounded-full bg-emerald-400" />
                            {session.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {session.timestamp ? new Date(session.timestamp).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
                <div className="bg-muted flex size-10 items-center justify-center rounded-full text-muted-foreground mb-3">
                  <Mic className="size-5" />
                </div>
                <h4 className="text-foreground text-sm font-medium">No voice sessions recorded yet</h4>
                <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                  Start a conversation from the main Voice Stage tab to stream realtime telemetry directly into MongoDB.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: MCP Tools Observability (Live Connected Servers) */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-foreground font-semibold text-base">
                Connected MCP Servers & Tool Matrix
              </h2>
              <p className="text-muted-foreground text-xs">
                Realtime inventory of Model Context Protocol endpoints configured in your database.
              </p>
            </div>
            <span className="border-border bg-card text-muted-foreground rounded-lg border px-2.5 py-1 text-xs">
              {mcpServers.length} Servers Registered · {totalRegisteredTools} Tools
            </span>
          </div>

          {mcpServers.length > 0 ? (
            <div className="border-border bg-card overflow-hidden rounded-2xl border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-border border-b text-muted-foreground font-medium">
                  <tr>
                    <th className="px-4 py-3">Server Name</th>
                    <th className="px-4 py-3">Transport / Protocol</th>
                    <th className="px-4 py-3">Endpoint / Command</th>
                    <th className="px-4 py-3">Tools Provided</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {mcpServers.map((server) => (
                    <tr key={server.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <Cpu className="size-3.5 text-primary" />
                          <span>{server.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="border-border bg-muted/50 rounded-md border px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
                          {server.server_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground max-w-xs truncate" title={server.command_or_url}>
                        {server.command_or_url}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-foreground">
                            {server.tools?.length || 0}
                          </span>
                          {server.tools && server.tools.length > 0 && (
                            <span className="text-muted-foreground text-[10px]">
                              ({server.tools.slice(0, 2).join(', ')}{server.tools.length > 2 ? ` +${server.tools.length - 2}` : ''})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {server.enabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            <span className="size-1 rounded-full bg-emerald-400" />
                            Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                            <span className="size-1 rounded-full bg-zinc-400" />
                            Disabled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-border/60 bg-muted/20 flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
              <Cpu className="size-8 text-muted-foreground/60 mb-2" />
              <h3 className="text-foreground text-sm font-medium">No MCP servers registered</h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                Navigate to the MCP Registry tab to connect your tool servers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Models Breakdown */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground font-semibold text-base">
                AI Engine & Model Distribution
              </h2>
              <p className="text-muted-foreground text-xs">
                Breakdown of AI engines used across your voice sessions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="border-border bg-card space-y-4 rounded-2xl border p-5">
              <h3 className="text-foreground font-semibold text-sm">Model Session Distribution</h3>
              {liveMetrics?.model_breakdown && liveMetrics.model_breakdown.length > 0 ? (
                <div className="space-y-3">
                  {liveMetrics.model_breakdown.map((mb) => (
                    <div key={mb.model} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground font-medium">{mb.model}</span>
                        <span className="text-muted-foreground font-mono">{mb.sessions} sessions ({mb.percentage}%)</span>
                      </div>
                      <div className="bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${mb.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Default: Gemini 2.0 Flash Live (Multimodal Bidirectional WebRTC).
                </p>
              )}
            </div>

            <div className="border-border bg-card space-y-3 rounded-2xl border p-5">
              <h3 className="text-foreground font-semibold text-sm">Token Consumption Accounting</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Prompt / Context Tokens:</span>
                  <span className="text-foreground font-mono font-semibold">
                    {liveMetrics?.total_tokens?.prompt_tokens?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Completion / Output Tokens:</span>
                  <span className="text-foreground font-mono font-semibold">
                    {liveMetrics?.total_tokens?.completion_tokens?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-foreground font-medium">Grand Total Multimodal Tokens:</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {liveMetrics?.total_tokens?.total_tokens?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Live JSON Telemetry Inspector */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground font-semibold text-base">
                Live MongoDB Telemetry Payload
              </h2>
              <p className="text-muted-foreground text-xs">
                Direct aggregated response returned by FastAPI endpoint /api/analytics.
              </p>
            </div>
            <button
              onClick={handleCopyJSON}
              className="border-border hover:bg-accent inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            >
              <Copy className="size-3.5" />
              <span>Copy JSON</span>
            </button>
          </div>

          <div className="border-border bg-card relative overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-border bg-muted/40 flex items-center justify-between border-b px-4 py-2.5 text-xs text-muted-foreground">
              <span className="font-mono">schema: Exia.AnalyticsMetricsResponse</span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                Live Active
              </span>
            </div>
            <pre className="text-muted-foreground/90 max-h-[460px] overflow-auto p-4 font-mono text-xs leading-relaxed">
              {JSON.stringify(liveMetrics || { status: 'Awaiting telemetry events...' }, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
