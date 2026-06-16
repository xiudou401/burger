import type { Response } from 'express';
import { setRefreshCookie } from './refresh-cookie';
import { sendAuthResult } from './auth-response';

jest.mock('./refresh-cookie', () => ({
  setRefreshCookie: jest.fn(),
}));

test('sets the refresh cookie without exposing it in the response body', () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status } as unknown as Response;

  sendAuthResult(res, 200, {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: 'user-123' },
  });

  expect(setRefreshCookie).toHaveBeenCalledWith(res, 'refresh-token');
  expect(status).toHaveBeenCalledWith(200);
  expect(json).toHaveBeenCalledWith({
    accessToken: 'access-token',
    user: { id: 'user-123' },
  });
});
