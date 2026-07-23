import type { NextFunction, Request, Response } from 'express';
import { errorHandler } from './errorHandler';
import { ServiceError } from '../errors/ServiceError';

const mockRequest = (overrides: Partial<Request> = {}) =>
  ({
    requestId: 'req-test-123',
    method: 'POST',
    originalUrl: '/api/test',
    ...overrides,
  }) as Request;

const mockResponse = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as unknown as Response;

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('returns a clear 413 response for oversized JSON bodies', () => {
  const res = mockResponse();

  errorHandler(
    { status: 413, type: 'entity.too.large' },
    mockRequest(),
    res,
    jest.fn() as NextFunction,
  );

  expect(res.status).toHaveBeenCalledWith(413);
  expect(res.json).toHaveBeenCalledWith({
    message: 'Request body is too large',
    statusCode: 413,
    type: 'PayloadTooLargeError',
    requestId: 'req-test-123',
  });
});

test('maps Mongo duplicate email errors to a generic 409 response', () => {
  const res = mockResponse();

  errorHandler(
    { code: 11000, keyPattern: { email: 1 } },
    mockRequest(),
    res,
    jest.fn() as NextFunction,
  );

  expect(res.status).toHaveBeenCalledWith(409);
  expect(res.json).toHaveBeenCalledWith({
    message: 'Could not create account with these details',
    statusCode: 409,
    type: 'DuplicateKeyError',
    requestId: 'req-test-123',
  });
});

test('maps Mongo duplicate phone errors to a stable 409 response', () => {
  const res = mockResponse();

  errorHandler(
    { code: 11000, keyPattern: { phone: 1 } },
    mockRequest(),
    res,
    jest.fn() as NextFunction,
  );

  expect(res.status).toHaveBeenCalledWith(409);
  expect(res.json).toHaveBeenCalledWith({
    message: 'Phone is already linked to another account',
    statusCode: 409,
    type: 'DuplicateKeyError',
    requestId: 'req-test-123',
  });
});

test('includes service error details in operational responses', () => {
  const res = mockResponse();

  errorHandler(
    new ServiceError('Menu item removed', 400, {
      itemId: '64f1b2c3d4e5f67890123456',
    }),
    mockRequest(),
    res,
    jest.fn() as NextFunction,
  );

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    message: 'Menu item removed',
    statusCode: 400,
    type: 'ServiceError',
    requestId: 'req-test-123',
    details: {
      itemId: '64f1b2c3d4e5f67890123456',
    },
  });
});
