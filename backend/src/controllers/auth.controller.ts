import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { ServiceError } from '../errors/ServiceError';

const getString = (value: unknown) => {
  return typeof value === 'string' ? value : '';
};

export const signupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.signup(
      getString(req.body?.name),
      getString(req.body?.email),
      getString(req.body?.password),
    );

    res.status(201).json(result);
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
    const result = await authService.login(
      getString(req.body?.email),
      getString(req.body?.password),
    );

    res.status(200).json(result);
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
    const result = await authService.verifyEmail(getString(req.body?.token));

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
      getString(req.body?.email),
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
      getString(req.body?.token),
      getString(req.body?.password),
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
