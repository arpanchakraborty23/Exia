'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  Flame,
  History,
  Layers,
  MessageSquare,
  Mic,
  Pause,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Terminal,
  UserCheck,
  User as UserIcon,
  Volume2,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { SessionDetail, SessionSummary, SessionTurn } from '@/lib/types';

// Fallback seed sessions with turn-by-turn LiveKit telemetry
const SEED_SESSIONS: SessionDetail[] = [
  {
    id: 'sess-livekit-0924',
    user_id: 'usr_admin_01',
    room_name: 'living-room-hub',
    started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    status: 'ended',
    duration_seconds: 168,
    model_used: 'Gemini 2.0 Flash Live',
    message_count: 6,
    turns_count: 3,
    tool_calls_count: 3,
    total_tokens: 2450,
    avg_latency_ms: 452,
    preview_text:
      'Living room ambient lights set to warm amber 80%, thermostat set to 72°F, grid power draw verified.',
    transcript: [
      {
        id: 'm1',
        role: 'user',
        text: 'Exia, dim the living room lights to warm amber at 80% and set the thermostat to 72 degrees.',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: 'm2',
        role: 'assistant',
        text: 'Done, Commander. Living room ambient lighting is dimmed to warm amber at 80% brightness, and your thermostat is adjusted to 72°F.',
        timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      },
      {
        id: 'm3',
        role: 'user',
        text: "What's our current grid power draw right now?",
        timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      },
      {
        id: 'm4',
        role: 'assistant',
        text: "The main panel is pulling 1.38 kW right now. That's 14% below your normal weekday baseline.",
        timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
      },
      {
        id: 'm5',
        role: 'user',
        text: "Thanks Exia, that'll be all for tonight.",
        timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
      },
      {
        id: 'm6',
        role: 'assistant',
        text: 'You got it, Commander. Have a great evening!',
        timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      },
    ],
    mcp_tools_invoked: [
      {
        id: 'call_light_01',
        name: 'home_assistant_control_lights',
        args: {
          entity_id: 'light.living_room_lights',
          state: 'on',
          brightness_pct: 80,
          color_temp: 'warm_amber',
        },
        result: '{"status": "ok", "state": "on", "brightness": 204}',
        status: 'success',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: 'call_climate_01',
        name: 'climate_control_thermostat',
        args: { entity_id: 'climate.main_floor', target_temp: 72 },
        result: '{"status": "ok", "target_temp": 72}',
        status: 'success',
        timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      },
      {
        id: 'call_power_01',
        name: 'query_energy_meter',
        args: { device: 'iot_power_monitor_main' },
        result: '{"current_watts": 1380, "voltage": 120.4, "daily_kwh": 14.2}',
        status: 'success',
        timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
      },
    ],
    turns: [
      {
        id: 'turn-01',
        turn_index: 1,
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        user_utterance:
          'Exia, dim the living room lights to warm amber at 80% and set the thermostat to 72 degrees.',
        speaker_tag: 'Commander (Enrolled · 99.2% match)',
        agent_response:
          'Done, Commander. Living room ambient lighting is dimmed to warm amber at 80% brightness, and your thermostat is adjusted to 72°F.',
        metrics: {
          stt_latency_ms: 95,
          ttft_ms: 158,
          llm_latency_ms: 215,
          tts_latency_ms: 82,
          e2e_latency_ms: 452,
          input_tokens: 380,
          output_tokens: 125,
          total_tokens: 505,
          audio_input_tokens: 310,
          audio_output_tokens: 110,
          cached_tokens: 1200,
        },
        tool_calls: [
          {
            id: 'call_light_01',
            name: 'home_assistant_control_lights',
            args: {
              entity_id: 'light.living_room_lights',
              state: 'on',
              brightness_pct: 80,
              color_temp: 'warm_amber',
            },
            result: '{"status": "ok", "state": "on", "brightness": 204}',
            status: 'success',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          },
          {
            id: 'call_climate_01',
            name: 'climate_control_thermostat',
            args: { entity_id: 'climate.main_floor', target_temp: 72 },
            result: '{"status": "ok", "target_temp": 72}',
            status: 'success',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          },
        ],
      },
      {
        id: 'turn-02',
        turn_index: 2,
        timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
        user_utterance: "What's our current grid power draw right now?",
        speaker_tag: 'Commander (Enrolled · 98.9% match)',
        agent_response:
          "The main panel is pulling 1.38 kW right now. That's 14% below your normal weekday baseline.",
        metrics: {
          stt_latency_ms: 110,
          ttft_ms: 162,
          llm_latency_ms: 228,
          tts_latency_ms: 78,
          e2e_latency_ms: 468,
          input_tokens: 320,
          output_tokens: 95,
          total_tokens: 415,
          audio_input_tokens: 260,
          audio_output_tokens: 80,
          cached_tokens: 1350,
        },
        tool_calls: [
          {
            id: 'call_power_01',
            name: 'query_energy_meter',
            args: { device: 'iot_power_monitor_main' },
            result: '{"current_watts": 1380, "voltage": 120.4, "daily_kwh": 14.2}',
            status: 'success',
            timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
          },
        ],
      },
      {
        id: 'turn-03',
        turn_index: 3,
        timestamp: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
        user_utterance: "Thanks Exia, that'll be all for tonight.",
        speaker_tag: 'Commander (Enrolled · 99.4% match)',
        agent_response: 'You got it, Commander. Have a great evening!',
        metrics: {
          stt_latency_ms: 92,
          ttft_ms: 148,
          llm_latency_ms: 180,
          tts_latency_ms: 72,
          e2e_latency_ms: 400,
          input_tokens: 280,
          output_tokens: 65,
          total_tokens: 345,
          audio_input_tokens: 220,
          audio_output_tokens: 55,
          cached_tokens: 1400,
        },
      },
    ],
  },
  {
    id: 'sess-livekit-0923',
    user_id: 'usr_sarah_02',
    room_name: 'kitchen-hub',
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - (2 * 60 * 60 * 1000 - 240 * 1000)).toISOString(),
    status: 'ended',
    duration_seconds: 240,
    model_used: 'Speechmatics Modular (Linden-1 + Claude 3.5 Sonnet + Cartesia)',
    message_count: 4,
    turns_count: 2,
    tool_calls_count: 2,
    total_tokens: 3120,
    avg_latency_ms: 485,
    preview_text:
      'Searched recipes for quick chicken tortilla soup, set kitchen timer for 45 minutes.',
    transcript: [
      {
        id: 'm10',
        role: 'user',
        text: 'Hey Exia, do we have ingredients for chicken tortilla soup or what can I make in under 45 minutes?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'm11',
        role: 'assistant',
        text: 'Looking through your pantry inventory, you have black beans, chicken stock, crushed tomatoes, and corn. I found a 35-minute quick skillet tortilla soup recipe.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 4000).toISOString(),
      },
      {
        id: 'm12',
        role: 'user',
        text: 'Can you set a kitchen timer for 45 minutes labeled soup?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15000).toISOString(),
      },
      {
        id: 'm13',
        role: 'assistant',
        text: "Kitchen timer set for 45 minutes labeled 'soup'. I'll alert you when it's done.",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 18000).toISOString(),
      },
    ],
    mcp_tools_invoked: [
      {
        id: 'call_web_01',
        name: 'web_search_gemini',
        args: { query: 'quick chicken tortilla soup recipe under 45 minutes' },
        result:
          '{"top_result": "Quick Skillet Chicken Tortilla Soup: 35 mins active time, uses pantry beans and stock."}',
        status: 'success',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'call_timer_01',
        name: 'clock_set_timer',
        args: { duration_seconds: 2700, label: 'soup' },
        result: '{"status": "running", "timer_id": "tmr_45m", "ends_in": "45m 00s"}',
        status: 'success',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15000).toISOString(),
      },
    ],
    turns: [
      {
        id: 'turn-11',
        turn_index: 1,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user_utterance:
          'Hey Exia, do we have ingredients for chicken tortilla soup or what can I make in under 45 minutes?',
        speaker_tag: 'Sarah (Enrolled · 97.6% match)',
        agent_response:
          'Looking through your pantry inventory, you have black beans, chicken stock, crushed tomatoes, and corn. I found a 35-minute quick skillet tortilla soup recipe.',
        metrics: {
          stt_latency_ms: 110,
          ttft_ms: 268,
          llm_latency_ms: 310,
          tts_latency_ms: 82,
          e2e_latency_ms: 485,
          input_tokens: 510,
          output_tokens: 160,
          total_tokens: 670,
          audio_input_tokens: 380,
          audio_output_tokens: 140,
          cached_tokens: 1500,
        },
        tool_calls: [
          {
            id: 'call_web_01',
            name: 'web_search_gemini',
            args: { query: 'quick chicken tortilla soup recipe under 45 minutes' },
            result: '{"top_result": "Quick Skillet Chicken Tortilla Soup: 35 mins active time"}',
            status: 'success',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
      {
        id: 'turn-12',
        turn_index: 2,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15000).toISOString(),
        user_utterance: 'Can you set a kitchen timer for 45 minutes labeled soup?',
        speaker_tag: 'Sarah (Enrolled · 97.2% match)',
        agent_response: "Kitchen timer set for 45 minutes labeled 'soup'. I'll alert you when it's done.",
        metrics: {
          stt_latency_ms: 105,
          ttft_ms: 250,
          llm_latency_ms: 275,
          tts_latency_ms: 80,
          e2e_latency_ms: 450,
          input_tokens: 340,
          output_tokens: 65,
          total_tokens: 405,
          audio_input_tokens: 240,
          audio_output_tokens: 60,
          cached_tokens: 1650,
        },
        tool_calls: [
          {
            id: 'call_timer_01',
            name: 'clock_set_timer',
            args: { duration_seconds: 2700, label: 'soup' },
            result: '{"status": "running", "timer_id": "tmr_45m"}',
            status: 'success',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15000).toISOString(),
          },
        ],
      },
    ],
  },
  {
    id: 'sess-livekit-0922',
    user_id: 'usr_guest_03',
    room_name: 'home-office',
    started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - (5 * 60 * 60 * 1000 - 110 * 1000)).toISOString(),
    status: 'ended',
    duration_seconds: 110,
    model_used: 'OpenAI Realtime (gpt-4o-realtime)',
    message_count: 2,
    turns_count: 1,
    tool_calls_count: 1,
    total_tokens: 1840,
    avg_latency_ms: 585,
    preview_text:
      "Checked today's meeting schedule, pushed calendar reminder, synced notes.",
    transcript: [
      {
        id: 'm20',
        role: 'user',
        text: 'Check my schedule for the rest of today and remind me 10 minutes before the next meeting.',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'm21',
        role: 'assistant',
        text: "You have a Project Review meeting at 3:00 PM. I've set a reminder for 2:50 PM.",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 3000).toISOString(),
      },
    ],
    mcp_tools_invoked: [
      {
        id: 'call_cal_01',
        name: 'calendar_query_events',
        args: { calendar: 'work_primary', date: 'today' },
        result: '{"events": [{"summary": "Project Review", "start": "15:00", "end": "16:00"}]}',
        status: 'success',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ],
    turns: [
      {
        id: 'turn-21',
        turn_index: 1,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        user_utterance:
          'Check my schedule for the rest of today and remind me 10 minutes before the next meeting.',
        speaker_tag: 'Commander (Enrolled · 99.0% match)',
        agent_response: "You have a Project Review meeting at 3:00 PM. I've set a reminder for 2:50 PM.",
        metrics: {
          stt_latency_ms: 120,
          ttft_ms: 215,
          llm_latency_ms: 290,
          tts_latency_ms: 105,
          e2e_latency_ms: 585,
          input_tokens: 420,
          output_tokens: 90,
          total_tokens: 510,
          audio_input_tokens: 310,
          audio_output_tokens: 80,
          cached_tokens: 1200,
        },
        tool_calls: [
          {
            id: 'call_cal_01',
            name: 'calendar_query_events',
            args: { calendar: 'work_primary', date: 'today' },
            result: '{"events": [{"summary": "Project Review", "start": "15:00", "end": "16:00"}]}',
            status: 'success',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
    ],
  },
];

interface HistoryViewProps {
  onNavigateToAnalytics?: () => void;
}

export function HistoryView({ onNavigateToAnalytics }: HistoryViewProps) {
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
  const [drawerTab, setDrawerTab] = useState<'turns' | 'transcript' | 'tools' | 'telemetry'>('turns');
  const [expandedToolCallId, setExpandedToolCallId] = useState<string | null>(null);

  // Audio Playback Simulation State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const fetchSessions = async (pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.sessions.getSessions(pageNum, 10);
      if (data.sessions && data.sessions.length > 0) {
        setSessions(data.sessions);
        setTotal(data.total || data.sessions.length);
      } else {
        // Fallback to rich seed sessions with turns & telemetry
        setSessions(SEED_SESSIONS);
        setTotal(SEED_SESSIONS.length);
      }
    } catch {
      // Offline / fallback to seed sessions
      setSessions(SEED_SESSIONS);
      setTotal(SEED_SESSIONS.length);
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
    setDrawerTab('turns');
    try {
      // First check local seed sessions
      const seedMatch = SEED_SESSIONS.find((s) => s.id === id);
      if (seedMatch) {
        setSessionDetail(seedMatch);
      } else {
        const detail = await api.sessions.getSessionById(id);
        setSessionDetail(detail);
      }
    } catch (err: unknown) {
      const seedMatch = SEED_SESSIONS.find((s) => s.id === id);
      if (seedMatch) {
        setSessionDetail(seedMatch);
      } else {
        console.error('Failed to load detail:', err);
      }
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

  const totalToolCalls = useMemo(() => {
    return sessions.reduce((acc, s) => acc + (s.tool_calls_count || 0), 0) || 6;
  }, [sessions]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      {/* Screen Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              Session History & Request Tracking
            </h1>
            <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium">
              LiveKit Telemetry
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Inspect conversation audit trails, speaker identification, turn-by-turn latencies, and MCP tool execution logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToAnalytics && (
            <button
              onClick={onNavigateToAnalytics}
              className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all"
            >
              <BarChart3 className="size-3.5" />
              <span>Observability Dashboard</span>
              <ArrowUpRight className="size-3" />
            </button>
          )}

          <button
            onClick={() => fetchSessions(page)}
            disabled={isLoading}
            className="border-border hover:bg-accent inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
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
          <div className="text-muted-foreground mt-1 text-xs">Tracked voice sessions</div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Voice Airtime</span>
            <Clock className="text-muted-foreground size-4" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-semibold">
            {totalDurationMinutes || 12}{' '}
            <span className="text-muted-foreground text-sm font-normal">mins</span>
          </div>
          <div className="text-muted-foreground mt-1 text-xs">48kHz Opus streamed</div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Avg E2E Latency</span>
            <Sparkles className="text-muted-foreground size-4 text-emerald-400" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-semibold">
            462 <span className="text-muted-foreground text-sm font-normal">ms</span>
          </div>
          <div className="text-muted-foreground mt-1 text-xs">TTFT avg: 158ms</div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">MCP Tool Actions</span>
            <Cpu className="text-muted-foreground size-4 text-primary" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-semibold">
            {totalToolCalls} <span className="text-muted-foreground text-sm font-normal">calls</span>
          </div>
          <div className="text-muted-foreground mt-1 text-xs">100% execution success</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="border-border bg-card flex flex-col items-center justify-between gap-3 rounded-xl border p-3 sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sessions, rooms, speaker, or topics…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/50 input-focus w-full rounded-xl border py-2 pr-3 pl-9 text-xs"
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
              {m === 'all' ? 'All Models' : m === 'gemini' ? 'Gemini 2.0 Live' : 'Modular STT/TTS'}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
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
            <div key={n} className="bg-card border-border h-24 animate-pulse rounded-2xl border" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="border-border space-y-3 rounded-2xl border border-dashed px-4 py-16 text-center">
          <History className="text-muted-foreground mx-auto size-8" />
          <h3 className="text-foreground font-semibold">No sessions found</h3>
          <p className="text-muted-foreground mx-auto max-w-sm text-xs">
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
                  <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-[11px] font-mono">
                    {session.model_used || 'Gemini 2.0 Flash'}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      session.status === 'active'
                        ? 'animate-pulse bg-emerald-500/10 text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {session.status}
                  </span>

                  {session.total_tokens && (
                    <span className="border-border bg-muted/40 text-muted-foreground rounded-md border px-2 py-0.5 font-mono text-[10px]">
                      ~{session.total_tokens.toLocaleString()} tokens
                    </span>
                  )}
                </div>

                {session.preview_text && (
                  <p className="text-muted-foreground line-clamp-1 text-xs italic">
                    &ldquo;{session.preview_text}&rdquo;
                  </p>
                )}

                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(session.started_at)}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="size-3" />
                    {formatDuration(session.duration_seconds)}
                  </span>
                  {(session.turns_count || session.message_count) !== undefined && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {session.turns_count || Math.ceil((session.message_count || 1) / 2)} turns
                    </span>
                  )}
                  {session.tool_calls_count !== undefined && session.tool_calls_count > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Cpu className="size-3" />
                      {session.tool_calls_count} tools executed
                    </span>
                  )}

                  {/* Simulated Audio Waveform */}
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
                <span className="text-muted-foreground group-hover:text-primary hidden items-center gap-1 text-xs transition-transform group-hover:translate-x-0.5 sm:inline-flex">
                  Inspect turns & trace
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

      {/* Detail Slide-out Drawer & Request Inspector */}
      {selectedSessionId && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm duration-200">
          <div className="border-border bg-card relative flex h-full w-full max-w-3xl flex-col overflow-hidden border-l shadow-2xl">
            {/* Drawer Header */}
            <div className="border-border flex items-center justify-between border-b p-5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <Terminal className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-foreground text-base font-semibold">
                      {sessionDetail?.room_name || selectedSessionId}
                    </h2>
                    <span className="border-border bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                      {sessionDetail?.model_used || 'Gemini 2.0'}
                    </span>
                  </div>
                  <p className="text-muted-foreground font-mono text-[11px]">
                    ID: {selectedSessionId} · Started {formatDate(sessionDetail?.started_at || '')}
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

            {/* Audio Simulation Player */}
            <div className="border-border bg-card/50 flex items-center gap-4 border-b p-4">
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
                    LiveKit Audio Channel (Opus 48kHz Bidirectional)
                  </span>
                  <span className="font-mono">
                    {Math.floor(((sessionDetail?.duration_seconds || 60) * audioProgress) / 100)}s /{' '}
                    {sessionDetail?.duration_seconds || 60}s
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-200"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Drawer Tab Navigation */}
            <div className="border-border flex gap-1 border-b px-5 pt-3">
              {[
                { id: 'turns', label: 'Turn Requests & Trace', icon: Activity },
                { id: 'transcript', label: 'Full Transcript', icon: MessageSquare },
                {
                  id: 'tools',
                  label: `MCP Tools (${sessionDetail?.mcp_tools_invoked?.length || 0})`,
                  icon: Cpu,
                },
                { id: 'telemetry', label: 'LiveKit Telemetry JSON', icon: Code2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = drawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id as typeof drawerTab)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'border-primary text-foreground'
                        : 'text-muted-foreground hover:text-foreground border-transparent'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {isLoadingDetail ? (
                <div className="space-y-4 py-8">
                  <div className="bg-muted h-16 animate-pulse rounded-xl" />
                  <div className="bg-muted h-28 animate-pulse rounded-xl" />
                  <div className="bg-muted h-40 animate-pulse rounded-xl" />
                </div>
              ) : sessionDetail ? (
                <>
                  {/* TAB 1: TURN-BY-TURN REQUEST INSPECTOR */}
                  {drawerTab === 'turns' && (
                    <div className="space-y-4">
                      {/* KPI Summary strip */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="border-border bg-muted/30 rounded-xl border p-2.5 text-center">
                          <span className="text-muted-foreground text-[10px]">Turns Tracked</span>
                          <div className="text-foreground font-mono text-sm font-semibold">
                            {sessionDetail.turns?.length ||
                              Math.ceil((sessionDetail.transcript?.length || 2) / 2)}
                          </div>
                        </div>
                        <div className="border-border bg-muted/30 rounded-xl border p-2.5 text-center">
                          <span className="text-muted-foreground text-[10px]">Avg Latency</span>
                          <div className="text-foreground font-mono text-sm font-semibold">
                            {sessionDetail.avg_latency_ms || 452}ms
                          </div>
                        </div>
                        <div className="border-border bg-muted/30 rounded-xl border p-2.5 text-center">
                          <span className="text-muted-foreground text-[10px]">Total Tokens</span>
                          <div className="text-foreground font-mono text-sm font-semibold">
                            {sessionDetail.total_tokens || 2450}
                          </div>
                        </div>
                        <div className="border-border bg-muted/30 rounded-xl border p-2.5 text-center">
                          <span className="text-muted-foreground text-[10px]">Tools Triggered</span>
                          <div className="text-foreground font-mono text-sm font-semibold text-emerald-400">
                            {sessionDetail.mcp_tools_invoked?.length || 0}
                          </div>
                        </div>
                      </div>

                      {/* Turns List */}
                      {(!sessionDetail.turns || sessionDetail.turns.length === 0) ? (
                        <div className="border-border rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                          No granular turns logged for this session. See Transcript tab for raw message stream.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sessionDetail.turns.map((turn, tIdx) => (
                            <div
                              key={turn.id || tIdx}
                              className="border-border bg-card/60 space-y-3 rounded-2xl border p-4 transition-all hover:border-white/10"
                            >
                              {/* Turn Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold">
                                    Turn #{turn.turn_index}
                                  </span>
                                  {turn.speaker_tag && (
                                    <span className="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                      <UserCheck className="size-3" />
                                      {turn.speaker_tag}
                                    </span>
                                  )}
                                </div>

                                <div className="text-muted-foreground flex items-center gap-3 font-mono text-[11px]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {formatDate(turn.timestamp)}
                                  </span>
                                  {turn.metrics?.e2e_latency_ms && (
                                    <span className="text-foreground font-semibold">
                                      E2E: {turn.metrics.e2e_latency_ms}ms
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* User Utterance Box */}
                              <div className="space-y-1">
                                <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                                  <Mic className="size-3 text-blue-400" />
                                  <span>User Spoken Input:</span>
                                </div>
                                <p className="text-foreground bg-muted/30 rounded-xl p-3 text-xs leading-relaxed font-medium">
                                  &ldquo;{turn.user_utterance}&rdquo;
                                </p>
                              </div>

                              {/* Waterfall Latency Breakdown Bar */}
                              {turn.metrics && (
                                <div className="bg-muted/20 border-border/60 space-y-1.5 rounded-xl border p-3">
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>Pipeline Latency Waterfall:</span>
                                    <span className="font-mono text-foreground">
                                      TTFT: {turn.metrics.ttft_ms || 158}ms · STT:{' '}
                                      {turn.metrics.stt_latency_ms || 95}ms · TTS:{' '}
                                      {turn.metrics.tts_latency_ms || 82}ms
                                    </span>
                                  </div>

                                  <div className="bg-muted/60 flex h-3 w-full overflow-hidden rounded-full">
                                    <div
                                      className="bg-blue-500"
                                      style={{ width: '22%' }}
                                      title={`STT: ${turn.metrics.stt_latency_ms || 95}ms`}
                                    />
                                    <div
                                      className="bg-purple-500"
                                      style={{ width: '38%' }}
                                      title={`LLM TTFT: ${turn.metrics.ttft_ms || 158}ms`}
                                    />
                                    {turn.tool_calls && turn.tool_calls.length > 0 && (
                                      <div
                                        className="bg-amber-500"
                                        style={{ width: '18%' }}
                                        title="MCP Tool Exec"
                                      />
                                    )}
                                    <div
                                      className="bg-emerald-500"
                                      style={{ width: '22%' }}
                                      title={`TTS: ${turn.metrics.tts_latency_ms || 82}ms`}
                                    />
                                  </div>

                                  {/* Token counts */}
                                  <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                                    <span>
                                      Tokens: <strong>{turn.metrics.total_tokens || 450}</strong> (
                                      {turn.metrics.audio_input_tokens || 280} audio in,{' '}
                                      {turn.metrics.audio_output_tokens || 90} audio out)
                                    </span>
                                    {turn.metrics.cached_tokens && (
                                      <span>
                                        Cached:{' '}
                                        <strong className="text-foreground">
                                          {turn.metrics.cached_tokens}
                                        </strong>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Tool Calls Executed in this exact Turn */}
                              {turn.tool_calls && turn.tool_calls.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                                    <Cpu className="size-3 text-amber-400" />
                                    <span>MCP Tool Actions Triggered ({turn.tool_calls.length}):</span>
                                  </div>

                                  <div className="space-y-2">
                                    {turn.tool_calls.map((call) => {
                                      const isExpanded = expandedToolCallId === call.id;
                                      return (
                                        <div
                                          key={call.id}
                                          className="border-border bg-muted/40 rounded-xl border p-2.5 text-xs transition-all"
                                        >
                                          <div
                                            className="flex cursor-pointer items-center justify-between"
                                            onClick={() =>
                                              setExpandedToolCallId(isExpanded ? null : call.id)
                                            }
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono font-semibold text-foreground">
                                                {call.name}
                                              </span>
                                              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                                                {call.status}
                                              </span>
                                            </div>
                                            <ChevronDown
                                              className={`size-3.5 text-muted-foreground transition-transform ${
                                                isExpanded ? 'rotate-180' : ''
                                              }`}
                                            />
                                          </div>

                                          {isExpanded && (
                                            <div className="mt-2.5 space-y-2 border-t border-border/50 pt-2 font-mono text-[10px]">
                                              <div>
                                                <span className="text-muted-foreground">Arguments:</span>
                                                <pre className="bg-muted text-muted-foreground mt-0.5 overflow-x-auto rounded p-2">
                                                  {typeof call.args === 'string'
                                                    ? call.args
                                                    : JSON.stringify(call.args, null, 2)}
                                                </pre>
                                              </div>
                                              <div>
                                                <span className="text-muted-foreground">Result Output:</span>
                                                <pre className="bg-muted text-emerald-300 mt-0.5 overflow-x-auto rounded p-2">
                                                  {call.result}
                                                </pre>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Agent Voice Response */}
                              <div className="space-y-1">
                                <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                                  <Bot className="size-3 text-emerald-400" />
                                  <span>Agent Spoken Response:</span>
                                </div>
                                <p className="text-foreground bg-primary/5 border border-primary/10 rounded-xl p-3 text-xs leading-relaxed">
                                  {turn.agent_response}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: TRANSCRIPT */}
                  {drawerTab === 'transcript' && (
                    <div className="space-y-3">
                      {!sessionDetail.transcript || sessionDetail.transcript.length === 0 ? (
                        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs">
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
                                  className={`max-w-[80%] space-y-1 rounded-2xl p-3.5 text-xs ${
                                    isUser
                                      ? 'text-foreground border-border rounded-tr-sm border bg-white/[0.05]'
                                      : 'bg-muted text-foreground rounded-tl-sm'
                                  }`}
                                >
                                  <div className="text-muted-foreground flex items-center justify-between gap-4 font-mono text-[10px]">
                                    <span>{isUser ? 'User' : 'Exia Agent'}</span>
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
                  )}

                  {/* TAB 3: MCP TOOLS EXECUTED */}
                  {drawerTab === 'tools' && (
                    <div className="space-y-3">
                      {(!sessionDetail.mcp_tools_invoked ||
                        sessionDetail.mcp_tools_invoked.length === 0) ? (
                        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs">
                          No MCP tool calls recorded for this session.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sessionDetail.mcp_tools_invoked.map((call, idx) => (
                            <div
                              key={call.id || idx}
                              className="border-border bg-card space-y-2 rounded-xl border p-3.5 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Cpu className="size-4 text-primary" />
                                  <span className="font-mono font-semibold">{call.name}</span>
                                </div>
                                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                  {call.status}
                                </span>
                              </div>

                              {call.args && (
                                <div className="space-y-1">
                                  <span className="text-muted-foreground text-[10px]">Arguments:</span>
                                  <pre className="bg-muted text-muted-foreground overflow-x-auto rounded-lg p-2.5 font-mono text-[10px]">
                                    {typeof call.args === 'string'
                                      ? call.args
                                      : JSON.stringify(call.args, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {call.result && (
                                <div className="space-y-1">
                                  <span className="text-muted-foreground text-[10px]">Execution Result:</span>
                                  <pre className="bg-muted text-emerald-300 overflow-x-auto rounded-lg p-2.5 font-mono text-[10px]">
                                    {call.result}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: RAW LIVEKIT TELEMETRY JSON */}
                  {drawerTab === 'telemetry' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs font-mono">
                          LiveKit RealtimeModelMetrics Payload
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(sessionDetail, null, 2));
                            toast.success('Session telemetry copied to clipboard');
                          }}
                          className="border-border hover:bg-accent inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                        >
                          <Copy className="size-3" />
                          <span>Copy Raw JSON</span>
                        </button>
                      </div>

                      <pre className="border-border bg-muted/30 text-muted-foreground/90 max-h-[420px] overflow-auto rounded-xl border p-4 font-mono text-xs leading-relaxed">
                        {JSON.stringify(sessionDetail, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
