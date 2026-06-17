import type { Request, Response } from 'express';
import { TTL_MS } from '../config/ttl';
import {
  clearRefreshCookie,
  getRefreshToken,
  setRefreshCookie,
} from './refresh-cookie';

describe('refresh cookie helpers', () => {
  const previousNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
  });

  test('reads only string refresh tokens', () => {
    expect(
      getRefreshToken({
        cookies: { refreshToken: 'refresh-token' },
      } as unknown as Request),
    ).toBe('refresh-token');
    expect(
      getRefreshToken({
        cookies: { refreshToken: { invalid: true } },
      } as unknown as Request),
    ).toBe('');
  });

  test('sets a secure production refresh cookie', () => {
    process.env.NODE_ENV = 'production';
    const cookie = jest.fn();

    setRefreshCookie({ cookie } as unknown as Response, 'refresh-token');

    expect(cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/auth',
      maxAge: TTL_MS.REFRESH_COOKIE_MAX_AGE,
    });
  });

  test('clears the refresh cookie using matching options', () => {
    process.env.NODE_ENV = 'development';
    const clearCookie = jest.fn();

    clearRefreshCookie({ clearCookie } as unknown as Response);

    expect(clearCookie).toHaveBeenCalledWith('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/api/auth',
    });
  });
});
