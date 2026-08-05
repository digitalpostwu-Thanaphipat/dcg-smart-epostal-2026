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

const sessionStorageMock = (() => {
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
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock, configurable: true });

// [P1] Tracking sessions must live in sessionStorage (per-tab) and never
// collide with the staff session in epostal-auth-storage (localStorage).
describe('useTrackingAuthStore session isolation (P1)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.resetModules();
  });

  async function loadTrackingStore() {
    const { useTrackingAuthStore } = await import('../frontend/src/store/useTrackingAuthStore');
    useTrackingAuthStore.setState({ user: null });
    return useTrackingAuthStore;
  }

  it('persists the tracking session to sessionStorage only', async () => {
    const useTrackingAuthStore = await loadTrackingStore();

    useTrackingAuthStore.getState().login({
      email: 'receiver@example.test',
      fullName: 'Receiver User',
      department: 'Mailroom',
      sessionToken: 'tracking-token',
    });

    const persisted = JSON.parse(String(sessionStorage.getItem('epostal-tracking-storage')));
    expect(persisted.state.user.sessionToken).toBe('tracking-token');

    expect(localStorage.getItem('epostal-auth-storage')).toBeNull();
    expect(localStorage.getItem('epostal_user')).toBeNull();
  });

  it('clears the tracking session on logout', async () => {
    const useTrackingAuthStore = await loadTrackingStore();

    useTrackingAuthStore.getState().login({
      email: 'receiver@example.test',
      fullName: 'Receiver User',
      department: 'Mailroom',
      sessionToken: 'tracking-token',
    });
    useTrackingAuthStore.getState().logout();

    const persisted = JSON.parse(String(sessionStorage.getItem('epostal-tracking-storage')));
    expect(persisted.state.user).toBeNull();
  });
});
