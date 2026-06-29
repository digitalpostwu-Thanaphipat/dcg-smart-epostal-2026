import { describe, it, expect, vi, beforeEach } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('ApiClient auth payload', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.resetModules();
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          hostname: 'localhost',
        },
      },
      configurable: true,
    });
  });

  async function loadRequest() {
    const client = await import('../frontend/src/api/client');
    return client.request;
  }

  it('uses the persisted Zustand session token for API requests', async () => {
    localStorage.setItem(
      'epostal-auth-storage',
      JSON.stringify({
        state: {
          user: {
            email: 'postal@example.test',
            sessionToken: 'signed-session-token',
          },
          isAuthenticated: true,
        },
        version: 0,
      }),
    );

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true }),
    } as Response);

    const request = await loadRequest();
    await request('systemHealthCheck');

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.authToken).toBe('signed-session-token');
  });

  it('keeps legacy epostal_user session token compatibility', async () => {
    localStorage.setItem(
      'epostal_user',
      JSON.stringify({
        email: 'legacy@example.test',
        sessionToken: 'legacy-session-token',
      }),
    );

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ success: true }),
    } as Response);

    const request = await loadRequest();
    await request('systemHealthCheck');

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.authToken).toBe('legacy-session-token');
  });

  it('returns a config error when no API URL is available', async () => {
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          hostname: 'app.example.test',
        },
      },
      configurable: true,
    });
    const fetchMock = vi.spyOn(global, 'fetch');

    const request = await loadRequest();
    const response = await request('systemHealthCheck');

    expect(response).toEqual({ success: false, error: 'API_URL_MISSING' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
