import { expect, jest, test } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import {
  getResendVerificationRateLimitKey,
  verifyTrustedOrigin,
} from './security';

const makeRequest = (headers: Record<string, string | undefined>) =>
  ({
    get: jest.fn((name: string) => headers[name.toLowerCase()]),
  }) as unknown as Request;

test('allows trusted browser requests with the CSRF header', () => {
  const next = jest.fn() as NextFunction;
  const req = makeRequest({
    origin: env.FRONTEND_URL,
    'x-csrf-protection': '1',
  });

  verifyTrustedOrigin(req, {} as Response, next);

  expect(next).toHaveBeenCalledWith();
});

test('blocks untrusted request origins', () => {
  const next = jest.fn() as NextFunction;
  const req = makeRequest({
    origin: 'https://evil.example',
    'x-csrf-protection': '1',
  });

  verifyTrustedOrigin(req, {} as Response, next);

  expect(next).toHaveBeenCalledWith(expect.any(ServiceError));
  expect(jest.mocked(next).mock.calls[0][0]).toMatchObject({
    message: 'Invalid request origin',
    statusCode: 403,
  });
});

test('blocks requests without the CSRF header', () => {
  const next = jest.fn() as NextFunction;
  const req = makeRequest({
    origin: env.FRONTEND_URL,
  });

  verifyTrustedOrigin(req, {} as Response, next);

  expect(next).toHaveBeenCalledWith(expect.any(ServiceError));
  expect(jest.mocked(next).mock.calls[0][0]).toMatchObject({
    message: 'Invalid CSRF protection header',
    statusCode: 403,
  });
});

test('keys verification resend limits by user and email', () => {
  const req = {
    user: {
      id: 'user-123',
      name: 'Pat',
      role: 'customer',
      email: 'PAT@example.com',
      emailVerified: false,
      phoneVerified: false,
    },
  } as Request;

  expect(getResendVerificationRateLimitKey(req)).toBe(
    'user-123:pat@example.com',
  );
});
