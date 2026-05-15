import { createHmac } from 'crypto';
import { env } from '../config/env';
import type { AuthTokenPayload } from '../types/auth';
import { ServiceError } from '../errors/ServiceError';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const toBase64Url = (value: string | Buffer) => {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const signValue = (value: string) => {
  return toBase64Url(createHmac('sha256', env.JWT_SECRET).update(value).digest());
};

export const signAuthToken = (payload: Omit<AuthTokenPayload, 'iat' | 'exp'>) => {
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    }),
  );
  const unsignedToken = `${header}.${body}`;

  return `${unsignedToken}.${signValue(unsignedToken)}`;
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  const [header, body, signature] = token.split('.');

  if (!header || !body || !signature) {
    throw new ServiceError('Invalid token', 401);
  }

  const expectedSignature = signValue(`${header}.${body}`);

  if (signature !== expectedSignature) {
    throw new ServiceError('Invalid token', 401);
  }

  let payload: AuthTokenPayload;

  try {
    payload = JSON.parse(Buffer.from(body, 'base64').toString('utf8'));
  } catch {
    throw new ServiceError('Invalid token', 401);
  }

  if (!payload.sub || !payload.exp) {
    throw new ServiceError('Invalid token', 401);
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new ServiceError('Token expired', 401);
  }

  return payload;
};
