/**
 * JWT token storage (access + refresh) in localStorage.
 *
 * Auth is client-side: the browser talks to the Django API directly and carries
 * a per-user JWT. There is no shared/secret API key — tokens are minted per
 * login and only ever live in this browser. Stored under a single key.
 */

const TOKENS_KEY = "marist.auth.tokens.v1";

export interface AuthTokens {
  access: string;
  refresh: string;
}

const isBrowser = () => typeof window !== "undefined";

export function getTokens(): AuthTokens | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(TOKENS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthTokens>;
    if (
      typeof parsed.access === "string" &&
      typeof parsed.refresh === "string"
    ) {
      return { access: parsed.access, refresh: parsed.refresh };
    }
    return null;
  } catch {
    return null;
  }
}

export function setTokens(tokens: AuthTokens): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(TOKENS_KEY);
  } catch {
    /* ignore */
  }
}

export const getAccessToken = (): string | null => getTokens()?.access ?? null;
export const getRefreshToken = (): string | null =>
  getTokens()?.refresh ?? null;

/** Decode a JWT payload without verifying (client-side hints only). */
export function decodeJwt<T = Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** True if the token is missing or past its `exp` (with a clock-skew buffer). */
export function isTokenExpired(
  token: string | null,
  skewSeconds = 30,
): boolean {
  if (!token) return true;
  const payload = decodeJwt<{ exp?: number }>(token);
  if (!payload?.exp) return false; // no exp claim → let the server decide (401)
  return payload.exp - skewSeconds <= Date.now() / 1000;
}
