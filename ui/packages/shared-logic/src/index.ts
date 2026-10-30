/**
 * @exia/shared-logic
 *
 * Platform-agnostic helpers. No DOM, no React Native imports — anything
 * that needs platform APIs belongs in the app layer or behind an adapter.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Formats a duration in seconds as "1h 02m 03s" / "02m 03s" / "03s". */
export function formatDuration(totalSeconds?: number | null): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) return '—';
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${pad(m)}m ${pad(s)}s`;
  return `${pad(s)}s`;
}

/** "just now" | "5m ago" | "2h ago" | "3d ago" | locale date for older. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffSeconds = Math.round((now - then) / 1000);
  if (diffSeconds < 60) return 'just now';
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString();
}

/** 1234 → "1.2k", 3456789 → "3.5M" — for token/latency counters. */
export function formatCount(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (Math.abs(value) < 1000) return String(Math.round(value));
  if (Math.abs(value) < 1_000_000) return `${(value / 1000).toFixed(1)}k`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

/** Accepts http(s) URLs and ws(s) endpoints (MCP SSE server URLs). */
export function isValidEndpointUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol);
  } catch {
    return false;
  }
}
