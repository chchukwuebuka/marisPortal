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
import {
  clearTokens,
  getRefreshToken,
  recordStudentActivity,
  isStudentSessionExpired,
  clearStudentSessionActivity,
} from "@/lib/api";
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

  // Hydrate the session on mount.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!getRefreshToken()) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      // Check whether session has exceeded 15 minutes of inactivity
      if (isStudentSessionExpired()) {
        clearTokens();
        clearStudentSessionActivity();
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          router.replace("/login?reason=session_expired");
        }
        return;
      }

      try {
        const u = await authService.me();
        if (!cancelled) {
          setUser(u);
          setStatus("authenticated");
          recordStudentActivity(true);
        }
      } catch {
        clearTokens();
        clearStudentSessionActivity();
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
  }, [router]);

  // The API client fires this when a 401 can't be refreshed.
  useEffect(() => {
    function onExpired() {
      clearTokens();
      clearStudentSessionActivity();
      setUser(null);
      setStatus("unauthenticated");
      router.replace("/login?reason=session_expired");
    }
    window.addEventListener("marist:auth-expired", onExpired);
    return () => window.removeEventListener("marist:auth-expired", onExpired);
  }, [router]);

  // Inactivity auto-logout timer (15 minutes idle limit)
  useEffect(() => {
    if (status !== "authenticated") return;

    const handleUserActivity = () => {
      recordStudentActivity();
    };

    const checkIdleTimeout = () => {
      if (isStudentSessionExpired()) {
        clearTokens();
        clearStudentSessionActivity();
        setUser(null);
        setStatus("unauthenticated");
        router.replace("/login?reason=session_expired");
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkIdleTimeout();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "marist.auth.tokens.v1" && !e.newValue) {
        setUser(null);
        setStatus("unauthenticated");
        router.replace("/login");
      }
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkIdleTimeout);
    window.addEventListener("storage", handleStorageChange);

    // Periodic check every 10 seconds
    const intervalId = setInterval(checkIdleTimeout, 10000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkIdleTimeout);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, [status, router]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    recordStudentActivity(true);
    setUser(u);
    setStatus("authenticated");
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore */
    }
    clearTokens();
    clearStudentSessionActivity();
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await authService.me());
      recordStudentActivity(true);
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
