import type { NextFunction, Request, Response } from 'express';
import { errorHandler } from './errorHandler';

const mockResponse = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as unknown as Response;

test('returns a clear 413 response for oversized JSON bodies', () => {
  const res = mockResponse();

  errorHandler(
    { status: 413, type: 'entity.too.large' },
    {} as Request,
    res,
    jest.fn() as NextFunction,
  );

  expect(res.status).toHaveBeenCalledWith(413);
  expect(res.json).toHaveBeenCalledWith({
    message: 'Request body is too large',
    statusCode: 413,
    type: 'PayloadTooLargeError',
  });
});

test('maps Mongo duplicate email errors to a generic 409 response', () => {
  const res = mockResponse();

  errorHandler(
    { code: 11000, keyPattern: { email: 1 } },
    {} as Request,
    res,
    jest.fn() as NextFunction,
  );

  expect(res.status).toHaveBeenCalledWith(409);
  expect(res.json).toHaveBeenCalledWith({
    message: 'Could not create account with these details',
    statusCode: 409,
    type: 'DuplicateKeyError',
  });
});

test('maps Mongo duplicate phone errors to a stable 409 response', () => {
  const res = mockResponse();

  errorHandler(
    { code: 11000, keyPattern: { phone: 1 } },
    {} as Request,
    res,
    jest.fn() as NextFunction,
  );

  expect(res.status).toHaveBeenCalledWith(409);
  expect(res.json).toHaveBeenCalledWith({
    message: 'Phone is already linked to another account',
    statusCode: 409,
    type: 'DuplicateKeyError',
  });
});
