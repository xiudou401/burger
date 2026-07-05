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

const isMongoDuplicateKeyError = (
  error: unknown,
): error is { code: number; keyPattern?: Record<string, unknown> } => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: unknown; keyPattern?: unknown };

  return candidate.code === 11000;
};

const getDuplicateKeyMessage = (error: {
  keyPattern?: Record<string, unknown>;
}) => {
  if (error.keyPattern?.email) {
    return 'Could not create account with these details';
  }

  if (error.keyPattern?.phone) {
    return 'Phone is already linked to another account';
  }

  return 'Duplicate value already exists';
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

  if (isMongoDuplicateKeyError(err)) {
    return res.status(409).json({
      message: getDuplicateKeyMessage(err),
      statusCode: 409,
      type: 'DuplicateKeyError',
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
