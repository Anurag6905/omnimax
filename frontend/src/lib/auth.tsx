"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@omnimax/shared";
import { DEMO_PASSWORD, DEMO_USERS } from "@/data/sample-data";

/**
 * Phase 1A: demo sign-in only. Accounts live in sample-data.ts and the session
 * is kept in this browser. Phase 1B replaces this with the API (hashed
 * passwords, server sessions) without changing the screens.
 */
interface AuthState {
  user: User | null;
  ready: boolean;
  users: User[];
  signIn: (email: string, password: string) => string | null;
  signOut: () => void;
  updateUser: (id: string, patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthState | null>(null);
const SESSION_KEY = "omx.session";

function readSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // restore the session after hydration (localStorage is browser-only)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserId(readSession());
    setReady(true);
  }, []);

  const signIn = useCallback(
    (email: string, password: string) => {
      const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found || password !== DEMO_PASSWORD) return "That email and password don't match an account.";
      if (!found.isActive) return "This account is switched off. Ask an admin to turn it back on.";
      setUserId(found.id);
      try {
        localStorage.setItem(SESSION_KEY, found.id);
      } catch {}
      return null;
    },
    [users],
  );

  const signOut = useCallback(() => {
    setUserId(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const value = useMemo<AuthState>(() => {
    const user = users.find((u) => u.id === userId && u.isActive) ?? null;
    return { user, ready, users, signIn, signOut, updateUser };
  }, [users, userId, ready, signIn, signOut, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
