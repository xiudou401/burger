import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../config/env';
import type { AuthTokenPayload } from '../types/auth';
import { ServiceError } from '../errors/ServiceError';
import { TTL_SECONDS } from '../config/ttl';

const toBase64Url = (value: string | Buffer) => {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const signValue = (value: string) => {
  return toBase64Url(
    createHmac('sha256', env.JWT_SECRET).update(value).digest(),
  );
};

const safeCompare = (actual: string, expected: string) => {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

const isTokenHeader = (
  header: unknown,
): header is { alg: 'HS256'; typ: 'JWT' } => {
  if (!header || typeof header !== 'object') {
    return false;
  }

  const candidate = header as { alg?: unknown; typ?: unknown };

  return candidate.alg === 'HS256' && candidate.typ === 'JWT';
};

const isTokenPayload = (payload: unknown): payload is AuthTokenPayload => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as {
    sub?: unknown;
    exp?: unknown;
    iat?: unknown;
  };

  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.exp === 'number' &&
    typeof candidate.iat === 'number'
  );
};

export const signAuthToken = (
  payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
) => {
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + TTL_SECONDS.ACCESS_TOKEN,
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

  if (!safeCompare(signature, expectedSignature)) {
    throw new ServiceError('Invalid token', 401);
  }

  let parsedHeader: unknown;
  let payload: AuthTokenPayload;

  try {
    parsedHeader = JSON.parse(
      Buffer.from(header, 'base64url').toString('utf8'),
    );
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    throw new ServiceError('Invalid token', 401);
  }

  if (!isTokenHeader(parsedHeader) || !isTokenPayload(payload)) {
    throw new ServiceError('Invalid token', 401);
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new ServiceError('Token expired', 401);
  }

  return payload;
};
