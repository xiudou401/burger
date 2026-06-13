import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

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
