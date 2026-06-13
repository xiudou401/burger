import { Request, Response, NextFunction } from 'express';

import { BaseError } from '../errors/BaseError';
import { ValidationError } from '../errors/ValidationError';

const isPayloadTooLargeError = (
  error: unknown,
): error is { status: number; type: string } => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { status?: unknown; type?: unknown };

  return candidate.status === 413 && candidate.type === 'entity.too.large';
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (isPayloadTooLargeError(err)) {
    return res.status(413).json({
      message: 'Request body is too large',
      statusCode: 413,
      type: 'PayloadTooLargeError',
    });
  }

  if (err instanceof BaseError) {
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

  console.error('Unknown error:', err);

  return res.status(500).json({
    message: 'Internal server error',
    statusCode: 500,
    type: 'UnknownError',
  });
};
