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
