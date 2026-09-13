import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getApiBaseUrl } from '../api/client.ts';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserProfile {
  id: string;
  discordId: string;
  discordUsername: string;
  discordAvatar?: string;
  role: UserRole;
  warnings?: number;
  isBarred?: boolean;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  warnings: number;
  isBarred: boolean;
  loginWithDiscord: () => void;
  setAuthToken: (token: string) => void;
  loginAsDevUser: (role?: UserRole, username?: string) => void;
  addWarning: () => void;
  clearWarnings: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'mcs_auth_token';
const DEV_USER_KEY = 'mcs_dev_user';
const WARNINGS_KEY = 'mcs_user_warnings';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  });

  const [warnings, setWarnings] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(WARNINGS_KEY);
      return stored ? parseInt(stored, 10) || 0 : 0;
    }
    return 0;
  });

  const [devUser, setDevUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DEV_USER_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    // Default persistent dev voter for seamless developer testing
    return {
      id: 'dev_user_1',
      discordId: '123456789012345678',
      discordUsername: 'SteveDev',
      role: 'admin',
    };
  });

  // Query /api/v1/auth/me when token is present
  const {
    data: apiUser,
    isLoading: isApiLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: () => apiRequest<UserProfile>('/auth/me'),
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 15, // 15 mins
  });

  // Handle token expiration or invalidity
  useEffect(() => {
    if (error && token) {
      console.warn('Auth token expired or invalid, clearing:', error);
      // Don't wipe devUser, just token
    }
  }, [error, token]);

  const rawUser = apiUser || devUser;
  const isBarred = warnings >= 3;

  const activeUser: UserProfile | null = rawUser
    ? {
        ...rawUser,
        warnings,
        isBarred,
      }
    : null;

  const addWarning = () => {
    setWarnings((prev) => {
      const next = prev + 1;
      localStorage.setItem(WARNINGS_KEY, next.toString());
      return next;
    });
  };

  const clearWarnings = () => {
    setWarnings(0);
    localStorage.setItem(WARNINGS_KEY, '0');
  };

  const setAuthToken = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };

  const loginWithDiscord = () => {
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
    // In production Adonis, hits discord oauth redirect
    window.location.href = `${baseUrl}/auth/discord`;
  };

  const loginAsDevUser = (role: UserRole = 'user', username = 'CommunityVoter') => {
    const userObj: UserProfile = {
      id: `dev_${role}_${Date.now()}`,
      discordId: `${Math.floor(100000000000000000 + Math.random() * 900000000000000000)}`,
      discordUsername: `${username}_${Math.floor(100 + Math.random() * 900)}`,
      role,
    };
    localStorage.setItem(DEV_USER_KEY, JSON.stringify(userObj));
    setDevUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DEV_USER_KEY);
    setToken(null);
    setDevUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user: activeUser,
        isLoading: !!token && isApiLoading,
        isAuthenticated: !!activeUser,
        warnings,
        isBarred,
        loginWithDiscord,
        setAuthToken,
        loginAsDevUser,
        addWarning,
        clearWarnings,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
