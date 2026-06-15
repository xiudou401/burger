import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import {
  REFRESH_SESSION_TTL_MS,
  revokeAuthSession,
  rotateAuthSession,
} from '../services/auth-session.service';
import { ServiceError } from '../errors/ServiceError';
import type {
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SendSmsCodePayload,
  SignupPayload,
  VerifyEmailPayload,
  VerifySmsCodePayload,
} from '../validation/auth.schema';

const REFRESH_COOKIE_NAME = 'refreshToken';
const isProduction = process.env.NODE_ENV === 'production';

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_SESSION_TTL_MS,
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
  });
};

const getCookie = (req: Request, name: string) => {
  const rawCookie = req.headers.cookie;

  if (!rawCookie) {
    return '';
  }

  const cookies = rawCookie.split(';').map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return target ? decodeURIComponent(target.slice(name.length + 1)) : '';
};

const sendAuthResult = (
  res: Response,
  status: number,
  result: Awaited<ReturnType<typeof authService.login>>,
) => {
  setRefreshCookie(res, result.refreshToken);
  const { refreshToken: _refreshToken, ...body } = result;

  return res.status(status).json(body);
};

export const signupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.signup(req.body as SignupPayload);

    sendAuthResult(res, 201, result);
  } catch (error) {
    next(error);
  }
};

export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.login(req.body as LoginPayload);

    sendAuthResult(res, 200, result);
  } catch (error) {
    next(error);
  }
};

export const refreshHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await rotateAuthSession(getCookie(req, REFRESH_COOKIE_NAME));

    sendAuthResult(res, 200, result);
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
};

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await revokeAuthSession(getCookie(req, REFRESH_COOKIE_NAME));
    clearRefreshCookie(res);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const meHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  return res.status(200).json({
    user: req.user,
  });
};

export const verifyEmailHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.verifyEmail(
      req.body as VerifyEmailPayload,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resendVerificationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new ServiceError('Unauthorized', 401));
  }

  try {
    const result = await authService.resendVerificationEmail(req.user.id);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.requestPasswordReset(
      req.body as ForgotPasswordPayload,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.resetPassword(
      req.body as ResetPasswordPayload,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const sendSmsCodeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.sendSmsCode(
      req.body as SendSmsCodePayload,
      req.user?.id,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifySmsCodeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.verifySmsCode(
      req.body as VerifySmsCodePayload,
    );

    sendAuthResult(res, 200, result);
  } catch (error) {
    next(error);
  }
};
