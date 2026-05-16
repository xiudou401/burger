import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../errors/ServiceError';

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
    return next(new ServiceError('Admin access required', 403));
  }

  return next();
};

export const requireAdminRole = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== 'admin') {
    return next(new ServiceError('Admin access required', 403));
  }

  return next();
};
