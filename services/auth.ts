/**
 * Auth service — the only place that knows the shape of the auth endpoints.
 * Everything here speaks the app's language (camelCase, a small `AuthUser`);
 * the wire details (snake_case bodies, token envelope) stay contained.
 *
 * Two endpoints have no declared response schema in the API docs
 * (`/auth/login/` and `/auth/me/`), so their parsers are deliberately
 * defensive: they look for tokens/user under a few common envelope shapes.
 */

import { api, ApiError } from "@/lib/api";
import type { AuthTokens } from "@/lib/api";
import { clearTokens, getRefreshToken, setTokens } from "@/lib/api";
import type { ApiAuthUser } from "@/lib/api/types";

/** The signed-in identity the UI needs. */
export interface AuthUser {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isVerified?: boolean;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** Confirm-password (maps to the API's `password2`). */
  password2: string;
}

/* ---- Parsers for the undeclared response bodies -------------- */

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/** Find an {access, refresh} pair whether it's top-level or nested. */
function extractTokens(data: unknown): AuthTokens | null {
  const root = asRecord(data);
  if (!root) return null;
  const candidates = [root, asRecord(root.tokens), asRecord(root.data)];
  for (const c of candidates) {
    if (c && typeof c.access === "string" && typeof c.refresh === "string") {
      return { access: c.access, refresh: c.refresh };
    }
  }
  return null;
}

/** Pull a user object out of a login/me response (nested under `user`, or the body itself). */
function extractUser(data: unknown): ApiAuthUser | null {
  const root = asRecord(data);
  if (!root) return null;
  const nested = asRecord(root.user);
  if (nested) return nested as ApiAuthUser;
  if (typeof root.email === "string") return root as ApiAuthUser;
  return null;
}

function toAuthUser(u: ApiAuthUser): AuthUser {
  let first = typeof u.first_name === "string" ? u.first_name : "";
  let last = typeof u.last_name === "string" ? u.last_name : "";
  const email = typeof u.email === "string" ? u.email : "";
  const full = typeof u.full_name === "string" ? u.full_name : "";

  if (!first && !last && full) {
    const parts = full.trim().split(/\s+/);
    first = parts[0] || "";
    last = parts.slice(1).join(" ") || "";
  }

  const finalFull = full || `${first} ${last}`.trim() || email;

  // Handle either is_verified (camelCase target) or is_email_verified (as returned in API JSON)
  const isVerified =
    typeof u.is_verified === "boolean"
      ? u.is_verified
      : typeof u.is_email_verified === "boolean"
      ? u.is_email_verified
      : undefined;

  return {
    id: typeof u.id === "number" ? u.id : undefined,
    email,
    firstName: first,
    lastName: last,
    fullName: finalFull,
    isVerified,
  };
}

/* ---- Endpoints ----------------------------------------------- */

/**
 * Sign in: exchange email/password for JWTs, store them, resolve the user.
 * The login response schema is undeclared, so we accept tokens in a few
 * shapes and fall back to `/auth/me/` if it carried no user.
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const data = await api.post<unknown>(
    "/auth/login/",
    { email, password },
    { auth: false },
  );
  const tokens = extractTokens(data);
  if (!tokens) {
    throw new ApiError({
      status: 200,
      message:
        "Signed in, but the server response didn't include the expected tokens.",
      data,
    });
  }
  setTokens(tokens);
  const inline = extractUser(data);
  return inline ? toAuthUser(inline) : me();
}

/** Current user. Response schema is undeclared, so parse permissively. */
export async function me(): Promise<AuthUser> {
  const data = await api.get<unknown>("/auth/me/");
  const u = extractUser(data) ?? (asRecord(data) as ApiAuthUser | null);
  return toAuthUser(u ?? {});
}

/** Create an account. Login still requires a verified email afterwards. */
export async function register(input: RegisterInput): Promise<void> {
  await api.post(
    "/auth/register/",
    {
      email: input.email,
      password: input.password,
      password2: input.password2,
      first_name: input.firstName,
      last_name: input.lastName,
    },
    { auth: false },
  );
}

/** Confirm an email with the token from the verification link. */
export async function verifyEmail(token: string): Promise<void> {
  await api.post("/auth/verify-email/", { token }, { auth: false });
}

/** Re-send the verification email. */
export async function resendVerification(email: string): Promise<void> {
  await api.post("/auth/resend-verification/", { email }, { auth: false });
}

/** Request a password-reset email. */
export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/password-reset/", { email }, { auth: false });
}

/** Set a new password using the token from the reset link. */
export async function confirmPasswordReset(
  token: string,
  password: string,
  password2: string,
): Promise<void> {
  await api.post(
    "/auth/password-reset/confirm/",
    { token, password, password2 },
    { auth: false },
  );
}

/** Sign out: best-effort server blacklist of the refresh token, then clear locally. */
export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    if (refresh) await api.post("/auth/logout/", { refresh });
  } catch {
    /* even if the server call fails, we still clear local tokens below */
  } finally {
    clearTokens();
  }
}
