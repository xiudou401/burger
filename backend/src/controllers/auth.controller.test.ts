import type { NextFunction, Request, Response } from 'express';
import { ConcurrentRefreshError } from '../errors/ConcurrentRefreshError';
import { ServiceError } from '../errors/ServiceError';
import { revokeAuthSession } from '../services/auth-session.service';
import { rotateAuthSession } from '../services/auth-session.service';
import { clearRefreshCookie, getRefreshToken } from '../utils/refresh-cookie';
import { logoutHandler, refreshHandler } from './auth.controller';

jest.mock('../services/auth-session.service', () => ({
  revokeAuthSession: jest.fn(),
  rotateAuthSession: jest.fn(),
}));

jest.mock('../utils/refresh-cookie', () => ({
  clearRefreshCookie: jest.fn(),
  getRefreshToken: jest.fn(),
}));

const mockResponse = () => {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  } as unknown as Response;
};

describe('auth controller logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getRefreshToken).mockReturnValue('refresh-token');
  });

  test('revokes the session, clears the cookie, and returns no content', async () => {
    const req = {} as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await logoutHandler(req, res, next);

    expect(revokeAuthSession).toHaveBeenCalledWith('refresh-token');
    expect(clearRefreshCookie).toHaveBeenCalledWith(res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('clears the cookie and forwards the error when revocation fails', async () => {
    const error = new Error('Database unavailable');
    jest.mocked(revokeAuthSession).mockRejectedValue(error);

    const req = {} as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await logoutHandler(req, res, next);

    expect(clearRefreshCookie).toHaveBeenCalledWith(res);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('auth controller refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getRefreshToken).mockReturnValue('refresh-token');
  });

  test('does not clear the cookie for a concurrent refresh conflict', async () => {
    const error = new ConcurrentRefreshError();
    jest.mocked(rotateAuthSession).mockRejectedValue(error);

    const req = {} as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await refreshHandler(req, res, next);

    expect(clearRefreshCookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  test('clears the cookie for an invalid refresh session', async () => {
    const error = new ServiceError('Session expired', 401);
    jest.mocked(rotateAuthSession).mockRejectedValue(error);

    const req = {} as Request;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    await refreshHandler(req, res, next);

    expect(clearRefreshCookie).toHaveBeenCalledWith(res);
    expect(next).toHaveBeenCalledWith(error);
  });
});
