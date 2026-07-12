import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

import { appLogger } from '../utils/logger';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  const incomingRequestId = req.headers['x-request-id'];
  const requestId =
    typeof incomingRequestId === 'string' && incomingRequestId.trim()
      ? incomingRequestId.trim().slice(0, 128)
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    appLogger.info('http_request', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id,
    });
  });

  next();
};
