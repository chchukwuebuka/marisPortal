"use client";

/**
 * Client-side route guard for the applicant area. Auth lives in localStorage,
 * so protection can't run on the server (no `proxy`/middleware access to
 * tokens) — this waits for the AuthProvider to resolve, then bounces
 * unauthenticated visitors to /login.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingBlock } from "@/components/ui";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
        }}
      >
        <LoadingBlock label="Checking your session…" />
      </div>
    );
  }

  return <>{children}</>;
}
