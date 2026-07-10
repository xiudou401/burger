import type { NextFunction, Request, Response } from 'express';
import { oauthStartHandler } from './oauth.controller';

jest.mock('../config/env', () => ({
  env: {
    API_URL: 'https://burger-rmc0.onrender.com',
    FRONTEND_URL: 'https://www.sydneyburger.com',
    GOOGLE_CLIENT_ID: 'google-client-id',
  },
}));

jest.mock('../utils/oauth-state-cookie', () => ({
  createOAuthState: jest.fn(() => 'oauth-state'),
  setOAuthStateCookie: jest.fn(),
}));

const mockResponse = () => {
  return {
    redirect: jest.fn().mockReturnThis(),
  } as unknown as Response;
};

describe('oauth controller', () => {
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
});
