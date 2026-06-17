import type { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../errors/ServiceError';
import { requireVerifiedContact } from './requireVerifiedContact';

const makeRequest = (overrides: Partial<NonNullable<Request['user']>> = {}) =>
  ({
    user: {
      id: 'user-123',
      name: 'Pat',
      role: 'customer',
      emailVerified: false,
      phoneVerified: false,
      ...overrides,
    },
  }) as Request;

test('allows users with a verified email', () => {
  const next = jest.fn() as NextFunction;

  requireVerifiedContact(
    makeRequest({ emailVerified: true }),
    {} as Response,
    next,
  );

  expect(next).toHaveBeenCalledWith();
});

test('allows users with a verified phone', () => {
  const next = jest.fn() as NextFunction;

  requireVerifiedContact(
    makeRequest({ phoneVerified: true }),
    {} as Response,
    next,
  );

  expect(next).toHaveBeenCalledWith();
});

test('blocks users without a verified contact method', () => {
  const next = jest.fn() as NextFunction;

  requireVerifiedContact(makeRequest(), {} as Response, next);

  expect(next).toHaveBeenCalledWith(expect.any(ServiceError));
  expect(jest.mocked(next).mock.calls[0][0]).toMatchObject({
    message: 'Please verify your email or phone before placing an order',
    statusCode: 403,
  });
});
