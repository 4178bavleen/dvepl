import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as loginApi } from "../api/auth";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'agent';
  company?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGithub: () => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<string, User> = {
  'admin@chatflow.com': {
    id: '1',
    email: 'admin@chatflow.com',
    name: 'Admin User',
    role: 'admin',
    company: 'ChatFlow Inc.',
  },
  'john@company.com': {
    id: '2',
    email: 'john@company.com',
    name: 'John Doe',
    role: 'user',
    company: 'Acme Corp',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('dvepl_user');
    return stored ? JSON.parse(stored) : null;
  });




const login = useCallback(
  async (email: string, password: string) => {
    try {
      const response = await loginApi(email, password);

      const data = response.data;

      if (!data.success) return false;

      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        company: data.user.company,
        role:
          data.user.roles.includes("Admin")
            ? "admin"
            : "user",
      };

      setUser(user);

      localStorage.setItem("dvepl_user", JSON.stringify(user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("expiresAt", data.expiresAt.toString());

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.log(error);

      return {
        success: false,
      };
    }
  },
  []
);

const logout = useCallback(() => {
  setUser(null);

  localStorage.removeItem("dvepl_user");
  localStorage.removeItem("token");
  localStorage.removeItem("expiresAt");
}, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
