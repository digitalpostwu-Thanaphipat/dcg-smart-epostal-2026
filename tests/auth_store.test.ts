import { describe, it, expect, beforeEach, vi } from 'vitest';

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

Object.defineProperty(global, 'localStorage', { value: localStorageMock, configurable: true });

describe('useAuthStore session lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  async function loadAuthStore() {
    const module = await import('../frontend/src/store/useAuthStore');
    const { useAuthStore } = module;
    useAuthStore.setState({ user: null, isAuthenticated: false });
    return useAuthStore;
  }

  it('persists login state with the session token used by ApiClient', async () => {
    const useAuthStore = await loadAuthStore();

    useAuthStore.getState().login({
      email: 'postal@example.test',
      fullName: 'Postal User',
      role: 'Postal',
      department: 'Mailroom',
      sessionToken: 'signed-session-token',
    });

    const persisted = JSON.parse(String(localStorage.getItem('epostal-auth-storage')));
    expect(persisted.state.user.sessionToken).toBe('signed-session-token');
    expect(persisted.state.isAuthenticated).toBe(true);
  });

  it('clears active and legacy auth state on logout', async () => {
    const useAuthStore = await loadAuthStore();

    localStorage.setItem('epostal_user', JSON.stringify({ sessionToken: 'legacy-token' }));
    useAuthStore.getState().login({
      email: 'postal@example.test',
      fullName: 'Postal User',
      role: 'Postal',
      department: 'Mailroom',
      sessionToken: 'signed-session-token',
    });

    useAuthStore.getState().logout();

    const persisted = JSON.parse(String(localStorage.getItem('epostal-auth-storage')));
    expect(localStorage.getItem('epostal_user')).toBeNull();
    expect(persisted.state.user).toBeNull();
    expect(persisted.state.isAuthenticated).toBe(false);
  });
});

// [P1] Tracking OTP sessions must never be treated as staff sessions.
function makeJwtWithScope(scope: string): string {
  const enc = (o: object) =>
    Buffer.from(JSON.stringify(o), 'utf-8').toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `eyJhbGciOiJIUzI1NiJ9.${enc({ scope, iat: now, exp: now + 900 })}.signature-placeholder`;
}

describe('useAuthStore scope separation (P1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  async function loadAuthStore() {
    const module = await import('../frontend/src/store/useAuthStore');
    const { useAuthStore } = module;
    useAuthStore.setState({ user: null, isAuthenticated: false, scope: 'staff' });
    return useAuthStore;
  }

  const baseUser = {
    email: 'postal@example.test',
    fullName: 'Postal User',
    role: 'Postal',
    department: 'Mailroom',
  };

  it('derives scope=tracking from the JWT claim when a tracking token is passed', async () => {
    const useAuthStore = await loadAuthStore();

    useAuthStore.getState().login({
      ...baseUser,
      sessionToken: makeJwtWithScope('tracking'),
    });

    expect(useAuthStore.getState().scope).toBe('tracking');
    expect(useAuthStore.getState().user?.scope).toBe('tracking');
  });

  it('keeps scope=staff for staff tokens and lets an explicit scope win', async () => {
    const useAuthStore = await loadAuthStore();

    useAuthStore.getState().login({ ...baseUser, sessionToken: 'plain-staff-token' });
    expect(useAuthStore.getState().scope).toBe('staff');

    useAuthStore.getState().login({
      ...baseUser,
      sessionToken: makeJwtWithScope('tracking'),
      scope: 'staff',
    });
    expect(useAuthStore.getState().scope).toBe('staff');
  });

  it('reclassifies a persisted tracking-scope legacy session on rehydration', async () => {
    const legacy = JSON.stringify({
      state: {
        user: { ...baseUser, sessionToken: makeJwtWithScope('tracking') },
        isAuthenticated: true,
      },
      version: 0,
    });
    localStorage.setItem('epostal-auth-storage', legacy);

    const { useAuthStore } = await import('../frontend/src/store/useAuthStore');
    await new Promise((r) => setTimeout(r, 20));

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().scope).toBe('tracking');
  });

  it('resets scope to staff on logout', async () => {
    const useAuthStore = await loadAuthStore();

    useAuthStore.getState().login({ ...baseUser, sessionToken: makeJwtWithScope('tracking') });
    expect(useAuthStore.getState().scope).toBe('tracking');

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().scope).toBe('staff');
  });
});
