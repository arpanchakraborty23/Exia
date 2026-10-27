'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/shadcn/utils';

export type BackendConnectionState = 'connected' | 'disconnected' | 'checking';

export interface BackendHealthInfo {
  state: BackendConnectionState;
  latencyMs: number | null;
  lastChecked: Date | null;
  error?: string;
}

export function useBackendHealth(pollIntervalMs: number = 6000): BackendHealthInfo & { retry: () => void } {
  const [health, setHealth] = useState<BackendHealthInfo>({
    state: 'checking',
    latencyMs: null,
    lastChecked: null,
  });

  const checkHealth = useCallback(async () => {
    try {
      const res = await api.health.check(2500);
      setHealth({
        state: 'connected',
        latencyMs: res.latencyMs,
        lastChecked: new Date(),
      });
    } catch (err: any) {
      setHealth({
        state: 'disconnected',
        latencyMs: null,
        lastChecked: new Date(),
        error: err?.message || 'Connection refused',
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, pollIntervalMs);

    const onFocus = () => checkHealth();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, [checkHealth, pollIntervalMs]);

  return {
    ...health,
    retry: checkHealth,
  };
}

interface BackendStatusProps {
  className?: string;
  variant?: 'badge' | 'minimal' | 'banner';
  showLatency?: boolean;
}

export function BackendStatus({
  className,
  variant = 'badge',
  showLatency = true,
}: BackendStatusProps) {
  const { state, latencyMs, retry } = useBackendHealth();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleManualRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRetrying(true);
    await retry();
    setTimeout(() => setIsRetrying(false), 500);
  };

  if (variant === 'minimal') {
    return (
      <div
        onClick={handleManualRetry}
        title={
          state === 'connected'
            ? `Backend Connected (${latencyMs ?? 0}ms)`
            : state === 'checking'
            ? 'Checking Backend Connection...'
            : 'Backend Disconnected (Click to retry)'
        }
        className={cn(
          'relative flex size-6 cursor-pointer items-center justify-center rounded-lg transition-colors',
          state === 'connected' && 'hover:bg-emerald-500/10 text-emerald-500',
          state === 'disconnected' && 'hover:bg-rose-500/10 text-rose-500',
          state === 'checking' && 'hover:bg-amber-500/10 text-amber-500',
          className
        )}
      >
        <span
          className={cn(
            'size-2 rounded-full transition-all',
            state === 'connected' && 'bg-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
            state === 'disconnected' && 'bg-rose-500 ring-4 ring-rose-500/20',
            state === 'checking' && 'bg-amber-500 animate-pulse'
          )}
        />
      </div>
    );
  }

  if (variant === 'banner' && state === 'disconnected') {
    return (
      <div
        className={cn(
          'border-rose-500/20 bg-rose-500/10 text-rose-300 flex items-center justify-between rounded-xl border px-3 py-2 text-xs backdrop-blur-md',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <WifiOff className="size-4 shrink-0 text-rose-400" />
          <span>
            <strong>Backend Offline:</strong> Local server is disconnected. Start server on port 12568.
          </span>
        </div>
        <button
          type="button"
          onClick={handleManualRetry}
          disabled={isRetrying}
          className="hover:bg-rose-500/20 flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-500/30 px-2 py-1 font-medium transition-colors"
        >
          <RefreshCw className={cn('size-3', isRetrying && 'animate-spin')} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // Default 'badge' variant
  return (
    <div
      onClick={handleManualRetry}
      title={
        state === 'connected'
          ? `Connected to local backend via /api/health (${latencyMs ?? 0}ms)`
          : 'Backend unreachable. Click to test connection.'
      }
      className={cn(
        'group flex cursor-pointer select-none items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
        state === 'connected' &&
          'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/15',
        state === 'disconnected' &&
          'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/15',
        state === 'checking' &&
          'border-amber-500/25 bg-amber-500/10 text-amber-400 hover:border-amber-500/40',
        className
      )}
    >
      {/* Animated status dot */}
      <div className="relative flex size-2 items-center justify-center">
        {state === 'connected' && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full transition-colors',
            state === 'connected' && 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]',
            state === 'disconnected' && 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]',
            state === 'checking' && 'bg-amber-400 animate-pulse'
          )}
        />
      </div>

      {/* Status label */}
      <div className="flex items-center gap-1.5">
        <span>
          {state === 'connected'
            ? 'Backend Connected'
            : state === 'disconnected'
            ? 'Backend Offline'
            : 'Checking Backend'}
        </span>

        {state === 'connected' && showLatency && latencyMs !== null && (
          <span className="font-mono text-[10px] opacity-70 group-hover:opacity-100">
            {latencyMs}ms
          </span>
        )}

        {state === 'disconnected' && (
          <RefreshCw
            className={cn(
              'size-3 text-rose-400 opacity-70 transition-transform group-hover:opacity-100',
              isRetrying && 'animate-spin'
            )}
          />
        )}
      </div>
    </div>
  );
}
