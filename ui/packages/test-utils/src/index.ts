/**
 * @exia/test-utils
 *
 * Reusable test helpers. Network calls are always mocked — tests must not
 * require a live production backend.
 */

import { InMemoryTokenStorage, type TokenStorage } from '@exia/api-client';

/** Token storage mock that exposes its current value for assertions. */
export class MockTokenStorage implements TokenStorage {
  private store = new InMemoryTokenStorage();
  private value: string | null;

  constructor(initial: string | null = null) {
    this.value = initial;
    if (initial) {
      void this.store.setToken(initial);
    }
  }

  get current(): string | null {
    return this.value;
  }

  async getToken(): Promise<string | null> {
    return this.store.getToken();
  }

  async setToken(token: string | null): Promise<void> {
    this.value = token;
    await this.store.setToken(token);
  }
}

export function createMockTokenStorage(initial: string | null = null): MockTokenStorage {
  return new MockTokenStorage(initial);
}

/**
 * Minimal route-mocked fetch. Keys are URL suffixes (e.g. "/signin");
 * unmatched requests throw so tests fail loudly instead of silently.
 */
export function createMockFetch(routes: Record<string, unknown>): typeof fetch {
  return (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const match = Object.keys(routes).find((suffix) => url.endsWith(suffix));
    if (!match) {
      throw new Error(`mockFetch: no route registered for ${url}`);
    }
    return new Response(JSON.stringify(routes[match]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }) as Response;
  }) as typeof fetch;
}
