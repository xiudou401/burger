import { EventEmitter } from 'events';
import type { NextFunction, Request, Response } from 'express';
import { logger } from './logger';

const mockResponse = () => {
  const emitter = new EventEmitter();

  return Object.assign(emitter, {
    statusCode: 200,
    setHeader: jest.fn(),
  }) as unknown as Response & EventEmitter;
};

describe('request logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('reuses incoming request ids and logs structured request metadata', () => {
    const req = {
      headers: {
        'x-request-id': 'req-client-123',
      },
      method: 'GET',
      originalUrl: '/api/orders/admin/all',
      user: {
        id: 'user-123',
      },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    logger(req, res, next);
    res.emit('finish');

    expect(req.requestId).toBe('req-client-123');
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      'req-client-123',
    );
    expect(next).toHaveBeenCalledWith();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('"event":"http_request"'),
    );

    const log = JSON.parse(jest.mocked(console.log).mock.calls[0][0]);

    expect(log).toMatchObject({
      level: 'info',
      event: 'http_request',
      requestId: 'req-client-123',
      method: 'GET',
      path: '/api/orders/admin/all',
      statusCode: 200,
      userId: 'user-123',
    });
    expect(log.durationMs).toEqual(expect.any(Number));
  });
});
