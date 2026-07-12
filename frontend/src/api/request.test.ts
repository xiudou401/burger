import { clearAccessToken, setAccessToken } from './auth-token';
import { refreshSession } from './auth';
import { ApiError, request } from './request';

const mockResponse = (
  status: number,
  body: Record<string, unknown>,
): Response => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
};

describe('authenticated request refresh', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    clearAccessToken();
    setAccessToken('expired-access-token');
    global.fetch = fetchMock;
  });

  afterEach(() => {
    clearAccessToken();
  });

  test('adds Authorization and CSRF headers to authenticated requests', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { orders: [] }));

    await expect(request('/orders')).resolves.toEqual({ orders: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/orders',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer expired-access-token',
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        }),
      }),
    );
  });

  test('notifies the app when refresh is unauthorized', async () => {
    const sessionExpired = jest.fn();
    window.addEventListener('auth:session-expired', sessionExpired);

    fetchMock
      .mockResolvedValueOnce(
        mockResponse(401, { message: 'Access token expired' }),
      )
      .mockResolvedValueOnce(mockResponse(401, { message: 'Session expired' }));

    await expect(request('/orders')).rejects.toBeInstanceOf(ApiError);

    expect(sessionExpired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    window.removeEventListener('auth:session-expired', sessionExpired);
  });

  test('publishes the refreshed access token and user before retrying', async () => {
    const sessionRefreshed = jest.fn();
    window.addEventListener('auth:session-refreshed', sessionRefreshed);
    const refreshedSession = {
      accessToken: 'new-access-token',
      user: {
        id: 'user-1',
        name: 'Pat',
        email: 'pat@example.com',
        role: 'customer',
        emailVerified: true,
        phoneVerified: false,
      },
    };

    fetchMock
      .mockResolvedValueOnce(
        mockResponse(401, { message: 'Access token expired' }),
      )
      .mockResolvedValueOnce(mockResponse(200, refreshedSession))
      .mockResolvedValueOnce(mockResponse(200, { orders: [] }));

    await expect(request('/orders')).resolves.toEqual({ orders: [] });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/orders',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer expired-access-token',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/orders',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer new-access-token',
        }),
      }),
    );
    expect(sessionRefreshed).toHaveBeenCalledTimes(1);
    expect((sessionRefreshed.mock.calls[0][0] as CustomEvent).detail).toEqual(
      refreshedSession,
    );
    window.removeEventListener('auth:session-refreshed', sessionRefreshed);
  });

  test('retries a concurrent refresh conflict without expiring auth state', async () => {
    const sessionExpired = jest.fn();
    window.addEventListener('auth:session-expired', sessionExpired);
    const refreshedSession = {
      accessToken: 'new-access-token',
      user: {
        id: 'user-1',
        name: 'Pat',
        email: 'pat@example.com',
        role: 'customer',
        emailVerified: true,
        phoneVerified: false,
      },
    };

    fetchMock
      .mockResolvedValueOnce(
        mockResponse(401, { message: 'Access token expired' }),
      )
      .mockResolvedValueOnce(
        mockResponse(409, {
          message: 'Refresh already in progress',
          type: 'ConcurrentRefreshError',
        }),
      )
      .mockResolvedValueOnce(mockResponse(200, refreshedSession))
      .mockResolvedValueOnce(mockResponse(200, { orders: [] }));

    await expect(request('/orders')).resolves.toEqual({ orders: [] });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(sessionExpired).not.toHaveBeenCalled();
    window.removeEventListener('auth:session-expired', sessionExpired);
  });

  test('retries a concurrent refresh conflict during session restore', async () => {
    const restoredSession = {
      accessToken: 'restored-access-token',
      user: {
        id: 'user-1',
        name: 'Pat',
        email: 'pat@example.com',
        role: 'customer',
        emailVerified: true,
        phoneVerified: false,
      },
    };

    fetchMock
      .mockResolvedValueOnce(
        mockResponse(409, {
          message: 'Refresh already in progress',
          type: 'ConcurrentRefreshError',
        }),
      )
      .mockResolvedValueOnce(mockResponse(200, restoredSession));

    await expect(refreshSession()).resolves.toEqual(restoredSession);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  test('shares one refresh request across simultaneous 401 responses', async () => {
    const refreshedSession = {
      accessToken: 'new-access-token',
      user: {
        id: 'user-1',
        name: 'Pat',
        email: 'pat@example.com',
        role: 'customer',
        emailVerified: true,
        phoneVerified: false,
      },
    };
    let refreshCalls = 0;

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/auth/refresh') {
        refreshCalls += 1;
        return Promise.resolve(mockResponse(200, refreshedSession));
      }

      const headers = init?.headers as Record<string, string> | undefined;
      const authHeader = headers?.Authorization ?? '';

      if (authHeader.includes('new-access-token')) {
        return Promise.resolve(mockResponse(200, { ok: true }));
      }

      return Promise.resolve(
        mockResponse(401, { message: 'Access token expired' }),
      );
    });

    await expect(
      Promise.all([request('/orders'), request('/profile')]),
    ).resolves.toEqual([{ ok: true }, { ok: true }]);

    expect(refreshCalls).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  test('/auth/refresh 401 fails without recursively refreshing', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(401, { message: 'Session expired' }),
    );

    await expect(refreshSession()).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  test('surfaces a refresh server error instead of the original 401', async () => {
    const sessionExpired = jest.fn();
    window.addEventListener('auth:session-expired', sessionExpired);

    fetchMock
      .mockResolvedValueOnce(
        mockResponse(401, { message: 'Access token expired' }),
      )
      .mockResolvedValueOnce(
        mockResponse(503, { message: 'Service unavailable' }),
      );

    await expect(request('/orders')).rejects.toMatchObject({
      statusCode: 503,
      message: 'Service unavailable',
    });

    expect(sessionExpired).not.toHaveBeenCalled();
    window.removeEventListener('auth:session-expired', sessionExpired);
  });

  test('surfaces a refresh network error instead of the original 401', async () => {
    const sessionExpired = jest.fn();
    window.addEventListener('auth:session-expired', sessionExpired);

    fetchMock
      .mockResolvedValueOnce(
        mockResponse(401, { message: 'Access token expired' }),
      )
      .mockRejectedValueOnce(new Error('Failed to fetch'));

    await expect(request('/orders')).rejects.toMatchObject({
      statusCode: 0,
      message: 'Failed to fetch',
    });

    expect(sessionExpired).not.toHaveBeenCalled();
    window.removeEventListener('auth:session-expired', sessionExpired);
  });
});
