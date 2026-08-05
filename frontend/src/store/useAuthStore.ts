import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SessionScope = 'staff' | 'tracking';

interface User {
  email: string;
  fullName: string;
  role: string;
  department: string;
  picture?: string;
  sessionToken?: string;
  scope?: SessionScope;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  scope: SessionScope;
  login: (user: User) => void;
  logout: () => void;
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    return JSON.parse(atob(b64));
  } catch (_e) {
    return null;
  }
}

function deriveScope(sessionToken?: string): SessionScope {
  const payload = sessionToken ? decodeJwtPayload(sessionToken) : null;
  return payload?.scope === 'tracking' ? 'tracking' : 'staff';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      scope: 'staff',
      login: (user: User) => {
        // [P1] Derive scope from JWT claim when not explicitly provided.
        // Backend remains the source of truth (fail-closed on tracking-scope tokens).
        const scope: SessionScope = user.scope || deriveScope(user.sessionToken);
        set({ user: { ...user, scope }, isAuthenticated: true, scope });
      },
      logout: () => {
        localStorage.removeItem('epostal_user');
        set({ user: null, isAuthenticated: false, scope: 'staff' });
      },
    }),
    {
      name: 'epostal-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // [P1] Re-check legacy persisted sessions: a tracking-scope token must
      // never be treated as a staff session (redirected back to tracking page).
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<AuthState>) };
        if (merged.user?.sessionToken) {
          merged.scope = merged.user.scope || deriveScope(merged.user.sessionToken);
        }
        return merged;
      },
    }
  )
);
