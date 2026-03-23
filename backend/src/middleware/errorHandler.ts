import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ServiceError } from '../errors/ServiceError';
import { InfrastructureError } from '../errors/InfrastructureError';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // ✅ AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      statusCode: err.statusCode,
      type: 'AppError',
    });
  }

  // ✅ ServiceError（业务错误）
  if (err instanceof ServiceError) {
    console.warn('Service error:', err.message);

    return res.status(err.statusCode).json({
      message: err.message,
      statusCode: err.statusCode,
      type: 'ServiceError', // ⭐ 很关键
    });
  }

  // ✅ InfrastructureError（不暴露细节）
  if (err instanceof InfrastructureError) {
    console.error('Infrastructure error:', err);

    return res.status(500).json({
      message: 'Internal server error',
      statusCode: 500,
      type: 'InfrastructureError',
    });
  }

  // ✅ fallback
  console.error('Unknown error:', err);

  res.status(500).json({
    message: 'Internal server error',
    statusCode: 500,
    type: 'UnknownError',
  });
};
