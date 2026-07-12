import type { NextFunction, Request, Response } from 'express';
import { loginWithOAuth } from '../services/auth.service';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

jest.mock('../config/env', () => ({
  env: {
    API_URL: 'https://burger-rmc0.onrender.com',
    FRONTEND_URL: 'https://www.sydneyburger.com',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
  },
}));

jest.mock('../utils/oauth-state-cookie', () => ({
  clearOAuthStateCookie: jest.fn(),
  createOAuthState: jest.fn(() => 'login.oauth-state'),
  isOAuthStateValid: jest.fn(() => true),
  parseOAuthStateMode: jest.fn(() => 'login'),
  setOAuthStateCookie: jest.fn(),
}));

jest.mock('../utils/refresh-cookie', () => ({
  setRefreshCookie: jest.fn(),
}));

jest.mock('../services/auth.service', () => ({
  loginWithOAuth: jest.fn(),
}));

const { oauthCallbackHandler, oauthStartHandler } = jest.requireActual(
  './oauth.controller',
) as typeof import('./oauth.controller');

const mockResponse = () => {
  return {
    redirect: jest.fn().mockReturnThis(),
  } as unknown as Response;
};

const mockTokenExchange = (body: Record<string, unknown>, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(body),
  }) as jest.Mock;
};

describe('oauth controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: 'google-client-id',
        iss: 'https://accounts.google.com',
        exp: Math.floor(Date.now() / 1000) + 300,
        email: 'pat@example.com',
        name: 'Pat',
        email_verified: true,
      }),
    });
    jest.mocked(loginWithOAuth).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'pat@example.com',
        name: 'Pat',
        role: 'customer',
        permissions: ['create_order', 'view_own_orders'],
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
      },
    });
  });

  test('builds Google redirect URI from the public API URL', () => {
    const req = {
      params: { provider: 'google' },
      query: { mode: 'login' },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    oauthStartHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();

    const redirectUrl = jest.mocked(res.redirect).mock.calls[0]?.[0];
    expect(typeof redirectUrl).toBe('string');

    const url = new URL(redirectUrl as unknown as string);
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://burger-rmc0.onrender.com/api/auth/oauth/google/callback',
    );
  });

  test('verifies Google ID tokens before OAuth login', async () => {
    mockTokenExchange({ id_token: 'google-id-token' });

    const req = {
      params: { provider: 'google' },
      query: { code: 'auth-code', state: 'login.oauth-state' },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await oauthCallbackHandler(req, res, next);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'google-id-token',
      audience: 'google-client-id',
    });
    expect(loginWithOAuth).toHaveBeenCalledWith({
      email: 'pat@example.com',
      name: 'Pat',
      emailVerified: true,
      mode: 'login',
    });
    expect(res.redirect).toHaveBeenCalledWith(
      'https://www.sydneyburger.com/oauth/callback',
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects Google ID tokens with unverified email', async () => {
    mockTokenExchange({ id_token: 'google-id-token' });
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: 'google-client-id',
        iss: 'https://accounts.google.com',
        exp: Math.floor(Date.now() / 1000) + 300,
        email: 'pat@example.com',
        name: 'Pat',
        email_verified: false,
      }),
    });

    const req = {
      params: { provider: 'google' },
      query: { code: 'auth-code', state: 'login.oauth-state' },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await oauthCallbackHandler(req, res, next);

    expect(loginWithOAuth).not.toHaveBeenCalled();
    const redirectUrl = jest.mocked(res.redirect).mock
      .calls[0]?.[0] as unknown as string;
    expect(redirectUrl).toContain('/login?');
    expect(redirectUrl).toContain('Google+email+must+be+verified');
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects Google ID tokens with the wrong audience', async () => {
    mockTokenExchange({ id_token: 'google-id-token' });
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: 'other-client-id',
        iss: 'https://accounts.google.com',
        exp: Math.floor(Date.now() / 1000) + 300,
        email: 'pat@example.com',
        name: 'Pat',
        email_verified: true,
      }),
    });

    const req = {
      params: { provider: 'google' },
      query: { code: 'auth-code', state: 'login.oauth-state' },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await oauthCallbackHandler(req, res, next);

    expect(loginWithOAuth).not.toHaveBeenCalled();
    const redirectUrl = jest.mocked(res.redirect).mock
      .calls[0]?.[0] as unknown as string;
    expect(redirectUrl).toContain('Google+token+audience+is+invalid');
    expect(next).not.toHaveBeenCalled();
  });
});
