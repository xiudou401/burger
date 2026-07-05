import { timingSafeEqual } from 'crypto';
import type { CookieOptions, Request, Response } from 'express';
import { createSecureToken } from './secure-token';

const OAUTH_STATE_COOKIE_NAME = 'oauthState';
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000;
const OAUTH_MODES = ['login', 'signup', 'admin'] as const;

export type OAuthStateMode = (typeof OAUTH_MODES)[number];

const getOAuthStateCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth/oauth',
  };
};

export const createOAuthState = (mode: OAuthStateMode) => {
  return `${mode}.${createSecureToken()}`;
};

export const setOAuthStateCookie = (res: Response, state: string) => {
  res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
    ...getOAuthStateCookieOptions(),
    maxAge: OAUTH_STATE_MAX_AGE,
  });
};

export const clearOAuthStateCookie = (res: Response) => {
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, getOAuthStateCookieOptions());
};

export const getOAuthStateCookie = (req: Request) => {
  const state = req.cookies?.[OAUTH_STATE_COOKIE_NAME];

  return typeof state === 'string' ? state : '';
};

export const parseOAuthStateMode = (state: string): OAuthStateMode | null => {
  const [mode, token, ...rest] = state.split('.');

  if (!mode || !token || rest.length > 0) return null;

  return OAUTH_MODES.includes(mode as OAuthStateMode)
    ? (mode as OAuthStateMode)
    : null;
};

export const isOAuthStateValid = (req: Request, returnedState: string) => {
  const expectedState = getOAuthStateCookie(req);

  if (!expectedState || !returnedState) return false;

  const expected = Buffer.from(expectedState);
  const returned = Buffer.from(returnedState);

  return (
    expected.length === returned.length && timingSafeEqual(expected, returned)
  );
};
