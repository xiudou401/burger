import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const CSRF_PROTECTION_HEADER = 'X-CSRF-Protection';
const CSRF_PROTECTION_VALUE = '1';

export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  strictTransportSecurity:
    process.env.NODE_ENV === 'production' ? undefined : false,
});

export const apiRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please try again shortly.',
    statusCode: 429,
    type: 'RateLimitError',
  },
});

export const authAttemptRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again later.',
    statusCode: 429,
    type: 'RateLimitError',
  },
});

export const authActionRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many requests for this action. Please try again later.',
    statusCode: 429,
    type: 'RateLimitError',
  },
});

export const refreshSessionRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many session refresh attempts. Please try again later.',
    statusCode: 429,
    type: 'RateLimitError',
  },
});

export const getResendVerificationRateLimitKey = (req: Request) => {
  const userId = req.user?.id ?? 'anonymous';
  const email = req.user?.email?.toLowerCase() ?? 'no-email';

  return `${userId}:${email}`;
};

export const resendVerificationRateLimiter = rateLimit({
  windowMs: HOUR_MS,
  limit: 3,
  keyGenerator: getResendVerificationRateLimitKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many verification emails. Please try again later.',
    statusCode: 429,
    type: 'RateLimitError',
  },
});

export const verifyTrustedOrigin = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const origin = req.get('origin');

  if (origin !== env.FRONTEND_URL) {
    return next(new ServiceError('Invalid request origin', 403));
  }

  if (req.get(CSRF_PROTECTION_HEADER) !== CSRF_PROTECTION_VALUE) {
    return next(new ServiceError('Invalid CSRF protection header', 403));
  }

  return next();
};
