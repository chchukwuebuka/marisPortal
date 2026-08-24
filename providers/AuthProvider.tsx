"use client";

/**
 * Auth state for the whole app. Mounted at the root so both the (auth) pages
 * (which call `login`) and the applicant area (which is guarded) can see it.
 *
 * Tokens live in localStorage (see lib/api/tokens); this provider holds the
 * derived `user` + `status` and reacts to the client's "auth expired" event
 * (fired when a refresh fails) by dropping the session and returning to login.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { clearTokens, getRefreshToken } from "@/lib/api";
import * as authService from "@/services/auth";
import type { AuthUser } from "@/services/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Hydrate the session on mount. There's no server-side localStorage, so this
  // can only run after mount — hence setState-in-effect (via async callback).
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!getRefreshToken()) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }
      try {
        const u = await authService.me();
        if (!cancelled) {
          setUser(u);
          setStatus("authenticated");
        }
      } catch {
        clearTokens();
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // The API client fires this when a 401 can't be refreshed.
  useEffect(() => {
    function onExpired() {
      setUser(null);
      setStatus("unauthenticated");
      router.replace("/login");
    }
    window.addEventListener("marist:auth-expired", onExpired);
    return () => window.removeEventListener("marist:auth-expired", onExpired);
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
    setStatus("authenticated");
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await authService.me());
    } catch {
      /* leave the current user in place if the refetch fails */
    }
  }, []);

  const value: AuthContextValue = {
    user,
    status,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
