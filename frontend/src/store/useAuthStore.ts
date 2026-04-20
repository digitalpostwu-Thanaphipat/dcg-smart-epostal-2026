import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  email: string;
  fullName: string;
  role: string;
  department: string;
  picture?: string;
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
      login: (user) => {
        set({ user, isAuthenticated: true });
        localStorage.setItem('epostal_user', JSON.stringify(user));
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
        localStorage.removeItem('epostal_user');
      },
    }),
    {
      name: 'epostal-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
