import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getApiBaseUrl } from '../api/client.ts';

export type UserRole = 'user' | 'moderator' | 'admin' | 'supervisor';

export function isStaff(role?: string): boolean {
  return role === 'admin' || role === 'moderator' || role === 'supervisor';
}

/**
 * Detects whether the current client is running in a local development environment.
 * The fake standin studio supervisor dummy account only activates under local test environments.
 */
export function isLocalDevEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const isDev = Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
  return (
    isDev ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local')
  );
}

export interface DiscordGuildPermissions {
  isGuildOwner?: boolean;
  permissionBits?: string | number;
  roles?: string[];
}

export interface UserProfile {
  id: string;
  discordId: string;
  discordUsername: string;
  discordAvatar?: string;
  role: UserRole;
  guildPermissions?: DiscordGuildPermissions;
  warnings?: number;
  isBarred?: boolean;
}

export const DEV_DEFAULT_USER: UserProfile = {
  id: 'dev_supervisor',
  discordId: '215537065863938049',
  discordUsername: 'Studio Supervisor (Dev)',
  role: 'admin',
  warnings: 0,
  isBarred: false,
};

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  warnings: number;
  isBarred: boolean;
  loginWithDiscord: () => void;
  setAuthToken: (token: string) => void;
  loginAsUser: (profile: UserProfile) => void;
  addWarning: () => void;
  clearWarnings: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'mcs_auth_token';
const WARNINGS_KEY = 'mcs_user_warnings';
const SESSION_USER_KEY = 'mcs_authenticated_user';

// Discord server role & permission detection constants
const DISCORD_ADMIN_PERMISSION_FLAG = 0x8; // ADMINISTRATOR bit
const DISCORD_MANAGE_GUILD_FLAG = 0x20; // MANAGE_GUILD bit
const DISCORD_MODERATE_MEMBERS_FLAG = 0x10000000000; // MODERATE_MEMBERS bit

// Hardcoded admin Discord IDs for automated administrator role elevation
export const HARDCODED_ADMIN_DISCORD_IDS = new Set([
  '215537065863938049',
  '212401207694721024',
  '965511204372086814',
  '364539598942240768',
]);

const TRUSTED_ADMIN_ROLE_NAMES = new Set([
  'administrator',
  'admin',
  'lead developer',
  'platform admin',
]);

const TRUSTED_MOD_ROLE_NAMES = new Set([
  'moderator',
  'mod',
  'community manager',
]);

/**
 * Automatically calculates user role based on Discord OAuth profile and server guild permissions
 */
export function resolveDiscordRole(discordUser: Partial<UserProfile>): UserRole {
  if (!discordUser.discordId) return 'user';

  // 1. Direct trusted Discord ID check
  if (HARDCODED_ADMIN_DISCORD_IDS.has(discordUser.discordId)) {
    return 'admin';
  }

  // 2. Discord server guild owner check
  if (discordUser.guildPermissions?.isGuildOwner) {
    return 'admin';
  }

  // 3. Discord bitwise permissions check
  const permBits = Number(discordUser.guildPermissions?.permissionBits || 0);
  if ((permBits & DISCORD_ADMIN_PERMISSION_FLAG) === DISCORD_ADMIN_PERMISSION_FLAG) {
    return 'admin';
  }
  if ((permBits & DISCORD_MANAGE_GUILD_FLAG) === DISCORD_MANAGE_GUILD_FLAG) {
    return 'admin';
  }
  if ((permBits & DISCORD_MODERATE_MEMBERS_FLAG) === DISCORD_MODERATE_MEMBERS_FLAG) {
    return 'moderator';
  }

  // 4. Discord server assigned roles check
  const userRoles = (discordUser.guildPermissions?.roles || []).map((r) => r.toLowerCase().trim());
  if (userRoles.some((r) => TRUSTED_ADMIN_ROLE_NAMES.has(r))) {
    return 'admin';
  }
  if (userRoles.some((r) => TRUSTED_MOD_ROLE_NAMES.has(r))) {
    return 'moderator';
  }

  // Default to standard community voter
  return 'user';
}

/**
 * Returns a valid Discord CDN avatar URL or default Discord embed avatar
 */
export function getDiscordAvatar(user: Partial<UserProfile> | null | undefined): string {
  if (!user) return 'https://cdn.discordapp.com/embed/avatars/0.png';
  if (user.discordAvatar) {
    if (user.discordAvatar.startsWith('http')) return user.discordAvatar;
    if (user.discordId) return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`;
  }
  if (user.discordId) {
    try {
      const idx = Number(BigInt(user.discordId) % 6n);
      return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    } catch {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
  }
  return 'https://cdn.discordapp.com/embed/avatars/0.png';
}

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

  // Local cached authenticated session
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SESSION_USER_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            role: resolveDiscordRole(parsed),
          };
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  // Capture token from query param if returning from Discord OAuth redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get('token');
      if (queryToken) {
        localStorage.setItem(TOKEN_KEY, queryToken);
        setToken(queryToken);
        // Clean URL query string without reloading
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      }
    }
  }, [queryClient]);

  // Query /api/v1/auth/me when token is present
  const {
    data: apiUser,
    isLoading: isApiLoading,
  } = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: async () => {
      const res = await apiRequest<UserProfile>('/auth/me');
      const resolvedRole = resolveDiscordRole(res);
      const enriched = { ...res, role: resolvedRole };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(enriched));
      setSessionUser(enriched);
      return enriched;
    },
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 15,
  });

  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mcs_logged_out') === 'true';
    }
    return false;
  });

  const rawUser = apiUser || sessionUser;
  const isBarred = warnings >= 3;

  // Standin studio supervisor dummy account only activates under local dev environments
  const defaultFallbackUser = isLocalDevEnvironment() ? DEV_DEFAULT_USER : null;

  const activeUser: UserProfile | null = isLoggedOut
    ? null
    : rawUser
    ? {
        ...rawUser,
        role: resolveDiscordRole(rawUser),
        warnings,
        isBarred,
      }
    : defaultFallbackUser;

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
    localStorage.removeItem('mcs_logged_out');
    setIsLoggedOut(false);
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };

  const loginWithDiscord = () => {
    localStorage.removeItem('mcs_logged_out');
    setIsLoggedOut(false);
    const rawBase = getApiBaseUrl().replace(/\/+$/, '');
    const cleanBase = rawBase.endsWith('/api/v1')
      ? rawBase
      : rawBase.endsWith('/api')
      ? `${rawBase}/v1`
      : `${rawBase}/api/v1`;
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const returnParam = currentOrigin ? `?return_to=${encodeURIComponent(currentOrigin)}` : '';
    window.location.href = `${cleanBase}/auth/discord${returnParam}`;
  };

  const loginAsUser = (profile: UserProfile) => {
    localStorage.removeItem('mcs_logged_out');
    setIsLoggedOut(false);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(profile));
    setSessionUser(profile);
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  };

  const logout = () => {
    localStorage.setItem('mcs_logged_out', 'true');
    setIsLoggedOut(true);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    setToken(null);
    setSessionUser(null);
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
        loginAsUser,
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
