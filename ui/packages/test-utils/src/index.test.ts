import { describe, expect, it } from 'vitest';

import { createMockFetch, createMockTokenStorage } from './index';

describe('createMockFetch', () => {
  it('serves registered routes as JSON', async () => {
    const fetchMock = createMockFetch({ '/signin': { access_token: 'tok' } });

    const res = await fetchMock('http://test/api/signin');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ access_token: 'tok' });
  });

  it('throws loudly on unregistered routes', async () => {
    const fetchMock = createMockFetch({ '/signin': {} });

    await expect(fetchMock('http://test/api/other')).rejects.toThrow(
      'mockFetch: no route registered for http://test/api/other',
    );
  });
});

describe('MockTokenStorage', () => {
  it('round-trips tokens and exposes the current value', async () => {
    const storage = createMockTokenStorage();
    expect(storage.current).toBeNull();
    expect(await storage.getToken()).toBeNull();

    await storage.setToken('tok-123');
    expect(storage.current).toBe('tok-123');
    expect(await storage.getToken()).toBe('tok-123');

    await storage.setToken(null);
    expect(await storage.getToken()).toBeNull();
  });

  it('accepts an initial token', async () => {
    const storage = createMockTokenStorage('seeded');
    expect(await storage.getToken()).toBe('seeded');
  });
});
