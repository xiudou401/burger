import { HTTP_STATUS } from './http-status';
import { clearAccessToken, getAccessToken, setAccessToken } from './auth-token';
import {
  notifyAuthSessionExpired,
  notifyAuthSessionRefreshed,
} from './auth-events';
import type { AuthResponse } from '../types/auth';

const API_BASE = '/api';
const DEFAULT_TIMEOUT = 10000;
const RETRY_COUNT = 1;
const RETRY_DELAY_MS = 300;
const REFRESH_CONFLICT_RETRY_COUNT = 3;
const REFRESH_CONFLICT_RETRY_DELAY_MS = 150;
const CONCURRENT_REFRESH_ERROR_TYPE = 'ConcurrentRefreshError';
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
let refreshPromise: Promise<AuthRefreshResponse> | null = null;

type AuthRefreshResponse = AuthResponse;

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

const getRequestMethod = (options: RequestOptions) => {
  return (options.method ?? 'GET').toUpperCase();
};

const isRetryableRequest = (options: RequestOptions) => {
  return ['GET', 'HEAD'].includes(getRequestMethod(options));
};

const waitForRetry = (signal?: AbortSignal) => {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(
        new ApiError(HTTP_STATUS.REQUEST_CANCELLED, {
          message: 'Request cancelled',
        }),
      );
      return;
    }

    const onAbort = () => {
      window.clearTimeout(timeoutId);
      reject(
        new ApiError(HTTP_STATUS.REQUEST_CANCELLED, {
          message: 'Request cancelled',
        }),
      );
    };

    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, RETRY_DELAY_MS);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
};

export const request = async <T>(
  path: string,
  options: RequestOptions = {},
  retriesRemaining = RETRY_COUNT,
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

    const accessToken = getAccessToken();
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      signal: timeoutController.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        'X-CSRF-Protection': '1',
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
          notifyAuthSessionRefreshed(refreshed);
          return request<T>(path, options, retriesRemaining, true);
        } catch (refreshError) {
          if (
            refreshError instanceof ApiError &&
            refreshError.statusCode === HTTP_STATUS.UNAUTHORIZED
          ) {
            clearAccessToken();
            notifyAuthSessionExpired();
          }
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
      if (
        err.statusCode >= HTTP_STATUS.SERVER_ERROR_MIN &&
        retriesRemaining > 0 &&
        isRetryableRequest(options)
      ) {
        console.warn('Retry (server error):', path);
        await waitForRetry(externalSignal);
        return request<T>(path, options, retriesRemaining - 1, didRefresh);
      }

      throw err;
    }

    if (retriesRemaining > 0 && isRetryableRequest(options)) {
      console.warn('Retry (network error):', path);
      await waitForRetry(externalSignal);
      return request<T>(path, options, retriesRemaining - 1, didRefresh);
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

export const refreshAuthSession = async () => {
  /**
   * Refresh flow:
   * 1. Share one in-flight refresh request so concurrent 401s do not rotate the same token repeatedly.
   * 2. If another tab/request consumed the token first, the backend returns a short-lived 409.
   * 3. Retry those 409s briefly so the winning refresh can settle and subsequent requests can recover.
   */
  if (!refreshPromise) {
    const refreshWithConflictRetry = async (
      retriesRemaining: number,
    ): Promise<AuthRefreshResponse> => {
      try {
        return await request<AuthRefreshResponse>(
          '/auth/refresh',
          { method: 'POST' },
          0,
          true,
        );
      } catch (error) {
        const isConcurrentRefresh =
          error instanceof ApiError &&
          error.statusCode === HTTP_STATUS.CONFLICT &&
          error.body.type === CONCURRENT_REFRESH_ERROR_TYPE;

        if (!isConcurrentRefresh || retriesRemaining === 0) {
          throw error;
        }

        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, REFRESH_CONFLICT_RETRY_DELAY_MS);
        });

        return refreshWithConflictRetry(retriesRemaining - 1);
      }
    };

    refreshPromise = refreshWithConflictRetry(
      REFRESH_CONFLICT_RETRY_COUNT,
    ).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export const refreshAccessToken = refreshAuthSession;
