import { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import { loginWithOAuth } from '../services/auth.service';
import {
  clearOAuthStateCookie,
  createOAuthState,
  isOAuthStateValid,
  parseOAuthStateMode,
  setOAuthStateCookie,
} from '../utils/oauth-state-cookie';
import { setRefreshCookie } from '../utils/refresh-cookie';
import {
  OAuthCallbackQuerySchema,
  OAuthProviderParamsSchema,
  OAuthStartQuerySchema,
} from '../validation/oauth.schema';
import type { OAuthStartQueryPayload } from '../validation/oauth.schema';
import { hasPermission } from '../types/permissions';

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
  `${env.API_URL}/api/auth/oauth/${provider}/callback`;

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

    const state = createOAuthState(mode);
    setOAuthStateCookie(res, state);

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: getOAuthCallbackUrl('google'),
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    });

    return res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    );
  }

  if (provider === 'apple') {
    return redirectWithError(
      res,
      'Apple sign in is planned but not implemented yet',
      getOAuthErrorTarget(mode),
    );
  }

  next(new ServiceError('Unsupported sign in provider', 400));
};

interface GoogleTokenResponse {
  id_token?: string;
  error_description?: string;
}

const googleOAuthClient = new OAuth2Client();
const GOOGLE_ISSUERS = new Set([
  'accounts.google.com',
  'https://accounts.google.com',
]);

const verifyGoogleIdToken = async (idToken: string) => {
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.email) {
    throw new ServiceError('Google did not return a verified email', 400);
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

  if (!env.GOOGLE_CLIENT_ID || !audiences.includes(env.GOOGLE_CLIENT_ID)) {
    throw new ServiceError('Google token audience is invalid', 400);
  }

  if (!payload.iss || !GOOGLE_ISSUERS.has(payload.iss)) {
    throw new ServiceError('Google token issuer is invalid', 400);
  }

  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
    throw new ServiceError('Google token is expired', 400);
  }

  if (payload.email_verified !== true) {
    throw new ServiceError('Google email must be verified', 400);
  }

  return {
    email: payload.email,
    name: payload.name ?? payload.email,
    emailVerified: true,
  };
};

const redirectWithAuth = (
  res: Response,
  result: Awaited<ReturnType<typeof loginWithOAuth>>,
) => {
  setRefreshCookie(res, result.refreshToken);

  const params = new URLSearchParams({
    ...(hasPermission(result.user, 'view_orders')
      ? { redirectTo: '/admin/dashboard' }
      : {}),
  });
  const hash = params.size > 0 ? `#${params.toString()}` : '';

  return res.redirect(`${env.FRONTEND_URL}/oauth/callback${hash}`);
};

export const oauthCallbackHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const params = OAuthProviderParamsSchema.safeParse(req.params);
  const query = OAuthCallbackQuerySchema.parse(req.query);
  const returnedState = query.state ?? '';
  const mode = parseOAuthStateMode(returnedState) ?? 'login';
  const { code } = query;

  try {
    if (!params.success) {
      throw new ServiceError('Unsupported sign in provider', 400);
    }

    if (!isOAuthStateValid(req, returnedState)) {
      clearOAuthStateCookie(res);
      return redirectWithError(
        res,
        'Could not verify sign in request',
        'login',
      );
    }

    clearOAuthStateCookie(res);

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

    let googleUser: Awaited<ReturnType<typeof verifyGoogleIdToken>>;

    try {
      googleUser = await verifyGoogleIdToken(tokenBody.id_token);
    } catch (error) {
      const message =
        error instanceof ServiceError
          ? error.message
          : 'Google token verification failed';
      return redirectWithError(res, message, getOAuthErrorTarget(mode));
    }

    let result: Awaited<ReturnType<typeof loginWithOAuth>>;

    try {
      result = await loginWithOAuth({
        email: googleUser.email,
        name: googleUser.name,
        emailVerified: googleUser.emailVerified,
        mode:
          mode === 'signup' ? 'signup' : mode === 'admin' ? 'admin' : 'login',
      });

      if (mode === 'admin' && !hasPermission(result.user, 'view_orders')) {
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
