import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  email: string;
  fullName: string;
  role: string;
  department: string;
  picture?: string;
  sessionToken?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user: User) => set({ user, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('epostal_user');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'epostal-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
