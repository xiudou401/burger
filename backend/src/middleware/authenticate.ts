import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { ServiceError } from '../errors/ServiceError';
import { verifyAuthToken } from '../utils/token';
import { getPermissionsForRole } from '../types/permissions';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      throw new ServiceError('Authorization token required', 401);
    }

    const payload = verifyAuthToken(token);
    const user = await UserModel.findById(payload.sub).lean();

    if (!user) {
      throw new ServiceError('User no longer exists', 401);
    }

    if (user.status === 'disabled') {
      throw new ServiceError('Account disabled', 403);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role ?? 'customer',
      permissions: getPermissionsForRole(user.role ?? 'customer'),
      status: user.status ?? 'active',
      emailVerified: user.emailVerified,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  return authenticate(req, res, next);
};
