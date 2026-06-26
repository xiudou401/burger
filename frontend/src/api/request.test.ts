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

  test('does not mark the session expired for a refresh server error', async () => {
    const sessionExpired = jest.fn();
    window.addEventListener('auth:session-expired', sessionExpired);

    fetchMock
      .mockResolvedValueOnce(
        mockResponse(401, { message: 'Access token expired' }),
      )
      .mockResolvedValueOnce(
        mockResponse(503, { message: 'Service unavailable' }),
      );

    await expect(request('/orders')).rejects.toBeInstanceOf(ApiError);

    expect(sessionExpired).not.toHaveBeenCalled();
    window.removeEventListener('auth:session-expired', sessionExpired);
  });
});
