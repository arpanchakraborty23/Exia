'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from '@/lib/api';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  changePassword: (
    currentPass: string,
    newPass: string
  ) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();

    if (savedToken) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (emailOrUsername: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(emailOrUsername, password);
      if (res.access_token) {
        setToken(res.access_token);
        setStoredToken(res.access_token);
        const resolvedUser: User = res.user || {
          id: 'usr_' + Math.random().toString(36).substring(2, 7),
          email: emailOrUsername.includes('@')
            ? emailOrUsername
            : `${emailOrUsername}@homeassistant.local`,
          name: emailOrUsername.split('@')[0],
        };
        setUser(resolvedUser);
        setStoredUser(resolvedUser);
        return true;
      }
      setError('Authentication failed: no access token received.');
      return false;
    } catch (err: any) {
      const message = err?.message || 'Authentication sequence failed.';
      console.error('Login error:', err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.auth.logout();
    } finally {
      setToken(null);
      setUser(null);
      setStoredToken(null);
      setStoredUser(null);
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    try {
      const res = await api.auth.changePassword(currentPass, newPass);
      return { success: true, message: res.message || 'Password changed successfully' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to change password' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        logout,
        clearError,
        changePassword,
      }}
    >
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
