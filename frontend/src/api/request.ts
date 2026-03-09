const API_BASE = '/api';
const DEFAULT_TIMEOUT = 10000;
const RETRY_COUNT = 1;

export const request = async <T>(
  path: string,
  options?: RequestInit,
  retry = RETRY_COUNT,
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      // 401 统一处理
      if (res.status === 401) {
        console.warn('Unauthorized');
        // 可以跳登录页
        // window.location.href = '/login';
      }

      const text = await res.text();
      throw new Error(`API ${res.status}: ${text}`);
    }

    return res.json();
  } catch (err) {
    // timeout
    if ((err as Error).name === 'AbortError') {
      throw new Error('Request timeout');
    }

    // retry
    if (retry > 0) {
      console.warn('Retry request:', path);
      return request<T>(path, options, retry - 1);
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};
