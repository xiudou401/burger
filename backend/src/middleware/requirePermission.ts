import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../errors/ServiceError';
import { hasPermission, Permission } from '../types/permissions';

export const requirePermission =
  (permission: Permission, message = 'Permission required') =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!hasPermission(req.user, permission)) {
      return next(new ServiceError(message, 403));
    }

    return next();
  };
