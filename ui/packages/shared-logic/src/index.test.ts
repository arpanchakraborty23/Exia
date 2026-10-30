import { describe, expect, it } from 'vitest';

import { clamp, formatCount, formatDuration, formatRelativeTime, isValidEndpointUrl } from './index';

describe('formatDuration', () => {
  it('renders hours, minutes and seconds', () => {
    expect(formatDuration(3725)).toBe('1h 02m 05s');
    expect(formatDuration(3600)).toBe('1h 00m 00s');
    expect(formatDuration(125)).toBe('02m 05s');
    expect(formatDuration(45)).toBe('45s');
  });

  it('falls back to an em dash for missing/invalid input', () => {
    expect(formatDuration(undefined)).toBe('—');
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(Number.NaN)).toBe('—');
    expect(formatDuration(-5)).toBe('—');
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-01-15T12:00:00Z');
  const secondsAgo = (s: number) => new Date(now - s * 1000).toISOString();

  it('buckets recent deltas', () => {
    expect(formatRelativeTime(secondsAgo(30), now)).toBe('just now');
    expect(formatRelativeTime(secondsAgo(5 * 60), now)).toBe('5m ago');
    expect(formatRelativeTime(secondsAgo(90 * 60), now)).toBe('1h ago');
    expect(formatRelativeTime(secondsAgo(23 * 60 * 60), now)).toBe('23h ago');
    expect(formatRelativeTime(secondsAgo(3 * 24 * 60 * 60), now)).toBe('3d ago');
    expect(formatRelativeTime(secondsAgo(6 * 24 * 60 * 60), now)).toBe('6d ago');
  });

  it('uses a locale date beyond a week and handles invalid input', () => {
    const monthOld = formatRelativeTime(secondsAgo(30 * 24 * 60 * 60), now);
    expect(monthOld).toContain('2025');

    expect(formatRelativeTime('not-a-date', now)).toBe('—');
  });
});

describe('formatCount', () => {
  it('abbreviates large counters', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
    expect(formatCount(1234)).toBe('1.2k');
    expect(formatCount(3456789)).toBe('3.5M');
    expect(formatCount(-1500)).toBe('-1.5k');
  });

  it('falls back to an em dash for missing/invalid input', () => {
    expect(formatCount(undefined)).toBe('—');
    expect(formatCount(Number.NaN)).toBe('—');
  });
});

describe('clamp', () => {
  it('keeps values inside bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(0.5, 1, 3)).toBe(1);
  });
});

describe('isValidEndpointUrl', () => {
  it('accepts http(s) and ws(s) endpoints', () => {
    expect(isValidEndpointUrl('http://localhost:12568/api')).toBe(true);
    expect(isValidEndpointUrl('https://exia.example.com/api')).toBe(true);
    expect(isValidEndpointUrl('ws://localhost:8765')).toBe(true);
    expect(isValidEndpointUrl('wss://mcp.example.com/sse')).toBe(true);
  });

  it('rejects other schemes and garbage', () => {
    expect(isValidEndpointUrl('')).toBe(false);
    expect(isValidEndpointUrl('ftp://files.example.com')).toBe(false);
    expect(isValidEndpointUrl('not a url')).toBe(false);
  });
});
