import { Request, Response, NextFunction } from 'express';

import { BaseError } from '../errors/BaseError';
import { ServiceError } from '../errors/ServiceError';
import { ValidationError } from '../errors/ValidationError';
import { appLogger } from '../utils/logger';

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
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const requestId = req.requestId ?? 'unknown';

  const logError = (statusCode: number, type: string, message: string) => {
    const log = statusCode >= 500 ? appLogger.error : appLogger.warn;

    log('http_error', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      userId: req.user?.id,
      errorType: type,
      message,
    });
  };

  if (isPayloadTooLargeError(err)) {
    logError(413, 'PayloadTooLargeError', 'Request body is too large');

    return res.status(413).json({
      message: 'Request body is too large',
      statusCode: 413,
      type: 'PayloadTooLargeError',
      requestId,
    });
  }

  if (isMongoDuplicateKeyError(err)) {
    const message = getDuplicateKeyMessage(err);
    logError(409, 'DuplicateKeyError', message);

    return res.status(409).json({
      message,
      statusCode: 409,
      type: 'DuplicateKeyError',
      requestId,
    });
  }

  if (err instanceof BaseError) {
    if (!err.isOperational) {
      appLogger.error('critical_error', {
        requestId,
        error: err,
      });
    }

    const body: {
      message: string;
      statusCode: number;
      type: string;
      requestId: string;
      issues?: ValidationError['issues'];
      details?: Record<string, unknown>;
    } = {
      message: err.isOperational ? err.message : 'Internal server error',
      statusCode: err.statusCode,
      type: err.constructor.name,
      requestId,
    };

    if (err instanceof ValidationError) {
      body.issues = err.issues;
    }

    if (err instanceof ServiceError && err.details) {
      body.details = err.details;
    }

    logError(err.statusCode, err.constructor.name, body.message);

    return res.status(err.statusCode).json(body);
  }

  logError(500, 'UnknownError', 'Internal server error');

  return res.status(500).json({
    message: 'Internal server error',
    statusCode: 500,
    type: 'UnknownError',
    requestId,
  });
};
