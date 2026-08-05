import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TrackingUser {
  email: string;
  fullName: string;
  department: string;
  sessionToken: string;
}

interface TrackingAuthState {
  user: TrackingUser | null;
  login: (user: TrackingUser) => void;
  logout: () => void;
}

// [P1] Tracking session lives in sessionStorage (per-tab, cleared on tab close)
// and never touches the staff session in epostal-auth-storage.
export const useTrackingAuthStore = create<TrackingAuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user: TrackingUser) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'epostal-tracking-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
