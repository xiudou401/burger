const API_BASE = '/api';
const DEFAULT_TIMEOUT = 10000;
const RETRY_COUNT = 1;

// ✅ 标准化前端错误
export class ApiError extends Error {
  status: number;
  body: any;

  constructor(status: number, body: any) {
    super(body?.message || `API ${status}`);
    this.status = status;
    this.body = body;
  }
}

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

    // ✅ 处理非 2xx
    if (!res.ok) {
      // 401 特殊处理
      if (res.status === 401) {
        console.warn('Unauthorized');
      }

      let body: any;

      try {
        body = await res.json(); // ✅ 优先 JSON（配合后端 errorHandler）
      } catch {
        body = { message: await res.text() }; // fallback
      }

      throw new ApiError(res.status, body);
    }

    // ✅ 有些接口可能没有 body（204）
    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  } catch (err: any) {
    // ✅ timeout
    if (err.name === 'AbortError') {
      throw new ApiError(408, { message: 'Request timeout' });
    }

    // ❗ 如果已经是 ApiError，不要 retry（关键）
    if (err instanceof ApiError) {
      // 👉 只对 5xx retry（很关键）
      if (err.status >= 500 && retry > 0) {
        console.warn('Retry (server error):', path);
        return request<T>(path, options, retry - 1);
      }

      throw err;
    }

    // ✅ 网络错误（fetch failed）
    if (retry > 0) {
      console.warn('Retry (network error):', path);
      return request<T>(path, options, retry - 1);
    }

    throw new ApiError(0, { message: err.message || 'Network error' });
  } finally {
    clearTimeout(timeoutId);
  }
};
