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
