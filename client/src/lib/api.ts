import axios, { AxiosError } from 'axios';

/**
 * Base origin for the API.
 *
 * Default is '' (same origin), which works in both environments:
 *   - dev:  vite.config.ts proxies /api -> http://localhost:8080
 *   - prod: app.js serves client/dist from the same Express server
 *
 * Set VITE_ORIGIN_URL only if you deploy the SPA to a different origin than the
 * API. If you do, the backend must send `sameSite=none; secure=true` on the
 * auth cookie (helpers/jwtHelper.js) or authentication will silently fail.
 */
export const API_ORIGIN: string = import.meta.env.VITE_ORIGIN_URL || '';

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  // REQUIRED: the backend authenticates via a signed httpOnly-ish cookie
  // (helpers/jwtHelper.js -> createCookies). Without this the cookie is never
  // sent and every authenticated route returns 401.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * A random id for this browser, sent on every request as X-Device-Id.
 *
 * The server's rate limits key on it (middlewares/rateLimiter.js), so the many
 * different people behind one shared mobile-carrier IP are counted separately
 * instead of as one. It is NOT an identity: it is random, holds nothing
 * personal, and simply starts over if site data is cleared.
 */
const DEVICE_ID_KEY = 'hb_device_id';
const DEVICE_ID_SHAPE = /^[A-Za-z0-9-]{16,64}$/;
let cachedDeviceId: string | null = null;

function deviceId(): string {
  if (cachedDeviceId !== null) return cachedDeviceId;
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id || !DEVICE_ID_SHAPE.test(id)) {
      id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    cachedDeviceId = id;
  } catch {
    cachedDeviceId = ''; // storage blocked: the server falls back to network + browser
  }
  return cachedDeviceId;
}

api.interceptors.request.use((config) => {
  const id = deviceId();
  if (id) config.headers.set('X-Device-Id', id);
  return config;
});

/** Fired when any request comes back 401, so AuthContext can clear the session. */
export const UNAUTHORIZED_EVENT = 'heartboard:unauthorized';

export interface ApiError {
  status: number;
  message: string;
  /** True when the request never reached the server. */
  isNetworkError: boolean;
}

/**
 * Normalises the backend's inconsistent error envelope.
 * Most controllers return { message }, but authController.logout and parts of
 * errorMiddleware return { msg }. Read both, always.
 */
export function toApiError(e: unknown): ApiError {
  const err = e as AxiosError<{ message?: string; msg?: string }>;
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data;

  return {
    status,
    // The server's own message when it sent one — those are written for a
    // person. Otherwise a plain sentence, NOT err.message: axios's version of
    // that is "Request failed with status code 500" or "Network Error", which
    // is our diagnostic wording leaking into the page.
    message: data?.message || data?.msg || fallbackMessage(status),
    isNetworkError: status === 0,
  };
}

/** Plain-language stand-in for a response that carried no message of its own. */
function fallbackMessage(status: number): string {
  if (status === 0) {
    return 'We could not reach Heartboard. Check your connection and try again.';
  }
  if (status === 401) return 'Please sign in to continue.';
  if (status === 403) return 'You do not have access to that.';
  if (status === 404) return 'We could not find that.';
  if (status === 429) return 'That is a lot of requests. Please wait a moment and try again.';
  if (status >= 500) {
    return 'We are having trouble reaching our servers right now. Please try again in a moment.';
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Endpoints whose 401 is about the request body, not the session.
 *
 * The blanket rule below is right for almost everything: a 401 means the cookie
 * expired. But some endpoints authenticate a *credential in the payload* while
 * the session itself is perfectly valid. Treating those as an expired session
 * logs the user out mid-form and unmounts whatever they were filling in, which
 * looks exactly like the submit button doing nothing.
 */
const SELF_AUTHENTICATING_PATHS = ['/user/change-password'];

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error?.config?.url ?? '';
    const isSelfAuthenticating = SELF_AUTHENTICATING_PATHS.some((p) => url.includes(p));

    if (error?.response?.status === 401 && !isSelfAuthenticating && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Strips undefined values so axios does not serialise them as "undefined". */
export function cleanParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out as Partial<T>;
}
