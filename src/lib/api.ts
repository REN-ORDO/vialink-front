import type { ApiErrorShape, AuthTokens } from '../types';

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

const RAW_API_URL = env.VITE_API_URL ?? 'http://localhost:3000';
const RAW_WS_URL = env.VITE_WS_URL ?? RAW_API_URL;

export const API_BASE = `${RAW_API_URL.replace(/\/$/, '')}/api/v1`;
export const WS_URL = RAW_WS_URL.replace(/\/$/, '');
export const USE_MOCKS = (env.VITE_USE_MOCKS ?? 'true') !== 'false';

const ACCESS_KEY = 'vl-access-token';
const REFRESH_KEY = 'vl-refresh-token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setAuthTokens(tokens: AuthTokens): void {
  try {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  } catch {
    /* storage bloqueado */
  }
}

export function clearAuthTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* storage bloqueado */
  }
}

export class ApiError extends Error {
  status: number;
  payload: ApiErrorShape | null;
  constructor(status: number, message: string, payload: ApiErrorShape | null = null) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export class RateLimitError extends ApiError {
  retryAfterMs: number;
  constructor(message: string, retryAfterMs = 12_000, payload: ApiErrorShape | null = null) {
    super(429, message, payload);
    this.retryAfterMs = retryAfterMs;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', payload: ApiErrorShape | null = null) {
    super(401, message, payload);
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
  skipRefresh?: boolean;
};

async function parseError(res: Response): Promise<ApiErrorShape | null> {
  try {
    const body = await res.json();
    if (body && typeof body === 'object' && 'message' in body) {
      return body as ApiErrorShape;
    }
  } catch {
    /* no json */
  }
  return null;
}

async function doFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { auth = false, skipRefresh = false, headers, ...init } = opts;
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: finalHeaders,
  });

  if (res.status === 401 && auth && !skipRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return doFetch<T>(path, { ...opts, skipRefresh: true });
    }
    clearAuthTokens();
    const payload = await parseError(res);
    throw new UnauthorizedError(payload?.message ?? 'Sesión expirada', payload);
  }

  if (res.status === 429) {
    const payload = await parseError(res);
    const retryHeader = Number(res.headers.get('retry-after'));
    const retryAfterMs = Number.isFinite(retryHeader)
      ? retryHeader * 1000
      : 12_000;
    throw new RateLimitError(
      payload?.message ?? 'Demasiadas peticiones, intenta en unos segundos',
      retryAfterMs,
      payload,
    );
  }

  if (!res.ok) {
    const payload = await parseError(res);
    throw new ApiError(
      res.status,
      payload?.message ?? `${res.status} ${res.statusText}`,
      payload,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

let refreshInflight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInflight) return refreshInflight;
  const refresh = getRefreshToken();
  if (!refresh) return false;

  refreshInflight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as AuthTokens;
      setAuthTokens(data);
      return true;
    } catch {
      return false;
    } finally {
      refreshInflight = null;
    }
  })();

  return refreshInflight;
}

export const api = {
  get<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    return doFetch<T>(path, { ...opts, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    return doFetch<T>(path, {
      ...opts,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
    return doFetch<T>(path, {
      ...opts,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  del<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    return doFetch<T>(path, { ...opts, method: 'DELETE' });
  },
};

export const BASE_URL = RAW_API_URL;
