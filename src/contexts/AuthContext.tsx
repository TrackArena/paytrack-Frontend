import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, getErrorMessage } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  workspaceName: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setUser = (user: User | null) => {
    setState({ user, isLoading: false, isAuthenticated: !!user });
  };

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('workspace_id');
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // On mount, verify token
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.data.accessToken);
    if (data.data.workspace?.id) {
      localStorage.setItem('workspace_id', data.data.workspace.id);
    }
    setUser(data.data.user);
  };

  const register = async (input: RegisterData) => {
    const { data } = await api.post('/auth/register', input);
    localStorage.setItem('access_token', data.data.accessToken);
    if (data.data.workspace?.id) {
      localStorage.setItem('workspace_id', data.data.workspace.id);
    }
    setUser(data.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('workspace_id');
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
