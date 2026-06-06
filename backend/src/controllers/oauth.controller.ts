import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import { REFRESH_SESSION_TTL_MS } from '../services/auth-session.service';
import { loginWithOAuth } from '../services/auth.service';
import {
  OAuthCallbackQuerySchema,
  OAuthProviderParamsSchema,
  OAuthStartQuerySchema,
} from '../validation/oauth.schema';
import type { OAuthStartQueryPayload } from '../validation/oauth.schema';

const redirectWithError = (
  res: Response,
  message: string,
  target: 'login' | 'signup' | 'admin/login' = 'login',
) => {
  const params = new URLSearchParams({ error: message });
  return res.redirect(`${env.FRONTEND_URL}/${target}?${params.toString()}`);
};

const getOAuthErrorTarget = (
  mode: OAuthStartQueryPayload['mode'],
): 'login' | 'signup' | 'admin/login' => {
  if (mode === 'admin') return 'admin/login';
  return mode;
};

const getOAuthCallbackUrl = (provider: 'google' | 'apple') =>
  `${env.FRONTEND_URL}/api/auth/oauth/${provider}/callback`;

const setRefreshCookie = (res: Response, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_SESSION_TTL_MS,
  });
};

export const oauthStartHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const params = OAuthProviderParamsSchema.safeParse(req.params);
  const query = OAuthStartQuerySchema.parse(req.query);

  if (!params.success) {
    return next(new ServiceError('Unsupported sign in provider', 400));
  }

  const { provider } = params.data;
  const { mode } = query;

  if (provider === 'google') {
    if (!env.GOOGLE_CLIENT_ID) {
      return redirectWithError(
        res,
        'Google sign in is not configured yet',
        getOAuthErrorTarget(mode),
      );
    }

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: getOAuthCallbackUrl('google'),
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state: mode,
    });

    return res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  }

  if (provider === 'apple') {
    if (!env.APPLE_CLIENT_ID) {
      return redirectWithError(
        res,
        'Apple sign in is not configured yet',
        getOAuthErrorTarget(mode),
      );
    }

    const params = new URLSearchParams({
      client_id: env.APPLE_CLIENT_ID,
      redirect_uri: getOAuthCallbackUrl('apple'),
      response_type: 'code',
      scope: 'name email',
      response_mode: 'form_post',
      state: mode,
    });

    return res.redirect(
      `https://appleid.apple.com/auth/authorize?${params.toString()}`,
    );
  }

  next(new ServiceError('Unsupported sign in provider', 400));
};

interface GoogleTokenResponse {
  id_token?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  email?: string;
  name?: string;
  email_verified?: 'true' | 'false' | boolean;
  error_description?: string;
}

const redirectWithAuth = (
  res: Response,
  result: Awaited<ReturnType<typeof loginWithOAuth>>,
) => {
  setRefreshCookie(res, result.refreshToken);

  const params = new URLSearchParams({
    user: JSON.stringify(result.user),
    ...(result.user.role === 'admin' || result.user.role === 'staff'
      ? { redirectTo: '/admin/orders' }
      : {}),
  });

  return res.redirect(
    `${env.FRONTEND_URL}/oauth/callback#${params.toString()}`,
  );
};

export const oauthCallbackHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const params = OAuthProviderParamsSchema.safeParse(req.params);
  const query = OAuthCallbackQuerySchema.parse(req.query);
  const mode = query.state;
  const { code } = query;

  try {
    if (!params.success) {
      throw new ServiceError('Unsupported sign in provider', 400);
    }

    const { provider } = params.data;

    if (provider !== 'google') {
      throw new ServiceError('Unsupported sign in provider', 400);
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return redirectWithError(
        res,
        'Google sign in is not configured yet',
        getOAuthErrorTarget(mode),
      );
    }

    if (!code) {
      return redirectWithError(
        res,
        'Google did not return an authorization code',
        getOAuthErrorTarget(mode),
      );
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: getOAuthCallbackUrl('google'),
        grant_type: 'authorization_code',
      }),
    });

    const tokenBody = (await tokenRes.json()) as GoogleTokenResponse;

    if (!tokenRes.ok || !tokenBody.id_token) {
      return redirectWithError(
        res,
        tokenBody.error_description || 'Google token exchange failed',
        getOAuthErrorTarget(mode),
      );
    }

    const userInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenBody.id_token}`,
    );
    const userInfo = (await userInfoRes.json()) as GoogleUserInfo;

    if (!userInfoRes.ok || !userInfo.email) {
      return redirectWithError(
        res,
        userInfo.error_description || 'Google user lookup failed',
        getOAuthErrorTarget(mode),
      );
    }

    let result: Awaited<ReturnType<typeof loginWithOAuth>>;

    try {
      result = await loginWithOAuth({
        email: userInfo.email,
        name: userInfo.name ?? userInfo.email,
        emailVerified:
          userInfo.email_verified === true ||
          userInfo.email_verified === 'true',
        mode: mode === 'signup' ? 'signup' : 'login',
      });

      if (
        mode === 'admin' &&
        result.user.role !== 'admin' &&
        result.user.role !== 'staff'
      ) {
        return redirectWithError(
          res,
          'Admin access required',
          getOAuthErrorTarget(mode),
        );
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        return redirectWithError(res, error.message, getOAuthErrorTarget(mode));
      }

      throw error;
    }

    return redirectWithAuth(res, result);
  } catch (error) {
    next(error);
  }
};
