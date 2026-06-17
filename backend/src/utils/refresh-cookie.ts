import type { CookieOptions, Request, Response } from 'express';
import { TTL_MS } from '../config/ttl';

const REFRESH_COOKIE_NAME = 'refreshToken';

const getRefreshCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
  };
};

export const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: TTL_MS.REFRESH_COOKIE_MAX_AGE,
  });
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
};

export const getRefreshToken = (req: Request) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  return typeof token === 'string' ? token : '';
};
