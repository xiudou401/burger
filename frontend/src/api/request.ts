const API_BASE = '/api';
const DEFAULT_TIMEOUT = 10000;
const RETRY_COUNT = 1;

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
      signal: timeoutController.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        console.warn('Unauthorized');
      }

      let body: ErrorResponse;

      try {
        body = await res.json();
      } catch {
        body = { message: await res.text() };
      }

      throw new ApiError(res.status, body);
    }

    if (res.status === 204) {
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
        throw new ApiError(408, { message: 'Request timeout' });
      }

      throw new ApiError(499, { message: 'Request cancelled' });
    }

    if (err instanceof ApiError) {
      if (err.statusCode >= 500 && retry > 0) {
        console.warn('Retry (server error):', path);
        return request<T>(path, options, retry - 1);
      }

      throw err;
    }

    if (retry > 0) {
      console.warn('Retry (network error):', path);
      return request<T>(path, options, retry - 1);
    }

    const message = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(0, { message });
  } finally {
    window.clearTimeout(timeoutId);

    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
};
