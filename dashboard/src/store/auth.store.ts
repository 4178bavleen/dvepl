import { create } from 'zustand';
import { useERPStore } from './erpStore';

interface AuthStore {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: Boolean(localStorage.getItem('token')),
  login: () => set({ isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false });
    useERPStore.getState().setUserId('');
  },
}));
