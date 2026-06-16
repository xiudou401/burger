import type { Response } from 'express';
import { setRefreshCookie } from './refresh-cookie';

interface AuthResultWithRefreshToken {
  refreshToken: string;
}

export const sendAuthResult = <T extends AuthResultWithRefreshToken>(
  res: Response,
  status: number,
  result: T,
) => {
  setRefreshCookie(res, result.refreshToken);
  const { refreshToken: _refreshToken, ...body } = result;

  return res.status(status).json(body);
};
