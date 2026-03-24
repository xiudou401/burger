import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ServiceError } from '../errors/ServiceError';
import { InfrastructureError } from '../errors/InfrastructureError';
import { BaseError } from '../errors/BaseError';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof BaseError) {
    // 🔥 统一处理
    if (!err.isOperational) {
      console.error('Critical error:', err);
    }

    return res.status(err.statusCode).json({
      message: err.isOperational ? err.message : 'Internal server error',
      statusCode: err.statusCode,
      type: err.constructor.name,
    });
  }

  // ❗未知错误
  console.error('Unknown error:', err);

  return res.status(500).json({
    message: 'Internal server error',
    statusCode: 500,
    type: 'UnknownError',
  });
};
