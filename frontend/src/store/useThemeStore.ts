import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  initTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem('epostal-theme') as Theme) || 'system',
  setTheme: (theme) => {
    localStorage.setItem('epostal-theme', theme)
    set({ theme })
    get().initTheme()
  },
  initTheme: () => {
    const { theme } = get()
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
}))
