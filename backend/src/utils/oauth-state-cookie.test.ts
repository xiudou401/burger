import type { Request, Response } from 'express';
import { createSecureToken } from './secure-token';
import {
  clearOAuthStateCookie,
  createOAuthState,
  isOAuthStateValid,
  parseOAuthStateMode,
  setOAuthStateCookie,
} from './oauth-state-cookie';

jest.mock('./secure-token', () => ({
  createSecureToken: jest.fn(),
}));

describe('OAuth state cookie helpers', () => {
  const previousNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.mocked(createSecureToken).mockReturnValue('random-state-token');
  });

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
  });

  test('creates and parses an OAuth state value with mode and nonce', () => {
    expect(createOAuthState('admin')).toBe('admin.random-state-token');
    expect(parseOAuthStateMode('admin.random-state-token')).toBe('admin');
    expect(parseOAuthStateMode('signup.random-state-token')).toBe('signup');
    expect(parseOAuthStateMode('invalid.random-state-token')).toBeNull();
    expect(parseOAuthStateMode('login')).toBeNull();
  });

  test('sets a short lived HttpOnly OAuth state cookie', () => {
    process.env.NODE_ENV = 'production';
    const cookie = jest.fn();

    setOAuthStateCookie({ cookie } as unknown as Response, 'login.state');

    expect(cookie).toHaveBeenCalledWith('oauthState', 'login.state', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/auth/oauth',
      maxAge: 10 * 60 * 1000,
    });
  });

  test('clears the OAuth state cookie using matching options', () => {
    process.env.NODE_ENV = 'development';
    const clearCookie = jest.fn();

    clearOAuthStateCookie({ clearCookie } as unknown as Response);

    expect(clearCookie).toHaveBeenCalledWith('oauthState', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/api/auth/oauth',
    });
  });

  test('validates returned state against the HttpOnly cookie value', () => {
    const req = {
      cookies: { oauthState: 'login.random-state-token' },
    } as unknown as Request;

    expect(isOAuthStateValid(req, 'login.random-state-token')).toBe(true);
    expect(isOAuthStateValid(req, 'admin.random-state-token')).toBe(false);
    expect(isOAuthStateValid({ cookies: {} } as Request, 'login.state')).toBe(
      false,
    );
  });
});
