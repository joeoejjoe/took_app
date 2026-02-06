import { create } from 'zustand';

type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark',
  toggleTheme: () =>
    set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
  setTheme: (mode: ThemeMode) => set({ mode }),
}));
