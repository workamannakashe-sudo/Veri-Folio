'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserSession, 
  getStoredToken, 
  setStoredToken, 
  getStoredUser, 
  setStoredUser,
  apiFetch
} from '@/lib/api';

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  loginAsDemoRole: (role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER') => Promise<void>;
  logout: () => void;
  switchRole: (role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  loginAsDemoRole: async () => {},
  logout: () => {},
  switchRole: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from storage on mount
  useEffect(() => {
    const existingToken = getStoredToken();
    const existingUser = getStoredUser();
    if (existingToken && existingUser) {
      setToken(existingToken);
      setUser(existingUser);
    }
    setIsLoading(false);
  }, []);

  const loginAsDemoRole = async (role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER') => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ accessToken: string; user: UserSession }>('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role })
      });

      setStoredToken(data.accessToken);
      setStoredUser(data.user);
      setToken(data.accessToken);
      setUser(data.user);

      // Navigate to dedicated role dashboard
      if (role === 'STUDENT') router.push('/dashboard/student');
      else if (role === 'MENTOR') router.push('/dashboard/mentor');
      else if (role === 'ADMIN') router.push('/dashboard/admin');
      else if (role === 'VIEWER') router.push('/dashboard/viewer');
    } catch (err: any) {
      console.error('Demo login error:', err);
      // Fallback local mock if backend is momentarily unreachable
      const fallbackUser: UserSession = {
        userId: `usr-${role.toLowerCase()}-1`,
        email: `${role.toLowerCase()}@school1.edu`,
        role,
        schoolId: 'school-demo-1',
        isMinor: role === 'STUDENT',
        fullName: role === 'STUDENT' ? 'Rohan Sharma' : role === 'MENTOR' ? 'Dr. Anand Verma' : 'School Administrator'
      };
      setStoredUser(fallbackUser);
      setUser(fallbackUser);
      if (role === 'STUDENT') router.push('/dashboard/student');
      else if (role === 'MENTOR') router.push('/dashboard/mentor');
      else if (role === 'ADMIN') router.push('/dashboard/admin');
      else if (role === 'VIEWER') router.push('/dashboard/viewer');
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'VIEWER') => {
    await loginAsDemoRole(role);
  };

  const logout = () => {
    setStoredToken(null);
    setStoredUser(null);
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginAsDemoRole,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
