import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { ServiceError } from '../errors/ServiceError';
import { verifyAuthToken } from '../utils/token';

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

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    };

    next();
  } catch (error) {
    next(error);
  }
};
