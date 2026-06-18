import { HTTP_STATUS } from './http-status';

const API_BASE = '/api';
const DEFAULT_TIMEOUT = 10000;
const RETRY_COUNT = 1;
const NO_AUTO_REFRESH_PATHS = new Set([
  '/auth/login',
  '/auth/signup',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/sms/send',
  '/auth/sms/verify',
]);
let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<AuthRefreshResponse> | null = null;

interface AuthRefreshResponse {
  accessToken: string;
  user: unknown;
}

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const clearAccessToken = () => {
  inMemoryAccessToken = null;
};

interface ErrorResponse {
  message: string;
  statusCode?: number;
  type?: string;
}

export class ApiError extends Error {
  statusCode: number;
  body: ErrorResponse;

  constructor(statusCode: number, body: ErrorResponse) {
    super(body?.message || `API ${statusCode}`);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

interface RequestOptions extends RequestInit {
  signal?: AbortSignal;
}

export const request = async <T>(
  path: string,
  options: RequestOptions = {},
  retry = RETRY_COUNT,
  didRefresh = false,
): Promise<T> => {
  const timeoutController = new AbortController();
  const externalSignal = options.signal;

  let didTimeout = false;

  const timeoutId = window.setTimeout(() => {
    didTimeout = true;
    timeoutController.abort();
  }, DEFAULT_TIMEOUT);

  const onExternalAbort = () => {
    timeoutController.abort();
  };

  try {
    if (externalSignal) {
      if (externalSignal.aborted) {
        timeoutController.abort();
      } else {
        externalSignal.addEventListener('abort', onExternalAbort);
      }
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      signal: timeoutController.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Protection': '1',
        ...(inMemoryAccessToken
          ? { Authorization: `Bearer ${inMemoryAccessToken}` }
          : {}),
        ...options.headers,
      },
    });

    if (!res.ok) {
      if (
        res.status === HTTP_STATUS.UNAUTHORIZED &&
        !didRefresh &&
        !NO_AUTO_REFRESH_PATHS.has(path)
      ) {
        try {
          const refreshed = await refreshAccessToken();
          setAccessToken(refreshed.accessToken);
          return request<T>(path, options, retry, true);
        } catch {
          clearAccessToken();
        }
      }

      let body: ErrorResponse;

      try {
        body = await res.json();
      } catch {
        body = { message: await res.text() };
      }

      throw new ApiError(res.status, body);
    }

    if (res.status === HTTP_STATUS.NO_CONTENT) {
      return {} as T;
    }

    try {
      return await res.json();
    } catch {
      return {} as T;
    }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (didTimeout) {
        throw new ApiError(HTTP_STATUS.REQUEST_TIMEOUT, {
          message: 'Request timeout',
        });
      }

      throw new ApiError(HTTP_STATUS.REQUEST_CANCELLED, {
        message: 'Request cancelled',
      });
    }

    if (err instanceof ApiError) {
      if (err.statusCode >= HTTP_STATUS.SERVER_ERROR_MIN && retry > 0) {
        console.warn('Retry (server error):', path);
        return request<T>(path, options, retry - 1, didRefresh);
      }

      throw err;
    }

    if (retry > 0) {
      console.warn('Retry (network error):', path);
      return request<T>(path, options, retry - 1, didRefresh);
    }

    const message = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(HTTP_STATUS.NETWORK_ERROR, { message });
  } finally {
    window.clearTimeout(timeoutId);

    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
};

export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = request<AuthRefreshResponse>(
      '/auth/refresh',
      { method: 'POST' },
      0,
      true,
    ).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};
