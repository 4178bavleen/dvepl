import { create } from 'zustand';

interface UIStore {
  isSidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  setCommandPaletteOpen: (val: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarCollapsed: false,
  isCommandPaletteOpen: false,
  setSidebarCollapsed: (val) => set({ isSidebarCollapsed: val }),
  setCommandPaletteOpen: (val) => set({ isCommandPaletteOpen: val }),
}));
