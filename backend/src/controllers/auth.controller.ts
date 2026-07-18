import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import {
  revokeAuthSession,
  rotateAuthSession,
} from '../services/auth-session.service';
import { ServiceError } from '../errors/ServiceError';
import { ConcurrentRefreshError } from '../errors/ConcurrentRefreshError';
import { clearRefreshCookie, getRefreshToken } from '../utils/refresh-cookie';
import { sendAuthResult } from '../utils/auth-response';
import type {
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SendSmsCodePayload,
  SignupPayload,
  VerifyEmailPayload,
  VerifySmsCodePayload,
} from '../validation/auth.schema';

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

export const adminLoginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.adminLogin(req.body as LoginPayload);

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
    const result = await rotateAuthSession(getRefreshToken(req));

    sendAuthResult(res, 200, result);
  } catch (error) {
    if (!(error instanceof ConcurrentRefreshError)) {
      clearRefreshCookie(res);
    }

    return next(error);
  }
};

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await revokeAuthSession(getRefreshToken(req));
    clearRefreshCookie(res);

    return res.status(204).send();
  } catch (error) {
    clearRefreshCookie(res);
    return next(error);
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
