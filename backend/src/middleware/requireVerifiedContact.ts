import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../errors/ServiceError';

export const requireVerifiedContact = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.user?.emailVerified) {
    return next(
      new ServiceError('Please verify your email before placing an order', 403),
    );
  }

  return next();
};
