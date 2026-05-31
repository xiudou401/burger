import { Request, Response, NextFunction } from 'express';

import { BaseError } from '../errors/BaseError';
import { ValidationError } from '../errors/ValidationError';

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

    const body: {
      message: string;
      statusCode: number;
      type: string;
      issues?: ValidationError['issues'];
    } = {
      message: err.isOperational ? err.message : 'Internal server error',
      statusCode: err.statusCode,
      type: err.constructor.name,
    };

    if (err instanceof ValidationError) {
      body.issues = err.issues;
    }

    return res.status(err.statusCode).json(body);
  }

  // ❗未知错误
  console.error('Unknown error:', err);

  return res.status(500).json({
    message: 'Internal server error',
    statusCode: 500,
    type: 'UnknownError',
  });
};
