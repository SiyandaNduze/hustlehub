// All HTTP calls go through here. It attaches the JWT, normalises errors, and
// never surfaces raw server or network details to the UI.
const BASE = '/api';
const TOKEN_KEY = 'hustlehub_token';

// sessionStorage: cleared when the tab closes, never shared between tabs.
// (httpOnly cookies would be stronger against XSS - see README limitations.)
// Wrapped in try/catch because storage can be blocked (private mode, policies).
export const tokenStore = {
  get: () => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: session lasts until refresh */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

// Reads the expiry (ms since epoch) from a JWT without trusting anything else
// in it. Used only to log the user out on time - the server still verifies
// every token.
export function tokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export class ApiError extends Error {
  constructor(message, status = 0, fieldErrors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// [{ field, message }] -> { field: message } (first message per field)
export function fieldErrorMap(error) {
  const map = {};
  (error?.fieldErrors || []).forEach((f) => {
    if (f && typeof f.field === 'string' && !map[f.field]) map[f.field] = String(f.message);
  });
  return map;
}

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

const GENERIC = 'Something went wrong. Please try again.';
const NETWORK = 'Unable to reach the server. Please try again.';

async function request(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(NETWORK);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response (e.g. a proxy error page) */
  }

  if (!res.ok) {
    // Expired/invalid session -> log the user out
    if (res.status === 401 && token && unauthorizedHandler) unauthorizedHandler();

    // The API's 4xx messages are deliberately generic and safe to show.
    // Anything 5xx (or non-JSON) gets our own wording so internal details
    // can never reach the screen, even if the server misbehaves.
    const serverMessage = typeof data?.message === 'string' ? data.message : '';
    const message = res.status >= 500 || !serverMessage ? GENERIC : serverMessage;
    const fields = Array.isArray(data?.errors)
      ? data.errors.filter((e) => e && typeof e.field === 'string').map((e) => ({ field: e.field, message: String(e.message) }))
      : [];
    throw new ApiError(message, res.status, fields);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};
