import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// sw.js registers listeners against global `self`, `caches`, and `fetch`.
// Each test re-imports the module after setting up fresh mocks so the
// handlers are always bound to the current test's doubles.

describe('Service Worker fetch handler', () => {
  let fetchHandler;
  let mockCaches;

  beforeEach(async () => {
    fetchHandler = null;

    mockCaches = {
      open:   vi.fn().mockResolvedValue({ addAll: vi.fn().mockResolvedValue(undefined) }),
      match:  vi.fn().mockResolvedValue(undefined),
      keys:   vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true),
    };

    global.self = {
      addEventListener: (event, handler) => {
        if (event === 'fetch') fetchHandler = handler;
      },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
    };
    global.caches = mockCaches;
    global.fetch   = vi.fn();

    vi.resetModules();
    await import('./sw.js');
  });

  afterEach(() => {
    delete global.self;
    delete global.caches;
    delete global.fetch;
  });

  // ── helpers ──────────────────────────────────────────────────────────────

  function makeEvent(mode, url = 'http://localhost:3000/') {
    const request = { mode, url };
    let respondWithPromise;
    return {
      request,
      respondWith(p) { respondWithPromise = p; },
      get result()   { return respondWithPromise; },
    };
  }

  // ── navigate requests ─────────────────────────────────────────────────────

  it('navigate: returns cached /index.html when available', async () => {
    const cached = new Response('<html/>');
    mockCaches.match.mockResolvedValue(cached);

    const event = makeEvent('navigate');
    fetchHandler(event);

    expect(await event.result).toBe(cached);
    expect(mockCaches.match).toHaveBeenCalledWith('/index.html');
  });

  it('navigate: falls back to network when cache misses', async () => {
    const networkRes = new Response('<html/>');
    mockCaches.match.mockResolvedValue(undefined);
    global.fetch.mockResolvedValue(networkRes);

    const event = makeEvent('navigate');
    fetchHandler(event);

    expect(await event.result).toBe(networkRes);
    expect(global.fetch).toHaveBeenCalledWith(event.request);
  });

  it('navigate: catches network failure and retries cache (the fix)', async () => {
    const fallback = new Response('<html/>');
    mockCaches.match
      .mockResolvedValueOnce(undefined)  // 1st call: cache miss → triggers fetch
      .mockResolvedValueOnce(fallback);  // 2nd call: inside .catch fallback
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const event = makeEvent('navigate');
    fetchHandler(event);

    expect(await event.result).toBe(fallback);
    expect(mockCaches.match).toHaveBeenCalledTimes(2);
  });

  it('navigate: never uses event.request as cache key', async () => {
    mockCaches.match.mockResolvedValue(new Response('<html/>'));

    const event = makeEvent('navigate');
    fetchHandler(event);
    await event.result;

    expect(mockCaches.match).not.toHaveBeenCalledWith(event.request);
    expect(mockCaches.match).toHaveBeenCalledWith('/index.html');
  });

  // ── non-navigate requests ─────────────────────────────────────────────────

  it('non-navigate: uses the original request as cache key', async () => {
    const cssRes = new Response('body{}');
    mockCaches.match.mockResolvedValue(cssRes);

    const event = makeEvent('cors', 'http://localhost:3000/style.css');
    fetchHandler(event);

    expect(await event.result).toBe(cssRes);
    expect(mockCaches.match).toHaveBeenCalledWith(event.request);
  });

  it('non-navigate: falls back to network when cache misses', async () => {
    const networkRes = new Response('body{}');
    mockCaches.match.mockResolvedValue(undefined);
    global.fetch.mockResolvedValue(networkRes);

    const event = makeEvent('cors', 'http://localhost:3000/app.js');
    fetchHandler(event);

    expect(await event.result).toBe(networkRes);
    expect(global.fetch).toHaveBeenCalledWith(event.request);
  });
});
