import { create } from 'zustand';
import { useERPStore } from './erpStore';

interface ThemeStore {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'light',
  toggleTheme: () => {
    useERPStore.getState().toggleTheme();
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
  },
}));
