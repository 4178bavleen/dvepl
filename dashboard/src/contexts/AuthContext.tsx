import React, { createContext, useContext } from 'react';
import { useERPStore } from '@/store/erpStore';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth';
import { User } from '@/types/erp';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const currentUserId = useERPStore(state => state.currentUserId);
  const users = useERPStore(state => state.users);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const clearAuth = useAuthStore(state => state.logout);
  
  const currentUser = users.find(u => u.id === currentUserId) || null;

  const logout = () => {
    void authService.logout();
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user: currentUser, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
