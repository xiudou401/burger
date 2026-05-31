import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';
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

export const signupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body as SignupPayload;
    const result = await authService.signup(name, email, password);

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
    const { email, password } = req.body as LoginPayload;
    const result = await authService.login(email, password);

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
    const { token } = req.body as VerifyEmailPayload;
    const result = await authService.verifyEmail(token);

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
    const { email } = req.body as ForgotPasswordPayload;
    const result = await authService.requestPasswordReset(email);

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
    const { token, password } = req.body as ResetPasswordPayload;
    const result = await authService.resetPassword(token, password);

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
    const { phone } = req.body as SendSmsCodePayload;
    const result = await authService.sendSmsCode(phone, req.user?.id);

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
    const { phone, code } = req.body as VerifySmsCodePayload;
    const result = await authService.verifySmsCode(phone, code);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
