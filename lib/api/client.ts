/**
 * The single fetch wrapper every service calls. Responsibilities:
 *  - resolve the base URL from NEXT_PUBLIC_API_BASE_URL (browser-visible; it's
 *    just the server address, not a secret),
 *  - attach the Bearer access token,
 *  - on a 401, refresh once via the refresh token and retry the request,
 *  - normalize DRF error bodies into a typed `ApiError`.
 *
 * Auth is entirely client-side (tokens in localStorage), so this only runs in
 * the browser for authenticated calls.
 */

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokens";

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Base URL with any trailing slash trimmed, e.g. "http://158.220.95.120/api". */
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, "");

/** Whether the base URL env var is set — surfaced so the UI can warn early. */
export const isApiConfigured = (): boolean => API_BASE_URL.length > 0;

export interface ApiErrorShape {
  status: number;
  message: string;
  code?: string;
  /** Field-level errors keyed by field name (DRF style). */
  fields?: Record<string, string[]>;
  data?: unknown;
}

export class ApiError extends Error implements ApiErrorShape {
  status: number;
  code?: string;
  fields?: Record<string, string[]>;
  data?: unknown;

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = "ApiError";
    this.status = shape.status;
    this.code = shape.code;
    this.fields = shape.fields;
    this.data = shape.data;
  }
}

type QueryValue = string | number | boolean | undefined | null;
type Query = Record<string, QueryValue>;

export interface RequestOptions {
  /** Attach the bearer token and enable 401→refresh→retry. Default true. */
  auth?: boolean;
  query?: Query;
  /** JSON body (ignored when `form` is provided). */
  body?: unknown;
  /** multipart/form-data body (the browser sets the boundary header). */
  form?: FormData;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) qs.append(key, String(value));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

/** Turn a DRF error body ({detail}, {non_field_errors}, or field maps) into a message. */
function humanizeError(status: number, data: unknown): ApiErrorShape {
  let message = `Request failed (${status}).`;
  let fields: Record<string, string[]> | undefined;
  let code: string | undefined;

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") {
      message = obj.detail;
    } else if (Array.isArray(obj.non_field_errors)) {
      message = obj.non_field_errors.map(String).join(" ");
    } else {
      const collected: Record<string, string[]> = {};
      const parts: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        if (key === "code") continue;
        const msgs = Array.isArray(value) ? value.map(String) : [String(value)];
        collected[key] = msgs;
        parts.push(msgs.join(" "));
      }
      if (Object.keys(collected).length) {
        fields = collected;
        message = parts.join(" ");
      }
    }
    if (typeof obj.code === "string") code = obj.code;
  }

  return { status, message, fields, code, data };
}

/* ---- 401 → refresh → retry (single-flight) ------------------- */

let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(buildUrl("/auth/token/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access?: string; refresh?: string };
    if (!data.access) return false;
    // SimpleJWT may or may not rotate the refresh token; keep the old one if not.
    setTokens({ access: data.access, refresh: data.refresh ?? refresh });
    return true;
  } catch {
    return false;
  }
}

/** Coalesce concurrent 401s into a single refresh call. */
function refreshAccess(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Broadcast when the session can't be refreshed; AuthProvider redirects to /login. */
function emitAuthExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("marist:auth-expired"));
  }
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, query, body, form, signal, headers: extra } = options;

  const doFetch = (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: "application/json", ...extra };
    let payload: BodyInit | undefined;
    if (form) {
      payload = form; // let the browser set multipart/form-data + boundary
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    if (auth) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return fetch(buildUrl(path, query), { method, headers, body: payload, signal });
  };

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const refreshed = await refreshAccess();
    if (refreshed) {
      res = await doFetch();
    } else {
      clearTokens();
      emitAuthExpired();
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) throw new ApiError(humanizeError(res.status, data));
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, { ...opts, body }),
  del: <T>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, opts),
  /** multipart POST (file uploads). */
  upload: <T>(path: string, form: FormData, opts?: RequestOptions) =>
    request<T>("POST", path, { ...opts, form }),
  /** multipart PUT (file replace/reupload). */
  uploadPut: <T>(path: string, form: FormData, opts?: RequestOptions) =>
    request<T>("PUT", path, { ...opts, form }),
};
