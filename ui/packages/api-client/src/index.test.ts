import { describe, expect, it } from 'vitest';

import { ApiError, createApiClient, createRequestFn, InMemoryTokenStorage } from './index';

interface CapturedCall {
  url: string;
  init?: RequestInit;
}

/** Fetch double that records every call and replies with a fixed JSON body. */
function captureJsonFetch(body: unknown, status = 200) {
  const calls: CapturedCall[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    calls.push({ url: typeof input === 'string' ? input : String(input), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }) as Response;
  }) as typeof fetch;

  return { calls, fetchImpl };
}

describe('auth.login', () => {
  it('POSTs to /signin and normalizes the backend user shape', async () => {
    const { calls, fetchImpl } = captureJsonFetch({
      access_token: 'tok-123',
      refresh_token: 'r-123',
      user: { user_id: 'u1', email: 'ann@example.com', name: 'Ann' },
    });
    const api = createApiClient({ baseUrl: 'http://test/api', fetchImpl });

    const res = await api.auth.login('ann@example.com', 'secret');

    expect(res.access_token).toBe('tok-123');
    expect(res.refresh_token).toBe('r-123');
    expect(res.user).toEqual({ id: 'u1', email: 'ann@example.com', name: 'Ann' });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://test/api/signin');
    expect(calls[0].init?.method).toBe('POST');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      email: 'ann@example.com',
      password: 'secret',
    });
  });

  it('falls back across user_id/id and email, and omits user when absent', async () => {
    const withId = createApiClient({
      baseUrl: 'http://test/api',
      fetchImpl: captureJsonFetch({ access_token: 't', user: { id: 'legacy-id' } }).fetchImpl,
    });
    expect(await withId.auth.login('bob@example.com', 'pw')).toMatchObject({
      user: { id: 'legacy-id', email: 'bob@example.com' },
    });

    const withoutUser = createApiClient({
      baseUrl: 'http://test/api',
      fetchImpl: captureJsonFetch({ access_token: 't' }).fetchImpl,
    });
    expect((await withoutUser.auth.login('bob@example.com', 'pw')).user).toBeUndefined();
  });
});

describe('createRequestFn', () => {
  it('attaches a Bearer header when a token is stored', async () => {
    const { calls, fetchImpl } = captureJsonFetch({ ok: true });
    const storage = new InMemoryTokenStorage();
    await storage.setToken('tok-123');
    const request = createRequestFn({ baseUrl: 'http://test/api', tokenStorage: storage, fetchImpl });

    await request('/sessions');

    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer tok-123');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends no Authorization header without a stored token', async () => {
    const { calls, fetchImpl } = captureJsonFetch({ ok: true });
    const request = createRequestFn({ baseUrl: 'http://test/api', fetchImpl });

    await request('/sessions');

    expect((calls[0].init?.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('throws ApiError with backend detail on non-OK responses', async () => {
    const { fetchImpl } = captureJsonFetch({ detail: 'Invalid credentials' }, 401);
    const request = createRequestFn({ baseUrl: 'http://test/api', fetchImpl });

    const err = await request('/signin').catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect((err as ApiError).message).toBe('Invalid credentials');
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    const fetchImpl = (async () =>
      new Response('oops', { status: 500 }) as Response) as typeof fetch;
    const request = createRequestFn({ baseUrl: 'http://test/api', fetchImpl });

    const err = await request('/signin').catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).message).toBe('Request failed with status 500');
  });
});
