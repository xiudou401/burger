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
