"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchCurrentUser } from "@/lib/api";
import { generateCodeVerifier, generateCodeChallenge } from "@/lib/pkce";

export interface UserProfile {
  id: string;
  username: string;
  globalName?: string | null;
  avatarUrl?: string | null;
  role: string;
  specialties: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isSupervisor: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const configuredAdminIds = (process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS || "965511204372086814")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("stairway_token") : null;
    if (!token) {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("stairway_user");
      }
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchCurrentUser();
      if (data && typeof data === "object" && "id" in data) {
        setUser(data as UserProfile);
        localStorage.setItem("stairway_user", JSON.stringify(data));
      } else {
        localStorage.removeItem("stairway_token");
        localStorage.removeItem("stairway_user");
        setUser(null);
      }
    } catch {
      // keep cached session active on temporary remote network drops
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // hydrate cached profile immediately on mount to skip network latency
    try {
      const savedUser = localStorage.getItem("stairway_user");
      const token = localStorage.getItem("stairway_token");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsLoading(false);
      } else if (!token) {
        setIsLoading(false);
      }
    } catch {}

    refreshUser();
  }, [refreshUser]);

  const isAdmin = Boolean(
    user && (user.role === "admin" || configuredAdminIds.includes(user.id))
  );
  const isSupervisor = Boolean(
    user && (user.role === "admin" || user.role === "supervisor" || configuredAdminIds.includes(user.id))
  );
  const isStaff = Boolean(
    user && (["admin", "supervisor", "moderator"].includes(user.role) || configuredAdminIds.includes(user.id))
  );

  const login = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://dev-api.seraphinteractive.com";
    // generate pkce verifier and challenge for rfc 7636 security
    const verifier = generateCodeVerifier();
    sessionStorage.setItem("stairway_code_verifier", verifier);
    const challenge = await generateCodeChallenge(verifier);
    const returnTo = typeof window !== "undefined" ? window.location.origin : "";
    const returnParam = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : "";
    window.location.href = `${apiUrl}/api/v1/auth/discord?codeChallenge=${encodeURIComponent(challenge)}${returnParam}`;
  };

  const logout = () => {
    localStorage.removeItem("stairway_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isSupervisor, isStaff, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
