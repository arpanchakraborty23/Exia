import { describe, expect, it } from 'vitest';

import { createApiClient, createRequestFn, InMemoryTokenStorage } from './index';

describe('Desktop Setup Wizard & Configuration Flow', () => {
  it('defaults to cloud API URL and allows switching to localhost', async () => {
    let currentUrl = 'https://exia-backend.vercel.app/api';
    const calls: string[] = [];

    const fetchImpl = (async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : String(input);
      calls.push(urlStr);
      return new Response(JSON.stringify({ status: 'ok', target: urlStr }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as Response;
    }) as typeof fetch;

    const api = createApiClient({
      baseUrl: () => currentUrl,
      fetchImpl,
    });

    // Step 2 Ping on Cloud
    const cloudHealth = await api.health.check();
    expect(cloudHealth.status).toBe('ok');
    expect(calls[0]).toBe('https://exia-backend.vercel.app/api/health');

    // Switch to Localhost
    currentUrl = 'http://127.0.0.1:8000/api';
    const localHealth = await api.health.check();
    expect(localHealth.status).toBe('ok');
    expect(calls[1]).toBe('http://127.0.0.1:8000/api/health');
  });

  it('handles Local Standalone Mode token without requiring cloud credentials', async () => {
    const tokenStorage = new InMemoryTokenStorage();
    const calls: { url: string; authHeader?: string }[] = [];

    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : String(input);
      const headers = (init?.headers as Record<string, string>) || {};
      calls.push({ url, authHeader: headers['Authorization'] });
      return new Response(JSON.stringify({ sessions: [], total: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as Response;
    }) as typeof fetch;

    const api = createApiClient({
      baseUrl: 'http://127.0.0.1:8000/api',
      tokenStorage,
      fetchImpl,
    });

    // Set local mode placeholder token
    await tokenStorage.setToken('exia-local-mode-token');
    const token = await tokenStorage.getToken();
    expect(token).toBe('exia-local-mode-token');

    // Requests now carry local bearer token
    await api.sessions.getSessions();
    expect(calls[0].authHeader).toBe('Bearer exia-local-mode-token');
  });

  it('measures real health check ping latency and reports connection status', async () => {
    const fetchImpl = (async (input: RequestInfo | URL): Promise<Response> => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 }) as Response;
    }) as typeof fetch;

    const api = createApiClient({
      baseUrl: 'http://127.0.0.1:8000/api',
      fetchImpl,
    });

    const res = await api.health.check();
    expect(res.status).toBe('ok');
    expect(res.latencyMs).toBeGreaterThanOrEqual(15);
  });
});
